/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, ClipboardList, PenTool, User } from "lucide-react";
import { motion } from "motion/react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: "student" | "tg" | "hod";
}

export default function BottomNav({ activeTab, setActiveTab, role }: BottomNavProps) {
  // If user is TG or HOD, they have a different primary portal, 
  // but they still use a simplified mobile bottom navigation
  const tabs = role === "student" ? [
    { id: "home", label: "Home", icon: Home },
    { id: "track", label: "Track Pass", icon: ClipboardList },
    { id: "create", label: "Create Pass", icon: PenTool },
    { id: "profile", label: "Profile", icon: User },
  ] : [
    { id: "home", label: "Approvals", icon: ClipboardList },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] px-4 py-2 pb-safe-bottom">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[64px] focus:outline-none cursor-pointer transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-blue-50/70 rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              
              <Icon
                className={`w-5.5 h-5.5 mb-1 transition-all duration-200 ${
                  isActive ? "text-blue-600 scale-110 font-bold" : "text-gray-400"
                }`}
              />
              
              <span
                className={`text-[10px] font-medium tracking-wide transition-colors ${
                  isActive ? "text-blue-700 font-semibold" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
