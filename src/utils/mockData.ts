/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, PassRequest } from "../types";

export const MOCK_STUDENTS: User[] = [
  {
    uid: "student_1",
    email: "student@college.edu",
    name: "Raushan Kumar",
    role: "student",
    rollNumber: "CY2023045",
    branch: "CYBER",
    tgName: "Yogesh Kumar Sharma",
  },
  {
    uid: "student_2",
    email: "rithikrajwd@gmail.com",
    name: "Rithik Raj",
    role: "student",
    rollNumber: "CY2023088",
    branch: "CYBER",
    tgName: "Yogesh Kumar Sharma",
  }
];

export const MOCK_TGS: User[] = [
  {
    uid: "tg_1",
    email: "tg@college.edu",
    name: "Yogesh Kumar Sharma",
    role: "tg",
    branch: "CYBER"
  }
];

export const MOCK_HODS: User[] = [
  {
    uid: "hod_1",
    email: "hod@college.edu",
    name: "Garima Mathur",
    role: "hod",
    branch: "CYBER"
  }
];

export const ALL_MOCK_USERS: User[] = [
  ...MOCK_STUDENTS,
  ...MOCK_TGS,
  ...MOCK_HODS
];

export const INITIAL_PASS_REQUESTS: PassRequest[] = [
  {
    id: "epass-9812",
    studentUid: "student_2",
    studentName: "Rithik Raj",
    studentRollNumber: "CY2023088",
    studentBranch: "CYBER",
    studentEmail: "rithikrajwd@gmail.com",
    tgName: "Yogesh Kumar Sharma",
    destination: "Home (Patna, Bihar)",
    reason: "Going home due to urgent medical checkup of grandmother.",
    leaveDate: "2026-05-28",
    leaveTime: "08:00",
    returnDate: "2026-06-02",
    returnTime: "18:00",
    status: "pending",
    createdAt: "2026-05-27T08:00:00Z",
    tgApproval: {
      approved: null,
    },
    hodApproval: {
      approved: null,
    },
  },
  {
    id: "epass-4521",
    studentUid: "student_2",
    studentName: "Rithik Raj",
    studentRollNumber: "CY2023088",
    studentBranch: "CYBER",
    studentEmail: "rithikrajwd@gmail.com",
    tgName: "Yogesh Kumar Sharma",
    destination: "Local Market (Central Mall)",
    reason: "Required to purchase essential academic materials & reference textbooks.",
    leaveDate: "2026-05-26",
    leaveTime: "14:00",
    returnDate: "2026-05-26",
    returnTime: "18:00",
    status: "approved",
    createdAt: "2026-05-26T10:30:00Z",
    tgApproval: {
      approved: true,
      date: "2026-05-26T12:15:00Z",
      remarks: "Approved. Make sure to return on time.",
      tgUid: "tg_1",
    },
    hodApproval: {
      approved: true,
      date: "2026-05-26T13:00:00Z",
      remarks: "Approved for local procurement.",
      hodUid: "hod_1",
    },
  },
  {
    id: "epass-7814",
    studentUid: "student_1",
    studentName: "Raushan Kumar",
    studentRollNumber: "CY2023045",
    studentBranch: "CYBER",
    studentEmail: "student@college.edu",
    tgName: "Yogesh Kumar Sharma",
    destination: "Railway Station",
    reason: "Going to attend family function.",
    leaveDate: "2026-05-29",
    leaveTime: "09:00",
    returnDate: "2026-06-03",
    returnTime: "20:00",
    status: "approved_tg",
    createdAt: "2026-05-27T06:12:00Z",
    tgApproval: {
      approved: true,
      date: "2026-05-27T07:30:00Z",
      remarks: "Approved. Forwarded to HOD for final gate out permission.",
      tgUid: "tg_1",
    },
    hodApproval: {
      approved: null,
    }
  },
  {
    id: "epass-2311",
    studentUid: "student_1",
    studentName: "Raushan Kumar",
    studentRollNumber: "CY2023045",
    studentBranch: "CYBER",
    studentEmail: "student@college.edu",
    tgName: "Yogesh Kumar Sharma",
    destination: "Local Cafe",
    reason: "Meeting friends for dinner.",
    leaveDate: "2026-05-25",
    leaveTime: "19:00",
    returnDate: "2026-05-25",
    returnTime: "22:00",
    status: "rejected",
    createdAt: "2026-05-25T15:00:00Z",
    tgApproval: {
      approved: false,
      date: "2026-05-25T16:20:00Z",
      remarks: "Going outside campus late in the evening for leisure is not allowed.",
      tgUid: "tg_1",
    },
    hodApproval: {
      approved: null,
    }
  }
];

