/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { 
  Plus, 
  MapPin, 
  FileText, 
  Calendar, 
  Clock, 
  Send, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { motion } from "motion/react";

interface CreatePassTabProps {
  onSubmit: (payload: {
    destination: string;
    reason: string;
    leaveDate: string;
    leaveTime: string;
    returnDate: string;
    returnTime: string;
  }) => Promise<void>;
}

export default function CreatePassTab({ onSubmit }: CreatePassTabProps) {
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  
  // Set default dates to today/tomorrow
  const todayStr = new Date().toISOString().split("T")[0];
  const [leaveDate, setLeaveDate] = useState(todayStr);
  const [leaveTime, setLeaveTime] = useState("09:00");
  const [returnDate, setReturnDate] = useState(todayStr);
  const [returnTime, setReturnTime] = useState("18:00");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ready shortcuts for faster entry
  const DESTINATION_SHORTCUTS = [
    "Home Town (Patna)",
    "Local Market (Central Square)",
    "Consulting Doctor (Appolo Clinic)",
    "Family Residence (Local)",
    "Railway Station",
  ];

  const REASON_SHORTCUTS = [
    "Urgent family function and medical checkup.",
    "Required to purchase exam stationery and engineering kit.",
    "Scheduled dentist consult for tooth extractions.",
    "Visiting local relatives for dinner on weekend.",
  ];

const handleFormSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Agar already loading hai to dobara submit mat karo
  if (loading) return;

  setError(null);
  setLoading(true);

  try {

    // VALIDATIONS
    if (!destination.trim()) {
      throw new Error("Please specify the destination location.");
    }

    if (!reason.trim()) {
      throw new Error("Please write down the exact reason for leaving campus.");
    }

    if (reason.length < 10) {
      throw new Error("Reason must be at least 10 characters.");
    }

    const leaveDateTime = new Date(`${leaveDate}T${leaveTime}`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}`);

    if (returnDateTime <= leaveDateTime) {
      throw new Error("Return time must be after departure time.");
    }

    console.log("Submitting pass request...");

    // IMPORTANT FIX
    await onSubmit({
      destination,
      reason,
      leaveDate,
      leaveTime,
      returnDate,
      returnTime,
    });

    console.log("Success");

    // RESET FORM
    setDestination("");
    setReason("");

    setLeaveDate(todayStr);
    setReturnDate(todayStr);

    setLeaveTime("09:00");
    setReturnTime("18:00");

    alert("Gate Pass Submitted Successfully!");

  } catch (err: any) {

    console.error(err);

    setError(
      err?.message || "Failed to create pass."
    );

  } finally {

    // ALWAYS STOP LOADING
    setLoading(false);

  }
};

  return (
    <div className="space-y-5 pb-24">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create E-Gate Pass</h1>
        <p className="text-xs text-gray-500">Fill out your travel details below. Requests are forwarded directly to your Teacher Guardian (TG) for verification.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-800 text-xs flex items-start space-x-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </motion.div>
        )}

        {/* Destination Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Destination Location</label>
          <div className="relative">
            <span className="absolute left-4.5 top-3.5 text-gray-400">
              <MapPin className="w-4.5 h-4.5" />
            </span>
            <input
              id="input-destination"
              type="text"
              required
              placeholder="e.g. Hostels, Home, Local Station"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-sm bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-2xl pl-12 pr-4 py-3.5 outline-none transition-all text-gray-800 placeholder:text-gray-400 shadow-xs"
            />
          </div>

          {/* Shortcuts for Dest */}
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {DESTINATION_SHORTCUTS.map((dest, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setDestination(dest)}
                className="px-2.5 py-1 text-[10px] font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg cursor-pointer transition-colors"
              >
                {dest.split(" (")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Reason for Campus Leave</label>
          <div className="relative">
            <span className="absolute left-4.5 top-3.5 text-gray-400">
              <FileText className="w-4.5 h-4.5" />
            </span>
            <textarea
              id="input-reason"
              required
              rows={3}
              placeholder="Provide exact explanation for outing permission..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-sm bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-2xl pl-12 pr-4 py-3.5 outline-none transition-all text-gray-800 placeholder:text-gray-400 shadow-xs resize-none"
            />
          </div>

          {/* Shortcuts for reasons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {REASON_SHORTCUTS.map((rs, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReason(rs)}
                className="px-2.5 py-1 text-[10px] font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg cursor-pointer max-w-sm font-light text-left truncate transition-all"
              >
                "{rs.slice(0, 32)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Outbound Timings */}
        <div className="space-y-4 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Leave Schedule (Timings)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date & Time */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase block">Departure Date</label>
              <div className="relative">
                <input
                  id="input-leave-date"
                  type="date"
                  required
                  min={todayStr}
                  value={leaveDate}
                  onChange={(e) => {
                    setLeaveDate(e.target.value);
                    if (new Date(e.target.value) > new Date(returnDate)) {
                      setReturnDate(e.target.value);
                    }
                  }}
                  className="w-full text-xs font-semibold bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2.5 outline-none text-gray-800 cursor-pointer shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase block">Departure Time</label>
              <div className="relative">
                <input
                  id="input-leave-time"
                  type="time"
                  required
                  value={leaveTime}
                  onChange={(e) => setLeaveTime(e.target.value)}
                  className="w-full text-xs font-mono font-semibold bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2.5 outline-none text-gray-800 cursor-pointer shadow-xs"
                />
              </div>
            </div>

            {/* Return Date & Time */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase block">Expected Return Date</label>
              <div className="relative">
                <input
                  id="input-return-date"
                  type="date"
                  required
                  min={leaveDate}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2.5 outline-none text-gray-800 cursor-pointer shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase block">Expected Return Time</label>
              <div className="relative">
                <input
                  id="input-return-time"
                  type="time"
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full text-xs font-mono font-semibold bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2.5 outline-none text-gray-800 cursor-pointer shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Note on workflow */}
        <div className="text-[11px] text-gray-400 flex items-start space-x-2 px-1">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-blue-400 mt-0.5" />
          <p className="leading-relaxed">
            By submiting this digital form, you affirm that the details are true. Your Tutor Guardian will review, followed by Head of Department (HOD) final confirmation.
          </p>
        </div>

        {/* Submit Action */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className={`w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-500/15 flex items-center justify-center space-x-2 border border-blue-500 cursor-pointer transition-colors`}
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <span className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              <span>Publishing Request...</span>
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Gate Pass-Request</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
