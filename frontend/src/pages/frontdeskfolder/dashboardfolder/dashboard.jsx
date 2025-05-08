import { useEffect, useRef, useState } from "react";
import QueueManagement from "../queuefolder/queuemanagement";
import AppointmentManagement from "../appointmentfolder/appointmentmanagement";
import DoctorManagement from "../doctorfolder/doctormanagement";
// import "../../globals.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("queue");
  const [underlineStyle, setUnderlineStyle] = useState({});
  const tabRefs = {
    queue: useRef(null),
    appointments: useRef(null),
    doctors: useRef(null),
  };

  // Update underline position when activeTab changes
  useEffect(() => {
    const el = tabRefs[activeTab].current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setUnderlineStyle({
        left: rect.left,
        width: rect.width,
      });
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen animate-gradient text-white font-inter antialiased">
      {/* Header */}
      <header className="p-6 border-b border-neutral-800 shadow-sm sticky top-0 z-10 bg-[#0d0d0d]">
        <h1 className="text-3xl font-semibold text-center text-neutral-100">Sparsh Hospital</h1>
      </header>

      {/* Tabs */}
      <div className="relative mt-10">
        <div className="flex justify-center gap-6" id="tabs-container">
          {[
            { id: "queue", label: "Queue" },
            { id: "appointments", label: "Appointments" },
            { id: "doctors", label: "Doctors" },
          ].map((tab) => (
            <button
              key={tab.id}
              ref={tabRefs[tab.id]}
              onClick={() => setActiveTab(tab.id)}
              className={`text-lg px-4 py-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-white font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Underline */}
        <div
          className="absolute bottom-0 h-[2px] bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-300 rounded-full"
          style={{
            position: "absolute",
            top: "100%",
            height: "2px",
            width: underlineStyle.width || 0,
            left: underlineStyle.left || 0,
            transition: "all 0.3s ease",
          }}
        />
      </div>

      {/* Panel */}
      <main className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-neutral-800 p-6 sm:p-10 shadow-xl">
          {activeTab === "queue" && <QueueManagement />}
          {activeTab === "appointments" && <AppointmentManagement />}
          {activeTab === "doctors" && <DoctorManagement />}
        </div>
      </main>
    </div>
  );
}