const PASS_REQ_KEY = "epass_gate_requests";
const USERS_KEY = "epass_users";

export const getPassRequests = (): PassRequest[] => {
  const data = localStorage.getItem(PASS_REQ_KEY);
  if (!data) {
    localStorage.setItem(PASS_REQ_KEY, JSON.stringify(INITIAL_PASS_REQUESTS));
    return INITIAL_PASS_REQUESTS;
  }
  return JSON.parse(data);
};

export const savePassRequest = (request: PassRequest): PassRequest[] => {
  const current = getPassRequests();
  const index = current.findIndex(r => r.id === request.id);
  if (index >= 0) {
    current[index] = request;
  } else {
    current.unshift(request);
  }
  localStorage.setItem(PASS_REQ_KEY, JSON.stringify(current));
  return current;
};

export const createNewPassRequest = (
  student: User,
  payload: {
    destination: string;
    reason: string;
    leaveDate: string;
    leaveTime: string;
    returnDate: string;
    returnTime: string;
  }
): PassRequest => {
  const id = `epass-${Math.floor(1000 + Math.random() * 9000)}`;
  const newRequest: PassRequest = {
    id,
    studentUid: student.uid,
    studentName: student.name,
    studentRollNumber: student.rollNumber || "N/A",
    studentBranch: student.branch || "Computer Science",
    studentEmail: student.email,
    tgName: student.tgName || "Dr. Alok Verma",
    destination: payload.destination,
    reason: payload.reason,
    leaveDate: payload.leaveDate,
    leaveTime: payload.leaveTime,
    returnDate: payload.returnDate,
    returnTime: payload.returnTime,
    status: "pending",
    createdAt: new Date().toISOString(),
    tgApproval: {
      approved: null,
    },
    hodApproval: {
      approved: null,
    }
  };
  savePassRequest(newRequest);
  return newRequest;
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    localStorage.setItem(USERS_KEY, JSON.stringify(ALL_MOCK_USERS));
    return ALL_MOCK_USERS;
  }
  return JSON.parse(data);
};

export const saveUser = (user: User) => {
  const current = getUsers();
  const index = current.findIndex(u => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) {
    current[index] = { ...current[index], ...user };
  } else {
    current.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(current));
};

const NOTIF_KEY = "epass_notifications";

export const getMockNotifications = (): any[] => {
  const data = localStorage.getItem(NOTIF_KEY);
  if (!data) {
    const initialNotifs = [
      {
        id: "notif-1",
        title: "Welcome to Gate Portal",
        message: "Your e-pass system is ready. Login as TG or HOD to test state approvals instantly!",
        time: new Date().toISOString(),
        read: false,
        studentName: "System",
        reason: "Initial system ready confirmation.",
        dateTime: "Today",
        status: "Active"
      }
    ];
    localStorage.setItem(NOTIF_KEY, JSON.stringify(initialNotifs));
    return initialNotifs;
  }
  return JSON.parse(data);
};

export const saveMockNotification = (notif: any): any[] => {
  const current = getMockNotifications();
  const index = current.findIndex(n => n.id === notif.id);
  if (index >= 0) {
    current[index] = notif;
  } else {
    current.unshift(notif);
  }
  localStorage.setItem(NOTIF_KEY, JSON.stringify(current));
  return current;
};

export const clearMockNotifications = (): void => {
  localStorage.setItem(NOTIF_KEY, JSON.stringify([]));
};
