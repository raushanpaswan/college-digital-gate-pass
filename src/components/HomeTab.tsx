/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Clock3, 
  ChevronRight, 
  Plus, 
  QrCode, 
  Mail, 
  Copy,
  Check,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType, PassRequest } from "../types";

interface HomeTabProps {
  user: UserType;
  requests: PassRequest[];
  onCreatePassClick: () => void;
  onTrackPassClick: (requestId: string) => void;
}

export default function HomeTab({ user, requests, onCreatePassClick, onTrackPassClick }: HomeTabProps) {
  const [copied, setCopied] = useState(false);
  const [showEPassModal, setShowEPassModal] = useState<PassRequest | null>(null);

  // Find the single "most active" request (either pending, approved_tg, or currently active/approved)
  const activeRequest = requests[0]; // Requests are pre-sorted by date/newest first

  const copyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
      case "Pending":
        return {
          bg: "bg-amber-50 border-amber-150",
          text: "text-amber-800",
          badgeBg: "bg-amber-100 text-amber-800",
          label: "Pending TG Approval",
          icon: Clock3,
        };
      case "approved_tg":
      case "TG Approved":
        return {
          bg: "bg-sky-50 border-sky-150",
          text: "text-sky-800",
          badgeBg: "bg-sky-100 text-sky-800",
          label: "TG Approved • Pending HOD",
          icon: User,
        };
      case "approved":
      case "Approved":
        return {
          bg: "bg-emerald-50 border-emerald-150",
          text: "text-emerald-800",
          badgeBg: "bg-emerald-100 text-emerald-800",
          label: "Approved & Active",
          icon: CheckCircle2,
        };
      case "rejected":
        return {
          bg: "bg-rose-50 border-rose-150",
          text: "text-rose-800",
          badgeBg: "bg-rose-100 text-rose-800",
          label: "Rejected Pass",
          icon: AlertCircle,
        };
      default:
        return {
          bg: "bg-gray-50 border-gray-150",
          text: "text-gray-800",
          badgeBg: "bg-gray-100 text-gray-800",
          label: "Unknown",
          icon: AlertCircle,
        };
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Welcome & Profile Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase">CAMPUS PASS PORTAL</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, <span className="text-blue-600">{user.name.split(" ")[0]}</span>!
          </h1>
          <p className="text-xs text-gray-500 font-mono">Roll: {user.rollNumber} • {user.branch.split(" & ")[0]}</p>
        </div>
        <div id="profile-avatar-btn" className="w-12 h-12 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center border border-blue-200 shadow-sm uppercase">
          {user.name.charAt(0)}
        </div>
      </div>

      {/* Quick Email Info Card */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gray-200/50 flex items-center justify-center text-gray-600">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Registered Student Email</p>
            <p className="text-xs font-mono font-semibold text-gray-700">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={copyEmail}
          className="p-1 px-2.5 rounded-lg text-[10px] font-medium bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Academic Details Card */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Academic Details</h2>
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3.5">
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
            <span className="text-gray-400 font-medium">Academic Branch</span>
            <span className="font-extrabold text-blue-700 font-mono tracking-wider bg-blue-50 px-3 py-1 rounded-xl">
              {user.branch || "CYBER"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
            <span className="text-gray-400 font-medium">Teacher Guardian (TG)</span>
            <span className="font-bold text-gray-800">
              {user.tgName || "Yogesh Kumar Sharma"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-1.5">
            <span className="text-gray-400 font-medium">Head of Department (HOD)</span>
            <span className="font-bold text-gray-800">
              Garima Mathur
            </span>
          </div>
        </div>
      </div>

      {/* Action Button: Create New */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onCreatePassClick}
        className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 border border-blue-500 transition-colors cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        <span>Request Digital Gate Pass</span>
      </motion.button>

      {/* Current/Active Pass Status Card */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Active / Recent Request</h2>
        
        {activeRequest ? (
          (() => {
            const config = getStatusConfig(activeRequest.status);
            const StatusIcon = config.icon;
            
            return (
              <motion.div 
                id={`request-card-${activeRequest.id}`}
                layoutId={`card-${activeRequest.id}`}
                className={`border rounded-2xl p-4.5 shadow-sm space-y-4 transition-all duration-300 ${config.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide uppercase ${config.badgeBg}`}>
                        {config.label}
                      </span>
                      {(activeRequest.status === "approved" || activeRequest.status === "Approved") && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white flex items-center space-x-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          <span>GATE-READY</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-base">{activeRequest.destination}</h3>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-gray-150 text-gray-700">
                    <StatusIcon className={`w-5 h-5 ${config.text}`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-200/50 pt-3 text-gray-600">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Departure</span>
                    <div className="flex items-center space-x-1.5 font-medium text-gray-800">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{activeRequest.leaveDate}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] text-gray-500 pl-5">
                      <Clock className="w-3 h-3" />
                      <span>{activeRequest.leaveTime}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Expected Return</span>
                    <div className="flex items-center space-x-1.5 font-medium text-gray-800">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{activeRequest.returnDate}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] text-gray-500 pl-5">
                      <Clock className="w-3 h-3" />
                      <span>{activeRequest.returnTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200/50 pt-3">
                  <span className="text-[10px] font-mono text-gray-400">Pass ID: {activeRequest.id}</span>
                  
                  {(activeRequest.status === "approved" || activeRequest.status === "Approved") ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowEPassModal(activeRequest)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-emerald-500/10 border border-emerald-500 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Show Digital E-Pass</span>
                    </motion.button>
                  ) : (
                    <button
                      onClick={() => onTrackPassClick(activeRequest.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Track Progress</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })()
        ) : (
          <div className="border border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white shadow-xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <QrCode className="w-6 h-6 stroke-1" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-700 text-sm">No Active Gate Passes</p>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                You haven't requested any digital gate passes yet, or all your earlier passes have expired.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* History Checklist Card */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Pass History & Logs</h2>
        
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {requests.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {requests.map((req) => {
                const config = getStatusConfig(req.status);
                return (
                  <div 
                    key={req.id} 
                    onClick={() => onTrackPassClick(req.id)}
                    className="p-3.5 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer active:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`p-2 rounded-xl text-xs font-mono font-bold ${
                        req.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        req.status === "rejected" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        req.status === "approved_tg" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                        "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {req.id.replace("epass-", "#")}
                      </div>
                      
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{req.destination}</h4>
                        <div className="flex items-center space-x-1.5 text-[10px] text-gray-400">
                          <span>{req.leaveDate}</span>
                          <span>•</span>
                          <span>{req.leaveTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${config.badgeBg}`}>
                        {req.status === "approved" || req.status === "Approved" ? "Approved" : 
                         req.status === "approved_tg" || req.status === "TG Approved" ? "TG Ok" :
                         req.status === "rejected" ? "Rejected" : "Pending"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-400">
              No historic requests found in system database.
            </div>
          )}
        </div>
      </div>

      {/* Digital E-Pass Modal */}
      <AnimatePresence>
        {showEPassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-emerald-100"
            >
              {/* Green Verifiable Header */}
              <div className="bg-emerald-600 text-white p-5 text-center relative">
                <div className="absolute top-4 right-4 bg-emerald-700 rounded-full text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  <span>VERIFIED</span>
                </div>
                
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 mb-1">COLLEGE SECURITY GATE PASS</p>
                <h3 className="text-lg font-extrabold tracking-tight">E-PASS / OUT-WAY BILL</h3>
                <p className="text-[10px] font-mono opacity-80 mt-1">ID: {showEPassModal.id.toUpperCase()}</p>
              </div>

              {/* Security Credentials */}
              <div className="p-5.5 space-y-4">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 flex items-center space-x-3.5">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center justify-center border border-emerald-200 shadow-xs">
                    {showEPassModal.studentName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm leading-tight">{showEPassModal.studentName}</h4>
                    <p className="text-[10px] font-mono text-gray-500">{showEPassModal.studentRollNumber} • {showEPassModal.studentBranch.split(" & ")[0]}</p>
                    <p className="text-[9px] text-emerald-700 font-semibold bg-emerald-100/50 px-2.5 py-0.5 rounded-full w-fit mt-1">Checked out authorized</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-400">Destination:</span>
                    <span className="font-bold text-gray-800 text-right">{showEPassModal.destination}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-400">L Tutor Guardian:</span>
                    <span className="font-semibold text-gray-700">{showEPassModal.tgName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-400">Reason:</span>
                    <span className="font-medium text-gray-600 italic text-right max-w-[180px] line-clamp-1">{showEPassModal.reason}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-mono text-[10px] text-gray-600">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase">LEAVE</p>
                      <p className="font-bold text-gray-800">{showEPassModal.leaveDate}</p>
                      <p className="text-gray-505">{showEPassModal.leaveTime}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-3">
                      <p className="text-[9px] text-gray-400 uppercase">RETURN TIME</p>
                      <p className="font-bold text-gray-800">{showEPassModal.returnDate}</p>
                      <p className="text-gray-505">{showEPassModal.returnTime}</p>
                    </div>
                  </div>
                </div>

                {/* Simulated Barcode Details */}
                <div className="space-y-2.5 pt-2 flex flex-col items-center">
                  <div className="border border-gray-200 p-2 rounded-xl bg-white w-full flex flex-col items-center">
                    {/* Simulated vector barcode */}
                    <div className="flex space-x-1.5 h-11 items-stretch w-full justify-center px-4 bg-white select-none">
                      <div className="w-1.5 bg-black"></div>
                      <div className="w-0.5 bg-black"></div>
                      <div className="w-2.5 bg-black"></div>
                      <div className="w-1 bg-black"></div>
                      <div className="w-0.5 bg-black"></div>
                      <div className="w-3 bg-black"></div>
                      <div className="w-1.5 bg-black"></div>
                      <div className="w-0.5 bg-black"></div>
                      <div className="w-2 bg-black"></div>
                      <div className="w-1 bg-black"></div>
                      <div className="w-3.5 bg-black"></div>
                      <div className="w-0.5 bg-black"></div>
                      <div className="w-1.5 bg-black"></div>
                      <div className="w-2.5 bg-black"></div>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400 tracking-[0.25em] mt-1.5">*{showEPassModal.id.toUpperCase()}*</p>
                  </div>
                  
                  {/* Gate Signatures verification */}
                  <div className="flex items-center space-x-1.5 text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-xl w-fit">
                    <span>Approved by TG & HOD</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                <button
                  onClick={() => setShowEPassModal(null)}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer select-none"
                >
                  Dismiss Pass View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
