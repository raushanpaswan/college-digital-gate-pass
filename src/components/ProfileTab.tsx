/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  User, 
  Mail, 
  Hash, 
  AppWindow, 
  GraduationCap, 
  LogOut, 
  ShieldCheck, 
  UserCheck,
  Phone,
  LayoutGrid
} from "lucide-react";
import { motion } from "motion/react";
import { User as UserType } from "../types";

interface ProfileTabProps {
  user: UserType;
  onLogout: () => void;
}

export default function ProfileTab({ user, onLogout }: ProfileTabProps) {
  return (
    <div className="space-y-5 pb-24">
      {/* Decorative avatar banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col items-center text-center">
        {/* Subtle geometric circles */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/5 rounded-full" />
        
        <div className="w-20 h-20 bg-white/15 text-white border-2 border-white/20 text-3xl font-bold rounded-full flex items-center justify-center uppercase mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          {user.name.charAt(0)}
        </div>
        
        <h2 className="text-xl font-bold tracking-tight">{user.name}</h2>
        <p className="text-xs text-blue-100 font-mono font-medium tracking-wide uppercase mt-0.5">
          {user.role === "student" ? "Registered Student" : user.role === "tg" ? "Teacher Guardian" : "Head of Department (HOD)"}
        </p>
      </div>

      {/* Account Info Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Academic & System Profile</h3>

        <div className="bg-white border border-gray-100 rounded-2xl p-4.5 shadow-sm space-y-4.5">
          {/* 1. Full Registered Name */}
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Full Name</p>
              <h4 className="text-sm font-semibold text-gray-800">{user.name}</h4>
            </div>
          </div>

          {/* 2. Registered Email */}
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Registered Email</p>
              <h4 className="text-sm font-mono font-medium text-gray-700">{user.email}</h4>
            </div>
          </div>

          {/* 3. Roll Number / UID */}
          {user.rollNumber && (
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Roll Number</p>
                <h4 className="text-sm font-mono font-semibold text-gray-800">{user.rollNumber}</h4>
              </div>
            </div>
          )}

          {/* 4. Branch / Academic Wing */}
          {user.branch && (
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Academic Division / Branch</p>
                <h4 className="text-sm font-semibold text-gray-800">{user.branch}</h4>
              </div>
            </div>
          )}

          {/* 5. Assigned Teacher Guardian */}
          {user.role === "student" && user.tgName && (
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Teacher Guardian (TG)</p>
                <h4 className="text-sm font-semibold text-blue-600">{user.tgName}</h4>
              </div>
            </div>
          )}

          {/* 6. Assigned Head of Department */}
          {user.role === "student" && (
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Head of Department (HOD)</p>
                <h4 className="text-sm font-semibold text-blue-600">Garima Mathur</h4>
              </div>
            </div>
          )}

          {/* 7. System Privileges (Faculty Only) */}
          {user.role !== "student" && (
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-blue-500 font-bold uppercase">System Authority Privilege</p>
                <h4 className="text-sm font-semibold text-gray-800">
                  {user.role === "tg" ? "Gate Pass Endorsee Authority" : "Final Gate Clearence Officer"}
                </h4>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* College Support Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start space-x-3 shadow-xs">
        <LayoutGrid className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-blue-900">Need Technical Support?</p>
          <p className="text-[11px] text-blue-700/80 leading-relaxed">
            For academic record discrepancies or changes in contact/guardian details, please submit an offline request at the college IT helpdesk.
          </p>
        </div>
      </div>

      {/* Logout Action */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onLogout}
        className="w-full py-4.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
      >
        <LogOut className="w-4.5 h-4.5" />
        <span>Logout from E-Pass System</span>
      </motion.button>
    </div>
  );
}
