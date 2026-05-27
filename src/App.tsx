/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Bell, 
  LogOut, 
  User as UserIcon, 
  Sparkles, 
  ShieldAlert, 
  GraduationCap, 
  Compass, 
  QrCode,
  CheckCircle,
  XCircle,
  Clock3,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { User, PassRequest, UserRole, NotificationItem } from "./types";
import { dbService } from "./services/dbService";

import AuthScreen from "./components/AuthScreen";
import HomeTab from "./components/HomeTab";
import CreatePassTab from "./components/CreatePassTab";
import TrackPassTab from "./components/TrackPassTab";
import ProfileTab from "./components/ProfileTab";
import FacultyPanel from "./components/FacultyPanel";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<PassRequest[]>([]);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [initialSelectedId, setInitialSelectedId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationTray, setShowNotificationTray] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "loading" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error" | "loading", duration = 3000) => {
    setToast({ message, type });
    if (type !== "loading") {
      setTimeout(() => setToast(null), duration);
    }
  };

  // Load persistence session
  useEffect(() => {
    const savedUser = localStorage.getItem("epass_session_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as User;
      setCurrentUser(parsedUser);
    }
  }, []);

  // Real-time listener subscription based on active user role
  useEffect(() => {
    if (!currentUser) {
      setRequests([]);
      return;
    }

    const unsubscribe = dbService.subscribeRequests(
      currentUser.role,
      currentUser.uid,
      currentUser.branch,
      (updatedList) => {
        setRequests(updatedList);
      },
      (err) => {
        console.error("Real-time observer stream failed: ", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Real-time notifications listener subscription based on active role
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const unsubscribe = dbService.subscribeNotifications(
      currentUser.role,
      currentUser.uid,
      currentUser.branch,
      (updatedList) => {
        setNotifications(updatedList);
      },
      (err) => {
        console.error("Real-time notifications listener failed: ", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleLoginSuccess = async (
    email: string,
    role: UserRole,
    customName: string,
    roll?: string,
    branch?: string,
    tgName?: string
  ) => {
    // Standard ID generator or retrieval
    const cleanUid = role === "student" ? (roll === "CS2021088" ? "student_2" : `student_${Date.now()}`) : (`faculty_${role}_${Date.now()}`);
    
    const userProfile: User = {
      uid: cleanUid,
      email,
      name: customName,
      role,
      rollNumber: roll,
      branch: branch || "CYBER",
      tgName: tgName || "Yogesh Kumar Sharma"
    };

    // Save profile inside both LocalStorage / Firestore Adapter
    await dbService.saveUserProfile(userProfile);
    
    // Store active session token
    localStorage.setItem("epass_session_user", JSON.stringify(userProfile));
    
    setCurrentUser(userProfile);
    
    // Trigger notification
    addNotification(
      `Access Approved`,
      `Signed in successfully as ${userProfile.name} (${role.toUpperCase()})`
    );

    // Default tab
    setActiveTab("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("epass_session_user");
    setCurrentUser(null);
    setRequests([]);
    setActiveTab("home");
    setInitialSelectedId(null);
    setNotifications([]);
    setShowNotificationTray(false);
  };

  const addNotification = (title: string, message: string) => {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      time: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newItem, ...prev]);
  };

  const handleCreatePassRequest = async (payload: {
    destination: string;
    reason: string;
    leaveDate: string;
    leaveTime: string;
    returnDate: string;
    returnTime: string;
  }) => {
    if (!currentUser) return;
    
    // Create requests using db adaptors
    const newRequest = await dbService.createRequest(currentUser, payload);
    
    // Show success toast
    triggerToast("Pass Request Submitted", "success");
    
    // Notification push
    addNotification(
      "Gate Request Generated",
      `Pass to "${payload.destination}" successfully filed. Awaiting TG review.`
    );

    // Switch tab to tracking list automatically
    setInitialSelectedId(newRequest.id);
    setActiveTab("track");
  };

  const handleDecisionAction = async (requestId: string, actionType: "admin_tg" | "admin_hod" | "reject", remarks: string) => {
    if (!currentUser || currentUser.role === "student") return;

    try {
      const isReject = actionType === "reject";
      triggerToast(isReject ? "Rejecting request..." : "Registering approval...", "loading");

      // Update DB record
      await dbService.updateRequestStatus(
        requestId,
        actionType,
        true,
        remarks,
        currentUser.uid
      );

      // Trigger standard requested toasts!
      if (actionType === "admin_tg") {
        triggerToast("TG Approved Successfully", "success");
      } else if (actionType === "admin_hod") {
        triggerToast("HOD Approved Successfully", "success");
      } else {
        triggerToast("Request Rejected", "error");
      }

      // Notification
      addNotification(
        !isReject ? "Gate Pass Endorsed" : "Gate Request Disallowed",
        `Assigned decision on student query: ${requestId}`
      );
    } catch (err) {
      console.error(err);
      triggerToast("Operation failed.", "error");
      throw err;
    }
  };

  const handleNotificationAction = async (notif: NotificationItem, actionType: "admin_tg" | "admin_hod" | "reject") => {
    if (!currentUser || !notif.requestId) return;
    try {
      const remarks = actionType === 'admin_tg' 
        ? 'TG Approved via notification panel.' 
        : actionType === 'admin_hod' 
        ? 'Approved via notification panel.' 
        : 'Rejected via notification panel.';

      triggerToast(actionType === 'reject' ? "Rejecting request..." : "Registering approval...", "loading");

      await dbService.updateRequestStatus(
        notif.requestId,
        actionType,
        true,
        remarks,
        currentUser.uid
      );

      if (actionType === "admin_tg") {
        triggerToast("TG Approved Successfully", "success");
      } else if (actionType === "admin_hod") {
        triggerToast("HOD Approved Successfully", "success");
      } else {
        triggerToast("Request Rejected", "error");
      }

      addNotification(
        actionType !== "reject" ? "Authorization Registered" : "Request Disallowed",
        `Short-action endorsement logged for ${notif.studentName}`
      );
    } catch (err) {
      console.error(err);
      triggerToast("Failed to process transaction.", "error");
    }
  };

  const approveTG = async (passId: string) => {
    try {
      triggerToast("Registering TG approval...", "loading");
      await dbService.approveTG(passId, currentUser?.uid);
      triggerToast("TG Approved Successfully", "success");
    } catch (error) {
      console.log("TG Approval Error:", error);
      triggerToast("TG Approval Failed", "error");
    }
  };

  const approveHOD = async (passId: string) => {
    try {
      triggerToast("Registering HOD approval...", "loading");
      await dbService.approveHOD(passId, currentUser?.uid);
      triggerToast("HOD Approved Successfully", "success");
    } catch (error) {
      console.log("HOD Approval Error:", error);
      triggerToast("HOD Approval Failed", "error");
    }
  };

  const triggerTrackIdLink = (reqId: string) => {
    setInitialSelectedId(reqId);
    setActiveTab("track");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-gray-100/50 flex flex-col items-center justify-start text-gray-800">
      {/* Container simulating high fidelity mobile Android context */}
      <div className="w-full max-w-md min-h-screen bg-white flex flex-col shadow-2xl relative overflow-x-hidden border-x border-gray-100">
        
        {/* Top App bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3.5 flex justify-between items-center shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-500/10">
              EP
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-950 tracking-tight leading-none flex items-center space-x-1">
                <span>E-Pass Mobile</span>
                {currentUser && (
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide ml-1.5 ${
                    currentUser.role === 'student' ? 'bg-blue-100 text-blue-700' :
                    currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                    currentUser.role === 'tg' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {currentUser.role}
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-medium">Digital Gate out Clearance</p>
            </div>
          </div>

          {/* Header Controls (Notification tray toggle & Switch Role shortcuts) */}
          <div className="flex items-center space-x-2">
            {currentUser && (
              <>
                {/* Notification Bell */}
                <button
                  id="notif-bell-btn"
                  onClick={() => {
                    setShowNotificationTray(!showNotificationTray);
                    if (!showNotificationTray) markAllNotificationsAsRead();
                  }}
                  className="w-9 h-9 hover:bg-gray-150 rounded-xl flex items-center justify-center text-gray-600 relative transition-colors cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                </button>

                {/* Instant signout toggle */}
                <button
                  id="top-logout-btn"
                  onClick={handleLogout}
                  title="Logout"
                  className="w-9 h-9 hover:bg-rose-50 hover:text-rose-600 rounded-xl flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Global Toast Alert */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-16 left-4 right-4 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg border text-xs font-bold text-white pointer-events-auto ${
                toast.type === "success" ? "bg-emerald-600 border-emerald-500" :
                toast.type === "error" ? "bg-rose-600 border-rose-500" : "bg-blue-600 border-blue-500"
              }`}>
                {toast.type === "loading" && (
                  <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {toast.type === "success" && <Check className="w-4 h-4 text-white shrink-0" />}
                <span>{toast.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications Slider Tray */}
        <AnimatePresence>
          {showNotificationTray && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 border-b border-gray-150 overflow-hidden text-xs absolute top-[57px] left-0 right-0 z-30 shadow-lg"
            >
              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-1 border-b border-gray-200">
                  <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">Pass Notifications Logs</span>
                  <button 
                    onClick={() => setNotifications([])} 
                    className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-2.5">
                    {notifications.map((notif) => {
                      const isPending = notif.status === "pending" || notif.status === "Pending" || notif.status === "TG Approved";
                      const showButtons = !!notif.requestId;

                      const linkedPass = requests.find(r => r.id === notif.requestId);
                      const isTGApproved = linkedPass ? (linkedPass.tgApproved || linkedPass.status === "TG Approved" || linkedPass.status === "Approved") : (notif.status === "TG Approved" || notif.status === "Approved");
                      const isHODApproved = linkedPass ? (linkedPass.hodApproved || linkedPass.status === "Approved") : (notif.status === "Approved");

                      const pass = {
                        id: notif.requestId || notif.id,
                        tgApproved: isTGApproved,
                        hodApproved: isHODApproved,
                        destination: notif.reason || "Outing"
                      };

                      return (
                        <div key={notif.id} id={`notif-card-${notif.id}`} className="bg-white border border-gray-150 rounded-xl p-3 space-y-2.5 shadow-xs">
                          <div className="flex items-start space-x-2.5">
                            <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${(!pass.hodApproved) ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></div>
                            <div className="flex-1 space-y-0.5">
                              <p className="font-bold text-gray-800 text-[11px] leading-tight text-left">{notif.title}</p>
                              <p className="text-gray-500 text-[10px] leading-relaxed text-left">{notif.message}</p>
                              
                              {/* Metadata list */}
                              {(notif.studentName || notif.reason || notif.dateTime) && (
                                <div className="mt-2 text-[10px] bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-1">
                                  {notif.studentName && (
                                    <div className="text-left"><span className="text-gray-400">Student:</span> <span className="font-semibold text-gray-700">{notif.studentName}</span></div>
                                  )}
                                  {notif.reason && (
                                    <div className="text-left"><span className="text-gray-400">Reason:</span> <span className="font-medium text-gray-600 italic">"{notif.reason}"</span></div>
                                  )}
                                  {notif.dateTime && (
                                    <div className="text-left"><span className="text-gray-400">Date/Time:</span> <span className="font-mono text-gray-700">{notif.dateTime}</span></div>
                                  )}
                                  <div className="flex items-center space-x-1.5 pt-0.5">
                                    <span className="text-gray-400">Status:</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                      pass.hodApproved ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                      pass.tgApproved ? "bg-sky-100 text-sky-800 border border-sky-200" :
                                      "bg-amber-100 text-amber-800 border border-amber-200"
                                    }`}>
                                      {pass.hodApproved ? "APPROVED SUCCESSFULLY" : pass.tgApproved ? "TG Approved" : "Pending"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick decision actions */}
                          {showButtons && (
                            <div className="pt-2 border-t border-gray-100 flex items-center justify-start flex-wrap gap-y-1">
                              {/* ========================= */}
                              {/* TG APPROVE BUTTON */}
                              {/* ========================= */}
                              {!pass.tgApproved && (
                                <button
                                  id={`btn-tg-approve-${pass.id}`}
                                  onClick={() => approveTG(pass.id)}
                                  style={{
                                    background: "#1D4ED8",
                                    color: "white",
                                    border: "none",
                                    padding: "6px 14px",
                                    borderRadius: "10px",
                                    marginRight: "10px",
                                    cursor: "pointer",
                                    fontSize: "10px",
                                    fontWeight: "bold"
                                  }}
                                >
                                  Accept TG
                                </button>
                              )}

                              {/* ========================= */}
                              {/* HOD APPROVE BUTTON */}
                              {/* ========================= */}
                              {pass.tgApproved && !pass.hodApproved && (
                                <button
                                  id={`btn-hod-approve-${pass.id}`}
                                  onClick={() => approveHOD(pass.id)}
                                  style={{
                                    background: "green",
                                    color: "white",
                                    border: "none",
                                    padding: "6px 14px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontSize: "10px",
                                    fontWeight: "bold"
                                  }}
                                >
                                  Accept HOD
                                </button>
                              )}

                              {/* ========================= */}
                              {/* FINAL APPROVED */}
                              {/* ========================= */}
                              {pass.hodApproved && (
                                <p
                                  id={`approved-success-text-${pass.id}`}
                                  style={{
                                    color: "green",
                                    fontWeight: "bold",
                                    marginTop: "4px",
                                    fontSize: "10px"
                                  }}
                                >
                                  APPROVED SUCCESSFULLY
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="p-4 text-center text-gray-400 text-xs">No current alerts pending.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary View Scroll Window */}
        <main className="flex-1 overflow-y-auto p-4.5 bg-white relative">
          {!currentUser ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AuthScreen onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {currentUser.role === "student" ? (
                // STUDENT Tab routing views
                (() => {
                  switch (activeTab) {
                    case "home":
                      return (
                        <HomeTab 
                          user={currentUser} 
                          requests={requests} 
                          onCreatePassClick={() => setActiveTab("create")} 
                          onTrackPassClick={triggerTrackIdLink}
                        />
                      );
                    case "track":
                      return (
                        <TrackPassTab 
                          requests={requests} 
                          initialSelectedId={initialSelectedId} 
                        />
                      );
                    case "create":
                      return (
                        <CreatePassTab onSubmit={handleCreatePassRequest} />
                      );
                    case "profile":
                      return (
                        <ProfileTab user={currentUser} onLogout={handleLogout} />
                      );
                    default:
                      return <div className="text-center text-xs py-8 text-gray-400">Section not found.</div>;
                  }
                })()
              ) : (
                // FACULTY Staff portals routing views
                (() => {
                  switch (activeTab) {
                    case "home":
                      return (
                        <FacultyPanel 
                          user={currentUser} 
                          requests={requests} 
                          onAction={handleDecisionAction}
                        />
                      );
                    case "profile":
                      return (
                        <ProfileTab user={currentUser} onLogout={handleLogout} />
                      );
                    default:
                      return <div className="text-center text-xs py-8 text-gray-400">Section not found.</div>;
                  }
                })()
              )}
            </motion.div>
          )}
        </main>

        {/* Bottom Nav bar display */}
        {currentUser && (
          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            role={currentUser.role}
          />
        )}
      </div>
    </div>
  );
}
