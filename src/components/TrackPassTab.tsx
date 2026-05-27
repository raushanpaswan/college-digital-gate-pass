/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Clock3,
  ClipboardList
} from "lucide-react";

import { motion } from "motion/react";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import { PassRequest, PassStatus } from "../types";

interface TrackPassTabProps {
  requests: PassRequest[];
  initialSelectedId: string | null;
}

export default function TrackPassTab({
  requests,
  initialSelectedId
}: TrackPassTabProps) {

  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId || (requests[0]?.id || null)
  );

  const currentRequest =
    requests.find((r) => r.id === selectedId) || requests[0];

  // =========================
  // TG APPROVAL FUNCTION
  // =========================

  const approveTG = async () => {

    if (!currentRequest) return;

    try {

      await updateDoc(doc(db, "passes", currentRequest.id), {

        status: "TG Approved",

        tgApproved: true,

        tgApproval: {
          approved: true,
          remarks: "Approved from notification panel",
          date: new Date().toISOString()
        }

      });

      alert("TG Approved Successfully");

      window.location.reload();

    } catch (error) {

      console.log(error);

      alert("TG Approval Failed");

    }

  };

  // =========================
  // HOD APPROVAL FUNCTION
  // =========================

  const approveHOD = async () => {

    if (!currentRequest) return;

    try {

      await updateDoc(doc(db, "passes", currentRequest.id), {

        status: "Approved",

        hodApproved: true,

        hodApproval: {
          approved: true,
          remarks: "Final approval completed",
          date: new Date().toISOString()
        }

      });

      alert("Final Approval Success");

      window.location.reload();

    } catch (error) {

      console.log(error);

      alert("HOD Approval Failed");

    }

  };

  const getStatusDisplay = (status: PassStatus) => {

    switch (status) {

      case "pending":
      case "Pending" as any:
        return {
          label: "Pending Tutor Guardian Approval",
          color: "text-amber-500 bg-amber-50 border-amber-100"
        };

      case "approved_tg":
      case "TG Approved" as any:
        return {
          label: "TG Approved • Pending HOD Sign",
          color: "text-blue-500 bg-blue-50 border-blue-100"
        };

      case "approved":
      case "Approved" as any:
        return {
          label: "Approved & Authorized to Gate Out",
          color: "text-emerald-500 bg-emerald-50 border-emerald-100"
        };

      case "rejected":
      case "Rejected" as any:
        return {
          label: "Request Disallowed / Rejected",
          color: "text-rose-500 bg-rose-50 border-rose-100"
        };

      default:
        return {
          label: "Pending Tutor Guardian Approval",
          color: "text-amber-500 bg-amber-50 border-amber-100"
        };
    }
  };

  if (!currentRequest) {
    return (
      <div className="space-y-6 pb-24 text-center py-12">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500">
          <ClipboardList className="w-8 h-8 font-light" />
        </div>

        <div className="space-y-2">
          <h2 className="font-bold text-gray-800 text-lg">
            No Request to Track
          </h2>

          <p className="text-gray-400 text-xs max-w-xs mx-auto">
            No pass requests found.
          </p>
        </div>
      </div>
    );
  }

  const progress =
    currentRequest.hodApproved ||
    currentRequest.status === "Approved"
      ? 100
      : currentRequest.tgApproved ||
        currentRequest.status === "TG Approved"
      ? 65
      : 30;

  const statusDisplay = getStatusDisplay(currentRequest.status);

  const formatDateTime = (isoString?: string) => {

    if (!isoString) return "";

    const date = new Date(isoString);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

  };

  return (

    <div className="space-y-5 pb-24">

      {/* HEADER */}

      <div className="space-y-1">

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Track Digital Pass
        </h1>

        <p className="text-xs text-gray-500">
          View real-time approval status.
        </p>

      </div>

      {/* REQUEST CARD */}

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">

        <div className="flex justify-between items-start">

          <div>

            <span className="text-[10px] font-mono text-gray-400">
              REQUEST ID: {currentRequest.id}
            </span>

            <h2 className="font-bold text-gray-900 text-lg">
              {currentRequest.destination}
            </h2>

          </div>

          <div
            className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${statusDisplay.color}`}
          >
            {statusDisplay.label}
          </div>

        </div>

        {/* REASON */}

        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">

          <p className="text-[10px] text-gray-400 uppercase font-semibold">
            Reason
          </p>

          <p className="text-xs text-gray-600 mt-1 italic">
            "{currentRequest.reason}"
          </p>

        </div>

      </div>

      {/* TIMELINE */}

      <div className="bg-white border border-gray-150 rounded-2xl p-5">

        <div className="flex justify-between items-center mb-6">

          <h3 className="text-xs font-bold text-gray-400 uppercase">
            Approval Progress Timeline
          </h3>

          <span
            className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${statusDisplay.color}`}
          >
            {statusDisplay.label}
          </span>

        </div>

        <div className="relative pl-7 space-y-8">

          {/* LINE */}

          <div className="absolute top-3 bottom-3 left-3 w-0.5 bg-gray-100">

            <motion.div
              className="absolute top-0 left-0 w-full bg-blue-500 rounded-full"
              initial={{ height: 0 }}
              animate={{ height: `${progress}%` }}
              transition={{ duration: 0.8 }}
            />

          </div>

          {/* REQUEST CREATED */}

          <div className="relative space-y-1">

            <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center">

              <CheckCircle2 className="w-4 h-4 text-emerald-700" />

            </div>

            <div className="flex justify-between items-center">

              <h4 className="text-sm font-bold text-gray-800">
                Pass Request Created
              </h4>

              <span className="text-[10px] font-mono text-gray-400">
                {formatDateTime(currentRequest.createdAt)}
              </span>

            </div>

            <p className="text-xs text-gray-500">
              Request submitted successfully.
            </p>

          </div>

          {/* TG APPROVAL */}

          <div className="relative space-y-2">

            <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center">

              {
                currentRequest.tgApproved
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  : <Clock3 className="w-4 h-4 text-amber-600" />
              }

            </div>

            <h4 className="text-sm font-bold text-gray-800">
              Stage 1: Tutor Guardian (TG)
            </h4>

            <p className="text-xs text-gray-500">
              Waiting for TG approval.
            </p>

            {
              !currentRequest.tgApproved && (
                <button
                  onClick={approveTG}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Accept TG
                </button>
              )
            }

          </div>

          {/* HOD */}

          <div className="relative space-y-2">

            <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-gray-50 border border-gray-300 flex items-center justify-center">

              {
                currentRequest.hodApproved
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  : <User className="w-4 h-4 text-gray-400" />
              }

            </div>

            <h4 className="text-sm font-bold text-gray-800">
              Stage 2: Head of Department (HOD)
            </h4>

            <p className="text-xs text-gray-500">
              Final approval stage.
            </p>

            {
              currentRequest.tgApproved &&
              !currentRequest.hodApproved && (

                <button
                  onClick={approveHOD}
                  className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Approve HOD
                </button>

              )
            }

          </div>

        </div>

      </div>

    </div>

  );
}