/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "student" | "admin" | "tg" | "hod";

export interface StudentProfile {
  name: string;
  rollNumber: string;
  email: string;
  branch: string;
  tgName: string;
  phone: string;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  rollNumber?: string; // only for student
  branch?: string;     // for student / TG / HOD
  tgName?: string;     // only for student
}

export type PassStatus = "pending" | "approved_tg" | "approved" | "rejected" | "TG Approved" | "Approved";

export interface PassRequest {
  id: string;
  studentUid: string;
  studentName: string;
  studentRollNumber: string;
  studentBranch: string;
  studentEmail: string;
  tgName: string;
  
  destination: string;
  reason: string;
  leaveDate: string;
  leaveTime: string;
  returnDate: string;
  returnTime: string;
  outboundDate?: string;
  expectedIn?: string;
  
  status: PassStatus;
  createdAt: string;
  
  tgApproved?: boolean;
  hodApproved?: boolean;
  tgApprovedBy?: string;
  tgApprovedAt?: any;
  hodUnlocked?: boolean;
  hodApprovedBy?: string;
  hodApprovedAt?: any;
  
  tgApproval: {
    approved: boolean | null; // null = pending, true = approved, false = rejected
    date?: string;
    remarks?: string;
    tgUid?: string;
  };
  
  hodApproval: {
    approved: boolean | null; // null = pending, true = approved, false = rejected
    date?: string;
    remarks?: string;
    hodUid?: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: "tg_review" | "hod_review" | "student_update" | "general";
  requestId?: string;
  studentName?: string;
  reason?: string;
  dateTime?: string;
  status?: string;
  approved?: boolean;
}
