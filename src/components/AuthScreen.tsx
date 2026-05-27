/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { 
  Mail, 
  Lock, 
  User, 
  Hash, 
  GraduationCap, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserRole } from "../types";

const BRANCHES = [
  "CYBER",
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
];

const TUTOR_GUARDIANS = [
  "Yogesh Kumar Sharma",
  "Dr. Neeta Gupta",
  "Prof. Vikram Singh",
];

interface AuthScreenProps {
  onLoginSuccess: (email: string, role: UserRole, customName?: string, roll?: string, branch?: string, tgName?: string) => Promise<void>;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<UserRole>("student");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [selectedTG, setSelectedTG] = useState(TUTOR_GUARDIANS[0]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Small artificial loading for nice UI feedback
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isRegister && activeTab === "student") {
        if (!fullName || !rollNumber) {
          setError("Please complete all academic profile fields.");
          setLoading(false);
          return;
        }
        await onLoginSuccess(
          email,
          "student",
          fullName,
          rollNumber,
          selectedBranch,
          selectedTG
        );
      } else {
        // Simple Login simulation (Admin or Student)
        // Check for recognized mock credentials for easy login
        if (email.toLowerCase().includes("admin@") || email.toLowerCase().includes("tg@") || email.toLowerCase().includes("hod@")) {
          await onLoginSuccess(email, "admin", "Garima Mathur", undefined, "CYBER");
        } else if (email.toLowerCase().includes("student@") || email.toLowerCase().includes("rithik")) {
          await onLoginSuccess(email, "student", "Raushan Kumar", "CY2023045", "CYBER", "Yogesh Kumar Sharma");
        } else {
          // generic fallback login
          const genericName = email.split("@")[0].toUpperCase();
          await onLoginSuccess(email, activeTab, genericName, "CY2023" + Math.floor(100 + Math.random() * 900), "CYBER", "Yogesh Kumar Sharma");
        }
      }
    } catch (err) {
      setError("Framer-Auth: Invalid credentials combined with simulated session.");
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickLogin = async (preset: {
    email: string;
    role: UserRole;
    name: string;
    roll?: string;
    branch?: string;
    tgName?: string;
  }) => {
    setLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 600));
    try {
      await onLoginSuccess(
        preset.email, 
        preset.role, 
        preset.name, 
        preset.roll, 
        preset.branch, 
        preset.tgName
      );
    } catch {
      setError("Failed quick-sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Brand logo & header */}
      <div className="text-center space-y-2 pt-4">
        <div className="w-13 h-13 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20 font-bold border border-blue-500 text-lg">
          EP
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-black text-gray-950 tracking-tight">E-Pass Gate Portal</h1>
          <p className="text-xs text-gray-500">National Integrated College Gate Pass System</p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.03)] space-y-5">
        {/* Toggle Student / Faculty Tab */}
        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-150 relative z-0">
          <button
            onClick={() => {
              setActiveTab("student");
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold leading-none rounded-xl relative cursor-pointer ${
              activeTab === "student" ? "text-blue-700 font-extrabold" : "text-gray-400"
            }`}
          >
            {activeTab === "student" && (
              <motion.div
                layoutId="authTabIndicator"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-gray-100 -z-10"
              />
            )}
            Student Portal
          </button>

          <button
            onClick={() => {
              setActiveTab("admin");
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold leading-none rounded-xl relative cursor-pointer ${
              activeTab !== "student" ? "text-blue-700 font-extrabold" : "text-gray-400"
            }`}
          >
            {activeTab !== "student" && (
              <motion.div
                layoutId="authTabIndicator"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-gray-100 -z-10"
              />
            )}
            Admin Portal
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-semibold leading-normal">{error}</p>
          </div>
        )}

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Student-Only Fields */}
          {isRegister && activeTab === "student" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Student Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    placeholder="e.g. Raushan Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-150 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Roll Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">University Roll Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">
                    <Hash className="w-4 h-4" />
                  </span>
                  <input
                    id="reg-rollnumber"
                    type="text"
                    required
                    placeholder="e.g. CS2021045"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    className="w-full text-xs font-semibold uppercase tracking-wider bg-gray-50 border border-gray-150 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Branch Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Academic Department</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <select
                    id="reg-branch"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full text-xs font-semibold bg-gray-50 border border-gray-150 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all text-gray-700"
                  >
                    {BRANCHES.map((b, i) => (
                      <option key={i} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TG Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Assigned Teacher Guardian (TG)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <select
                    id="reg-tg"
                    value={selectedTG}
                    onChange={(e) => setSelectedTG(e.target.value)}
                    className="w-full text-xs font-semibold bg-gray-50 border border-gray-150 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all text-gray-700"
                  >
                    {TUTOR_GUARDIANS.map((tg, i) => (
                      <option key={i} value={tg}>{tg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Core Login (Email + Password) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="login-email"
                type="email"
                required
                placeholder={activeTab === "student" ? "student@college.edu" : "faculty@college.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-150 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Password</label>
              {!isRegister && (
                <span className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer">Recover?</span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-150 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all text-gray-800"
              />
            </div>
          </div>

          {/* Submit Action */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs  rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center space-x-1.5 border border-blue-500 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? "Create Student Account" : "Access Gate Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Register vs Login link */}
        {activeTab === "student" && (
          <div className="text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {isRegister ? "Already registered? Login here" : "New Student? Setup digital profile here"}
            </button>
          </div>
        )}
      </div>

      {/* QUICK TESTING BYPASS PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-center space-x-1.5 px-2">
          <div className="h-px bg-gray-200 grow"></div>
          <span className="text-[9px] text-gray-400 font-extrabold tracking-wider uppercase whitespace-nowrap">Evaluator Testing Bypass Panel</span>
          <div className="h-px bg-gray-200 grow"></div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Quick Student (Rithik Raj) */}
          <button
            onClick={() => triggerQuickLogin({
              email: "rithikrajwd@gmail.com",
              role: "student",
              name: "Rithik Raj",
              roll: "CY2023088",
              branch: "CYBER",
              tgName: "Yogesh Kumar Sharma"
            })}
            className="bg-white border hover:bg-blue-50 transition-colors border-gray-200 hover:border-blue-400 rounded-xl p-3 text-center flex flex-col items-center justify-center text-xs shadow-xs cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs mb-1 bg-gradient-to-tr from-blue-50 to-indigo-100">
              S1
            </div>
            <span className="font-bold text-gray-800 block text-[10px] leading-tight">Rithik Raj</span>
            <span className="text-[8px] text-blue-600 uppercase font-extrabold mt-0.5">Student</span>
          </button>

          {/* Quick Admin (Garima Mathur) */}
          <button
            onClick={() => triggerQuickLogin({
              email: "admin@college.edu",
              role: "admin",
              name: "Garima Mathur",
              branch: "CYBER"
            })}
            className="bg-white border hover:bg-emerald-50 transition-colors border-gray-200 hover:border-emerald-400 rounded-xl p-3 text-center flex flex-col items-center justify-center text-xs shadow-xs cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-xs mb-1 bg-gradient-to-tr from-emerald-50 to-teal-100">
              AD
            </div>
            <span className="font-bold text-gray-800 block text-[10px] leading-tight font-sans">Garima Mathur</span>
            <span className="text-[8px] text-emerald-700 uppercase font-extrabold mt-0.5">Admin Staff</span>
          </button>
        </div>
      </div>
    </div>
  );
}
