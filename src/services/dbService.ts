/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  db, 
  isRealFirebase, 
  handleFirestoreError, 
  OperationType 
} from "../firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp
} from "firebase/firestore";
import { User, PassRequest, UserRole, PassStatus } from "../types";
import { 
  getPassRequests, 
  savePassRequest, 
  createNewPassRequest, 
  getUsers, 
  saveUser,
  getMockNotifications,
  saveMockNotification,
  clearMockNotifications
} from "../utils/mockData";

export const dbService = {
  // 1. Get user profile
  async getUserProfile(uid: string, email?: string): Promise<User | null> {
    if (!isRealFirebase) {
      const users = getUsers();
      const u = users.find(x => x.uid === uid || (email && x.email.toLowerCase() === email.toLowerCase()));
      return u || null;
    }

    const path = `users/${uid}`;
    try {
      const docRef = doc(db, "users", uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as User;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  // 2. Save/Update user profile
  async saveUserProfile(user: User): Promise<void> {
    if (!isRealFirebase) {
      saveUser(user);
      return;
    }

    const path = `users/${user.uid}`;
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, user, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // 3. Fetch requests based on role
  async getRequests(role: UserRole, uid: string, branch?: string): Promise<PassRequest[]> {
    if (!isRealFirebase) {
      const all = getPassRequests();
      if (role === "student") {
        return all.filter(r => r.studentUid === uid).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (role === "tg") {
        const users = getUsers();
        const tgUser = users.find(u => u.uid === uid);
        const name = tgUser?.name || "";
        return all.filter(r => r.tgName === name || r.studentBranch === branch).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (role === "hod") {
        return all.filter(r => r.studentBranch === branch || r.status === "approved_tg" || r.status === "TG Approved" || r.status === "approved" || r.status === "Approved").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return all;
    }

    const path = "passes";
    try {
      const collRef = collection(db, "passes");
      let q;
      
      if (role === "student") {
        q = query(collRef, where("studentUid", "==", uid));
      } else {
        q = query(collRef, where("studentBranch", "==", branch || ""));
      }

      const snapshot = await getDocs(q);
      const list: PassRequest[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...(doc.data() as any) } as PassRequest);
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // 3.5 Real-time observer
  subscribeRequests(
    role: UserRole,
    uid: string,
    branch: string | undefined,
    onUpdate: (requests: PassRequest[]) => void,
    onError: (err: any) => void
  ): () => void {
    if (!isRealFirebase) {
      const runMockUpdate = () => {
        const all = getPassRequests();
        let list: PassRequest[] = [];
        if (role === "student") {
          list = all.filter(r => r.studentUid === uid);
        } else if (role === "admin" || role === "tg" || role === "hod") {
          list = all.filter(r => r.studentBranch === branch);
        } else {
          list = all;
        }
        onUpdate([...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      };

      runMockUpdate();
      if (typeof window !== "undefined") {
        window.addEventListener("epass_db_change", runMockUpdate);
      }
      const interval = setInterval(runMockUpdate, 2500);
      return () => {
        clearInterval(interval);
        if (typeof window !== "undefined") {
          window.removeEventListener("epass_db_change", runMockUpdate);
        }
      };
    }

    const collRef = collection(db, "passes");
    let q;
    if (role === "student") {
      q = query(collRef, where("studentUid", "==", uid));
    } else {
      q = query(collRef, where("studentBranch", "==", branch || ""));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const list: PassRequest[] = [];
      snapshot.forEach(docDoc => {
        list.push({ id: docDoc.id, ...(docDoc.data() as any) } as PassRequest);
      });
      const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(sorted);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "passes");
      onError(error);
    });

    return unsub;
  },

  // 3.6 Real-time Notifications observer
  subscribeNotifications(
    role: UserRole,
    uid: string,
    branch: string | undefined,
    onUpdate: (notifications: any[]) => void,
    onError: (err: any) => void
  ): () => void {
    if (!isRealFirebase) {
      const runMockUpdate = () => {
        const all = getMockNotifications();
        let list = [];
        if (role === "admin" || role === "tg" || role === "hod") {
          list = all.filter(n => (n.recipientRole === "admin" || n.recipientRole === "tg" || n.recipientRole === "hod") && n.recipientBranch === branch);
        } else if (role === "student") {
          list = all.filter(n => n.recipientUid === uid || n.recipientRole === "student" || n.recipientUid === "all");
        } else {
          list = all;
        }
        onUpdate([...list].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      };

      runMockUpdate();
      if (typeof window !== "undefined") {
        window.addEventListener("epass_db_change", runMockUpdate);
      }
      const interval = setInterval(runMockUpdate, 2500);
      return () => {
        clearInterval(interval);
        if (typeof window !== "undefined") {
          window.removeEventListener("epass_db_change", runMockUpdate);
        }
      };
    }

    const collRef = collection(db, "notifications");
    const unsub = onSnapshot(collRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docDoc => {
        list.push({ id: docDoc.id, ...docDoc.data() });
      });
      
      let filtered = [];
      if (role === "admin" || role === "tg" || role === "hod") {
        filtered = list.filter(n => (n.recipientRole === "admin" || n.recipientRole === "tg" || n.recipientRole === "hod") && n.recipientBranch === branch);
      } else if (role === "student") {
        filtered = list.filter(n => n.recipientUid === uid || n.recipientRole === "student" || n.recipientUid === "all");
      } else {
        filtered = list;
      }
      
      const sorted = filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      onUpdate(sorted);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "notifications");
      onError(error);
    });

    return unsub;
  },

  // 4. Create new request
  async createRequest(
    student: User, 
    payload: {
      destination: string;
      reason: string;
      leaveDate: string;
      leaveTime: string;
      returnDate: string;
      returnTime: string;
    }
  ): Promise<PassRequest> {
    const id = `epass-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: PassRequest = {
      id,
      studentUid: student.uid,
      studentName: student.name,
      studentRollNumber: student.rollNumber || "N/A",
      studentBranch: student.branch || "Computer Science",
      studentEmail: student.email,
      tgName: student.tgName || "Yogesh Kumar Sharma",
      destination: payload.destination,
      reason: payload.reason,
      leaveDate: payload.leaveDate,
      leaveTime: payload.leaveTime,
      returnDate: payload.returnDate,
      returnTime: payload.returnTime,
      
      // Specifically required fields
      outboundDate: payload.leaveDate,
      expectedIn: payload.returnDate,
      status: "Pending" as any,
      tgApproved: false,
      hodApproved: false,
      createdAt: new Date().toISOString(),
      
      tgApproval: {
        approved: null,
      },
      hodApproval: {
        approved: null,
      }
    };

    const notifId = `notif-tg-${id}`;
    const newNotif = {
      id: notifId,
      title: "New E-Pass Review Required",
      message: `${student.name} requested gate pass to ${payload.destination}`,
      time: new Date().toISOString(),
      read: false,
      type: "tg_review",
      requestId: id,
      studentName: student.name,
      reason: payload.reason,
      dateTime: `${payload.leaveDate} at ${payload.leaveTime}`,
      status: "Pending",
      recipientRole: "admin",
      recipientBranch: student.branch || "Computer Science"
    };

    if (!isRealFirebase) {
      savePassRequest(newRequest);
      saveMockNotification(newNotif);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("epass_db_change"));
      }
      return newRequest;
    }

    const path = "passes";
    try {
      const collRef = collection(db, "passes");
      const savedPayload = {
        studentUid: student.uid,
        studentName: student.name,
        studentRollNumber: student.rollNumber || "N/A",
        studentBranch: student.branch || "Computer Science",
        studentEmail: student.email,
        tgName: student.tgName || "Yogesh Kumar Sharma",
        destination: payload.destination,
        reason: payload.reason,
        leaveDate: payload.leaveDate,
        leaveTime: payload.leaveTime,
        returnDate: payload.returnDate,
        returnTime: payload.returnTime,
        
        // Spec fields
        outboundDate: payload.leaveDate,
        expectedIn: payload.returnDate,
        status: "Pending",
        tgApproved: false,
        hodApproved: false,
        createdAt: new Date().toISOString(),
        
        tgApproval: {
          approved: null,
        },
        hodApproval: {
          approved: null,
        }
      };

      const docRef = await addDoc(collRef, savedPayload);
      const generatedId = docRef.id;

      // Add 'id' field inside document as well for easy access
      await updateDoc(docRef, { id: generatedId });

      const realNotifId = `notif-tg-${generatedId}`;
      const realNotif = {
        id: realNotifId,
        title: "New E-Pass Review Required",
        message: `${student.name} requested gate pass to ${payload.destination}`,
        time: new Date().toISOString(),
        read: false,
        type: "tg_review",
        requestId: generatedId,
        studentName: student.name,
        reason: payload.reason,
        dateTime: `${payload.leaveDate} at ${payload.leaveTime}`,
        status: "Pending",
        recipientRole: "admin",
        recipientBranch: student.branch || "Computer Science"
      };

      const notifDocRef = doc(db, "notifications", realNotifId);
      await setDoc(notifDocRef, realNotif);

      return { id: generatedId, ...savedPayload } as unknown as PassRequest;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // 5. Update request approval step
  async updateRequestStatus(
    requestId: string,
    action: "tg" | "hod" | "admin_tg" | "admin_hod" | "reject",
    approved: boolean,
    remarks: string,
    userUid: string
  ): Promise<PassRequest> {
    let studentName = "Student";
    let studentUid = "";
    let reason = "";
    let leaveDate = "";
    let leaveTime = "";
    let studentBranch = "CYBER";
    let destination = "";

    // Resolve specific action mapping
    let finalAction: "admin_tg" | "admin_hod" | "reject" = "reject";
    if (action === "admin_tg") {
      finalAction = "admin_tg";
    } else if (action === "admin_hod") {
      finalAction = "admin_hod";
    } else if (action === "reject") {
      finalAction = "reject";
    } else if (action === "tg") {
      finalAction = approved ? "admin_tg" : "reject";
    } else if (action === "hod") {
      finalAction = approved ? "admin_hod" : "reject";
    }

    if (!isRealFirebase) {
      const reqs = getPassRequests();
      const r = reqs.find(x => x.id === requestId);
      if (!r) throw new Error("Request not found");

      studentName = r.studentName;
      studentUid = r.studentUid;
      reason = r.reason;
      leaveDate = r.leaveDate;
      leaveTime = r.leaveTime;
      studentBranch = r.studentBranch;
      destination = r.destination;

      const today = new Date().toISOString();
      if (finalAction === "admin_tg") {
        r.tgApproval = {
          approved: true,
          date: today,
          remarks: remarks || "TG Sign Approved.",
          tgUid: userUid
        };
        r.status = "TG Approved";
        r.tgApproved = true;
        r.tgApprovedBy = "Yogesh Kumar Sharma";
        r.tgApprovedAt = today;
        r.hodUnlocked = true;

        // update notification
        const tgNotifId = `notif-tg-${requestId}`;
        const mockNotifs = getMockNotifications();
        const tgNotif = mockNotifs.find(n => n.id === tgNotifId);
        if (tgNotif) {
          tgNotif.status = "TG Approved";
          tgNotif.approved = true;
          saveMockNotification(tgNotif);
        }

        // Create new HOD Clearance Required notification for admin!
        const adminNotifId = `notif-hod-${requestId}`;
        const adminNotif = {
          id: adminNotifId,
          title: "E-Pass Clearance Required",
          message: `TG Approved. Final HOD sign required for ${studentName}`,
          time: today,
          read: false,
          type: "hod_review",
          requestId,
          studentName,
          reason,
          dateTime: `${leaveDate} at ${leaveTime}`,
          status: "TG Approved",
          recipientRole: "admin",
          recipientBranch: studentBranch
        };
        saveMockNotification(adminNotif);

      } else if (finalAction === "admin_hod") {
        r.tgApproved = true;
        r.hodApproval = {
          approved: true,
          date: today,
          remarks: remarks || "HOD Sign Approved.",
          hodUid: userUid
        };
        r.status = "Approved";
        r.hodApproved = true;
        r.hodApprovedBy = "Garima Mathur";
        r.hodApprovedAt = today;

        // update both reviews to approved
        const tgNotifId = `notif-tg-${requestId}`;
        const hodNotifId = `notif-hod-${requestId}`;
        const mockNotifs = getMockNotifications();
        mockNotifs.forEach(n => {
          if (n.id === tgNotifId || n.id === hodNotifId) {
            n.status = "Approved";
            n.approved = true;
            saveMockNotification(n);
          }
        });

        // Student Notification
        const studNotifId = `notif-student-${requestId}`;
        const studNotif = {
          id: studNotifId,
          title: "E-Pass Approved!",
          message: `Your e-pass to ${destination} is fully authorized! Clear to gate-out.`,
          time: today,
          read: false,
          type: "student_update",
          requestId,
          studentName,
          reason,
          dateTime: `${leaveDate} at ${leaveTime}`,
          status: "Approved",
          recipientRole: "student",
          recipientUid: studentUid
        };
        saveMockNotification(studNotif);

      } else if (finalAction === "reject") {
        r.status = "rejected";
        r.tgApproved = false;
        r.hodApproved = false;
        r.tgApproval = {
          approved: false,
          date: today,
          remarks: remarks || "Rejected by Administrator."
        };
        r.hodApproval = {
          approved: false,
          date: today,
          remarks: remarks || "Rejected by Administrator."
        };

        // Update existing notifications to rejected
        const tgNotifId = `notif-tg-${requestId}`;
        const hodNotifId = `notif-hod-${requestId}`;
        const mockNotifs = getMockNotifications();
        mockNotifs.forEach(n => {
          if (n.id === tgNotifId || n.id === hodNotifId) {
            n.status = "rejected";
            n.approved = false;
            saveMockNotification(n);
          }
        });

        // Student Notification
        const studNotifId = `notif-student-${requestId}`;
        const studNotif = {
          id: studNotifId,
          title: "E-Pass Disallowed",
          message: `Your requested e-pass to ${destination} was rejected by Admin.`,
          time: today,
          read: false,
          type: "student_update",
          requestId,
          studentName,
          reason,
          dateTime: `${leaveDate} at ${leaveTime}`,
          status: "rejected",
          recipientRole: "student",
          recipientUid: studentUid
        };
        saveMockNotification(studNotif);
      }

      savePassRequest(r);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("epass_db_change"));
      }
      return r;
    }

    const path = `passes/${requestId}`;
    try {
      const docRef = doc(db, "passes", requestId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Request not found");
      const r = snap.data() as PassRequest;

      studentName = r.studentName;
      studentUid = r.studentUid;
      reason = r.reason;
      leaveDate = r.leaveDate;
      leaveTime = r.leaveTime;
      studentBranch = r.studentBranch;
      destination = r.destination;

      const today = new Date().toISOString();
      const updates: Partial<PassRequest> = {};

      if (finalAction === "admin_tg") {
        updates.tgApproval = {
          approved: true,
          date: today,
          remarks: remarks || "TG Sign Approved.",
          tgUid: userUid
        };
        updates.status = "TG Approved";
        updates.tgApproved = true;
        updates.tgApprovedBy = "Yogesh Kumar Sharma";
        updates.tgApprovedAt = Timestamp.now();
        updates.hodUnlocked = true;

        const tgNotifId = `notif-tg-${requestId}`;
        try {
          const tgNotifRef = doc(db, "notifications", tgNotifId);
          await updateDoc(tgNotifRef, {
            status: "TG Approved",
            approved: true
          });
        } catch (e) {
          console.warn("Notification not found.", e);
        }

        const adminNotifId = `notif-hod-${requestId}`;
        const adminNotif = {
          id: adminNotifId,
          title: "E-Pass Clearance Required",
          message: `TG Approved. Final HOD sign required for ${studentName}`,
          time: today,
          read: false,
          type: "hod_review",
          requestId,
          studentName,
          reason,
          dateTime: `${leaveDate} at ${leaveTime}`,
          status: "TG Approved",
          recipientRole: "admin",
          recipientBranch: studentBranch
        };
        await setDoc(doc(db, "notifications", adminNotifId), adminNotif);

      } else if (finalAction === "admin_hod") {
        updates.tgApproved = true;
        updates.hodApproval = {
          approved: true,
          date: today,
          remarks: remarks || "HOD Sign Approved.",
          hodUid: userUid
        };
        updates.status = "Approved";
        updates.hodApproved = true;
        updates.hodApprovedBy = "Garima Mathur";
        updates.hodApprovedAt = Timestamp.now();

        // update notifications if they exist
        const tgNotifId = `notif-tg-${requestId}`;
        const hodNotifId = `notif-hod-${requestId}`;
        const quietUpdate = async (nId: string) => {
          try {
            await updateDoc(doc(db, "notifications", nId), {
              status: "Approved",
              approved: true
            });
          } catch {}
        };
        await quietUpdate(tgNotifId);
        await quietUpdate(hodNotifId);

        // Notify student
        const studNotifId = `notif-student-${requestId}`;
        const studNotif = {
          id: studNotifId,
          title: "E-Pass Approved!",
          message: `Your e-pass to ${destination} is fully authorized! Clear to gate-out.`,
          time: today,
          read: false,
          type: "student_update",
          requestId,
          studentName,
          reason,
          dateTime: `${leaveDate} at ${leaveTime}`,
          status: "Approved",
          recipientRole: "student",
          recipientUid: studentUid
        };
        await setDoc(doc(db, "notifications", studNotifId), studNotif);

      } else if (finalAction === "reject") {
        updates.status = "rejected";
        updates.tgApproved = false;
        updates.hodApproved = false;
        updates.tgApproval = {
          approved: false,
          date: today,
          remarks: remarks || "Rejected by Administrator."
        };
        updates.hodApproval = {
          approved: false,
          date: today,
          remarks: remarks || "Rejected by Administrator."
        };

        const tgNotifId = `notif-tg-${requestId}`;
        const hodNotifId = `notif-hod-${requestId}`;
        const quietUpdate = async (nId: string) => {
          try {
            await updateDoc(doc(db, "notifications", nId), {
              status: "rejected",
              approved: false
            });
          } catch {}
        };
        await quietUpdate(tgNotifId);
        await quietUpdate(hodNotifId);

        const studNotifId = `notif-student-${requestId}`;
        const studNotif = {
          id: studNotifId,
          title: "E-Pass Disallowed",
          message: `Your requested e-pass to ${destination} was rejected by Admin.`,
          time: today,
          read: false,
          type: "student_update",
          requestId,
          studentName,
          reason,
          dateTime: `${leaveDate} at ${leaveTime}`,
          status: "rejected",
          recipientRole: "student",
          recipientUid: studentUid
        };
        await setDoc(doc(db, "notifications", studNotifId), studNotif);
      }

      await updateDoc(docRef, updates as any);
      
      const refreshedSnap = await getDoc(docRef);
      return { id: refreshedSnap.id, ...refreshedSnap.data() } as PassRequest;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // 6. Manual update notification status endpoint for the notification cards
  async updateNotificationStatus(notifId: string, status: string, approved: boolean): Promise<void> {
    if (!isRealFirebase) {
      const notifs = getMockNotifications();
      const notif = notifs.find(n => n.id === notifId);
      if (notif) {
        notif.status = status;
        notif.approved = approved;
        saveMockNotification(notif);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("epass_db_change"));
      }
      return;
    }
    const path = `notifications/${notifId}`;
    try {
      const docRef = doc(db, "notifications", notifId);
      await updateDoc(docRef, { status, approved });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // 7. Directly approve TG with working updateDoc
  async approveTG(requestId: string, userUid?: string): Promise<PassRequest> {
    const today = new Date().toISOString();
    const uid = userUid || "tg_default_uid";

    if (!isRealFirebase) {
      const reqs = getPassRequests();
      const r = reqs.find(x => x.id === requestId);
      if (!r) throw new Error("Request not found");

      r.tgApproved = true;
      r.tgApprovedBy = "Yogesh Kumar Sharma";
      r.tgApprovedAt = today;
      r.status = "TG Approved";
      r.hodUnlocked = true;
      r.tgApproval = {
        approved: true,
        date: today,
        remarks: "TG Sign Approved.",
        tgUid: uid
      };

      savePassRequest(r);

      const tgNotifId = `notif-tg-${requestId}`;
      const mockNotifs = getMockNotifications();
      const tgNotif = mockNotifs.find(n => n.id === tgNotifId);
      if (tgNotif) {
        tgNotif.status = "TG Approved";
        tgNotif.approved = true;
        saveMockNotification(tgNotif);
      }

      const adminNotifId = `notif-hod-${requestId}`;
      const adminNotif = {
        id: adminNotifId,
        title: "E-Pass Clearance Required",
        message: `TG Approved. Final HOD sign required for ${r.studentName}`,
        time: today,
        read: false,
        type: "hod_review",
        requestId,
        studentName: r.studentName,
        reason: r.reason,
        dateTime: `${r.leaveDate} at ${r.leaveTime}`,
        status: "TG Approved",
        recipientRole: "admin",
        recipientBranch: r.studentBranch
      };
      saveMockNotification(adminNotif);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("epass_db_change"));
      }
      return r;
    }

    const docRef = doc(db, "passes", requestId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Request not found");
    const r = snap.data() as PassRequest;

    const updates: Partial<PassRequest> = {
      tgApproved: true,
      tgApprovedBy: "Yogesh Kumar Sharma",
      tgApprovedAt: Timestamp.now(),
      status: "TG Approved",
      hodUnlocked: true,
      tgApproval: {
        approved: true,
        date: today,
        remarks: "TG Sign Approved.",
        tgUid: uid
      }
    };

    const tgNotifId = `notif-tg-${requestId}`;
    try {
      await updateDoc(doc(db, "notifications", tgNotifId), {
        status: "TG Approved",
        approved: true
      });
    } catch (e) {
      console.warn("Could not find/update TG notification.", e);
    }

    const adminNotifId = `notif-hod-${requestId}`;
    const adminNotif = {
      id: adminNotifId,
      title: "E-Pass Clearance Required",
      message: `TG Approved. Final HOD sign required for ${r.studentName}`,
      time: today,
      read: false,
      type: "hod_review",
      requestId,
      studentName: r.studentName,
      reason: r.reason,
      dateTime: `${r.leaveDate} at ${r.leaveTime}`,
      status: "TG Approved",
      recipientRole: "admin",
      recipientBranch: r.studentBranch
    };
    await setDoc(doc(db, "notifications", adminNotifId), adminNotif);

    await updateDoc(docRef, updates);
    const refreshedSnap = await getDoc(docRef);
    return { id: refreshedSnap.id, ...refreshedSnap.data() } as PassRequest;
  },

  // 8. Directly approve HOD with working updateDoc
  async approveHOD(requestId: string, userUid?: string): Promise<PassRequest> {
    const today = new Date().toISOString();
    const uid = userUid || "hod_default_uid";

    if (!isRealFirebase) {
      const reqs = getPassRequests();
      const r = reqs.find(x => x.id === requestId);
      if (!r) throw new Error("Request not found");

      r.tgApproved = true;
      r.hodApproved = true;
      r.hodApprovedBy = "Garima Mathur";
      r.hodApprovedAt = today;
      r.status = "Approved";
      r.hodApproval = {
        approved: true,
        date: today,
        remarks: "HOD Sign Approved.",
        hodUid: uid
      };

      savePassRequest(r);

      const tgNotifId = `notif-tg-${requestId}`;
      const hodNotifId = `notif-hod-${requestId}`;
      const mockNotifs = getMockNotifications();
      mockNotifs.forEach(n => {
        if (n.id === tgNotifId || n.id === hodNotifId) {
          n.status = "Approved";
          n.approved = true;
          saveMockNotification(n);
        }
      });

      const studNotifId = `notif-student-${requestId}`;
      const studNotif = {
        id: studNotifId,
        title: "E-Pass Approved!",
        message: `Your e-pass to ${r.destination} is fully authorized! Clear to gate-out.`,
        time: today,
        read: false,
        type: "student_update",
        requestId,
        studentName: r.studentName,
        reason: r.reason,
        dateTime: `${r.leaveDate} at ${r.leaveTime}`,
        status: "Approved",
        recipientRole: "student",
        recipientUid: r.studentUid
      };
      saveMockNotification(studNotif);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("epass_db_change"));
      }
      return r;
    }

    const docRef = doc(db, "passes", requestId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Request not found");
    const r = snap.data() as PassRequest;

    const updates: Partial<PassRequest> = {
      tgApproved: true,
      hodApproved: true,
      hodApprovedBy: "Garima Mathur",
      hodApprovedAt: Timestamp.now(),
      status: "Approved",
      hodApproval: {
        approved: true,
        date: today,
        remarks: "HOD Sign Approved.",
        hodUid: uid
      }
    };

    const tgNotifId = `notif-tg-${requestId}`;
    const hodNotifId = `notif-hod-${requestId}`;
    const quietUpdate = async (nId: string) => {
      try {
        await updateDoc(doc(db, "notifications", nId), {
          status: "Approved",
          approved: true
        });
      } catch {}
    };
    await quietUpdate(tgNotifId);
    await quietUpdate(hodNotifId);

    const studNotifId = `notif-student-${requestId}`;
    const studNotif = {
      id: studNotifId,
      title: "E-Pass Approved!",
      message: `Your e-pass to ${r.destination} is fully authorized! Clear to gate-out.`,
      time: today,
      read: false,
      type: "student_update",
      requestId,
      studentName: r.studentName,
      reason: r.reason,
      dateTime: `${r.leaveDate} at ${r.leaveTime}`,
      status: "Approved",
      recipientRole: "student",
      recipientUid: r.studentUid
    };
    await setDoc(doc(db, "notifications", studNotifId), studNotif);

    await updateDoc(docRef, updates);
    const refreshedSnap = await getDoc(docRef);
    return { id: refreshedSnap.id, ...refreshedSnap.data() } as PassRequest;
  }
};
