/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Inbox, 
  MessageSquare,
  Lock,
  Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType, PassRequest } from "../types";
import { dbService } from "../services/dbService";

interface FacultyPanelProps {
  user: UserType;
  requests: PassRequest[];
  onAction: (requestId: string, actionType: "admin_tg" | "admin_hod" | "reject", remarks: string) => Promise<void>;
}

export default function FacultyPanel({ user, requests, onAction }: FacultyPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"pending" | "resolved">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [remarksState, setRemarksState] = useState<{ [reqId: string]: string }>({});
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "loading" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error" | "loading", duration = 3000) => {
    setToast({ message, type });
    if (type !== "loading") {
      setTimeout(() => setToast(null), duration);
    }
  };

  const approveTG = async (requestId: string) => {
    try {
      setActingOn(requestId);
      triggerToast("Registering approval...", "loading");
      await dbService.approveTG(requestId, user.uid);
      triggerToast("TG Approved Successfully", "success");
      setRemarksState(prev => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
    } catch (err) {
      console.error(err);
      triggerToast("Database operation failed. Please try again.", "error");
    } finally {
      setActingOn(null);
    }
  };

  const approveHOD = async (requestId: string) => {
    try {
      setActingOn(requestId);
      triggerToast("Registering JOD approval...", "loading");
      await dbService.approveHOD(requestId, user.uid);
      triggerToast("HOD Approved Successfully", "success");
      setRemarksState(prev => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
    } catch (err) {
      console.error(err);
      triggerToast("Database operation failed. Please try again.", "error");
    } finally {
      setActingOn(null);
    }
  };

  // Branch matching & Search query logic
  const filteredRequests = requests.filter(req => {
    // 1. Roll/Branch Filter: Staff reviews students of CSE/assigned branch
    const branchMatch = req.studentBranch.toLowerCase().trim() === user.branch?.toLowerCase().trim();
    if (!branchMatch) return false;

    // 2. Query Search filter (Search by roll number or student name)
    const matchesSearch = 
      req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      req.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.destination.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // 3. Workflow Phase filter (pending means not fully Approved and not rejected)
    if (activeSubTab === "pending") {
      return req.status !== "Approved" && req.status !== "rejected";
    } else {
      return req.status === "Approved" || req.status === "rejected";
    }
  });

  // Calculate statistics metrics for the cards of their assigned branch
  const stats = (() => {
    const branchReqs = requests.filter(r => r.studentBranch.toLowerCase().trim() === user.branch?.toLowerCase().trim());
    return {
      pending: branchReqs.filter(r => r.status !== "Approved" && r.status !== "rejected").length,
      approved: branchReqs.filter(r => r.status === "Approved").length,
      rejected: branchReqs.filter(r => r.status === "rejected").length,
    };
  })();

  const handleDecision = async (requestId: string, actionType: "admin_tg" | "admin_hod" | "reject") => {
    let remarks = (remarksState[requestId] || "").trim();
    if (!remarks) {
      if (actionType === "admin_tg") remarks = "TG Sign Approved.";
      else if (actionType === "admin_hod") remarks = "HOD Sign Approved.";
      else remarks = "Rejected by administrator.";
    }

    try {
      setActingOn(requestId);
      triggerToast(actionType === "reject" ? "Rejecting request..." : "Registering approval...", "loading");
      await onAction(requestId, actionType, remarks);
      
      triggerToast(
        actionType === "admin_tg" ? "TG Sign Approved Successfully" :
        actionType === "admin_hod" ? "HOD Sign Approved Successfully" : 
        "Request Disallowed Successfully", 
        actionType === "reject" ? "success" : "success"
      );
      
      // Clear out the state remarks for that request
      setRemarksState(prev => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
    } catch (err) {
      triggerToast("Database operation failed. Please try again.", "error");
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Toast Alert View */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-16 left-4 right-4 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className={`px-4.5 py-3 rounded-2xl flex items-center space-x-2.5 shadow-lg border text-xs font-bold leading-normal text-white ${
              toast.type === "success" ? "bg-emerald-600 border-emerald-500" :
              toast.type === "error" ? "bg-rose-600 border-rose-500" : "bg-blue-600 border-blue-500"
            }`}>
              {toast.type === "loading" && (
                <svg className="animate-spin h-4 w-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {toast.type === "success" && <span className="text-sm font-black">✓</span>}
              {toast.type === "error" && <span className="text-sm font-black">⚠</span>}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Faculty Headings */}
      <div className="space-y-1">
        <p className="text-[10px] font-extrabold tracking-wider text-purple-600 uppercase">
          Unified Admin Command Center
        </p>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
          Welcome, <span className="text-purple-600">{user.name}</span>
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-1">Branch: {user.branch} Panel</p>
      </div>

      {/* Bento Mini-Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
          <p className="text-[18px] font-black text-amber-800 leading-none">{stats.pending}</p>
          <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mt-1.5">Awaiting</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
          <p className="text-[18px] font-black text-emerald-800 leading-none">{stats.approved}</p>
          <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider mt-1.5">Approved</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-center">
          <p className="text-[18px] font-black text-rose-800 leading-none">{stats.rejected}</p>
          <p className="text-[9px] text-rose-600 font-bold uppercase tracking-wider mt-1.5 font-semibold">Rejected</p>
        </div>
      </div>

      {/* Sub Tabs Toggle (Pending Review / Completed History Log) */}
      <div className="flex border-b border-gray-150">
        <button
          onClick={() => setActiveSubTab("pending")}
          className={`flex-1 py-3 text-xs font-bold tracking-wide transition-colors relative cursor-pointer ${
            activeSubTab === "pending" ? "text-purple-600 font-extrabold" : "text-gray-400"
          }`}
        >
          <span>Pending Approvals ({stats.pending})</span>
          {activeSubTab === "pending" && (
            <motion.div layoutId="facultyTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("resolved")}
          className={`flex-1 py-3 text-xs font-bold tracking-wide transition-colors relative cursor-pointer ${
            activeSubTab === "resolved" ? "text-purple-600 font-extrabold" : "text-gray-400"
          }`}
        >
          <span>Resolved History</span>
          {activeSubTab === "resolved" && (
            <motion.div layoutId="facultyTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
          )}
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <span className="absolute left-4 top-3 text-gray-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          id="faculty-search-input"
          type="text"
          placeholder="Search by Student Name, Roll No..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-gray-50 border border-gray-150 focus:border-purple-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all text-gray-800 placeholder:text-gray-400 font-medium"
        />
      </div>

      {/* Pass Request Review cards list */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const request = req;
            const isTGPending = !request.tgApproved;
            const isHODLockedByTG = !request.tgApproved; // HOD stage is locked unless TG approved

            return (
              <motion.div
                key={request.id}
                layoutId={`card-${request.id}`}
                className="bg-white border border-gray-150 rounded-2xl p-4.5 shadow-sm space-y-4.5"
              >
                {/* Card Header: Student Profile & Request Tags */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-50 text-purple-700 font-black border border-purple-100 rounded-2xl flex items-center justify-center uppercase">
                      {request.studentName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 leading-tight">{request.studentName}</h3>
                      <p className="text-[10px] font-mono text-gray-500 mt-0.5">{request.studentRollNumber} • {request.studentBranch}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md uppercase font-bold">
                      {request.id}
                    </span>
                  </div>
                </div>

                {/* Destination & Reason Info */}
                <div className="space-y-2 border-t border-b border-gray-100 py-3.5 text-xs text-gray-700">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400 font-bold lowercase">Going To:</span>
                    <span className="font-extrabold text-gray-900">{request.destination}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400 font-bold lowercase">Reason:</span>
                    <span className="font-semibold text-gray-800 italic max-w-[190px] text-right line-clamp-2">
                      "{request.reason}"
                    </span>
                  </div>
                  
                  {/* Schedule */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 mt-2 text-[10px] text-gray-500 font-mono">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold">DEPARTURE</span>
                      <p className="font-bold text-gray-700 mt-0.5">{request.leaveDate}</p>
                      <p className="mt-0.5">{request.leaveTime}</p>
                    </div>
                    <div className="border-l border-gray-250 pl-3">
                      <span className="text-[9px] text-gray-400 uppercase font-bold">CAMPUS RETURN</span>
                      <p className="font-bold text-gray-700 mt-0.5">{request.returnDate}</p>
                      <p className="mt-0.5">{request.returnTime}</p>
                    </div>
                  </div>
                </div>

                {/* Action Operations Context */}
                {activeSubTab === "pending" ? (
                  <div className="space-y-3 pt-1">
                    {/* Approval Remarks Card Input */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Remarks / Feedback notes</span>
                      </div>
                      <input
                        id={`remarks-input-${request.id}`}
                        type="text"
                        placeholder="Add remarks or instructions..."
                        value={remarksState[request.id] || ""}
                        onChange={(e) => setRemarksState(prev => ({ ...prev, [request.id]: e.target.value }))}
                        className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl px-3 py-2.5 outline-none transition-colors"
                      />
                    </div>

                    {/* Timeline Stages for Single Admin */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${request.tgApproved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></span>
                        <span>Stage 1: Teacher Guardian</span>
                      </div>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${request.tgApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {request.tgApproved ? "Approved" : "Pending Sign"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700">
                      <div className="flex items-center space-x-2">
                        {isHODLockedByTG ? (
                          <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                        <span>Stage 2: HOD Clearance</span>
                      </div>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        request.hodApproved ? "bg-emerald-100 text-emerald-800" : 
                        isHODLockedByTG ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-blue-800"
                      }`}>
                        {request.hodApproved ? "Approved" : isHODLockedByTG ? "Locked" : "Unlocked & Ready"}
                      </span>
                    </div>

                    {/* Buttons Grid: Reject, Accept TG, Accept HOD */}
                    <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 mt-2">
                      <div className="flex gap-2">
                        <button
                          id={`btn-reject-${request.id}`}
                          disabled={actingOn !== null}
                          onClick={() => handleDecision(request.id, "reject")}
                          className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 cursor-pointer flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>Reject</span>
                        </button>

                        {isTGPending ? (
                          <button
                            id={`btn-approvetg-${request.id}`}
                            disabled={actingOn !== null}
                            onClick={() => approveTG(request.id)}
                            className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md border border-sky-500 cursor-pointer flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Accept TG</span>
                          </button>
                        ) : (
                          <button
                            id={`btn-approvehod-${request.id}`}
                            disabled={actingOn !== null}
                            onClick={() => approveHOD(request.id)}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md border border-emerald-500 cursor-pointer flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Accept HOD</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Resolved History view */
                  <div className="space-y-3 bg-gray-50/70 border border-gray-100 p-3.5 rounded-xl text-xs">
                    <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                      <span className="text-gray-400 font-extrabold lowercase">System Endorsement:</span>
                      <span className={`font-black uppercase tracking-wider flex items-center space-x-1.5 ${request.status === "Approved" ? "text-emerald-600" : "text-rose-600"}`}>
                        {request.status === "Approved" ? (
                          <>
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                            <span>Fully Approved</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4.5 h-4.5 text-rose-600" />
                            <span>Disallowed / Rejected</span>
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                      <div>
                        <span className="text-gray-400">TG State:</span>{" "}
                        <span className={request.tgApproval?.approved ? "text-emerald-600 font-bold" : "text-gray-500 font-bold"}>
                          {request.tgApproval?.approved ? "Approved" : "N/A"}
                        </span>
                        {request.tgApproval?.remarks && <p className="italic text-[9px] leading-snug mt-0.5 text-gray-400">"{request.tgApproval.remarks}"</p>}
                      </div>
                      <div className="border-l border-gray-200 pl-2">
                        <span className="text-gray-400">HOD State:</span>{" "}
                        <span className={request.hodApproval?.approved ? "text-emerald-600 font-bold" : "text-gray-500 font-bold"}>
                          {request.hodApproval?.approved ? "Approved" : "N/A"}
                        </span>
                        {request.hodApproval?.remarks && <p className="italic text-[9px] leading-snug mt-0.5 text-gray-400">"{request.hodApproval.remarks}"</p>}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
              <Inbox className="w-6 h-6 stroke-1" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-gray-700 text-sm">Inbox is Pristine & Empty</p>
              <p className="text-xs text-gray-400 max-w-xs">
                {activeSubTab === "pending"
                  ? "Perfect! You have completed all student checkout endorsements for this branch."
                  : "No completed historic records matching your academic branch."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
