import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
// import "../globals.css";
import API_BASE_URL from '../../../config';

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("");
  const [doctorId, setDoctorId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const doctoken = localStorage.getItem("doctortoken");
      if (!doctoken) {
        router.push("./doctor-login");
        return;
      }

      try {
        const decoded = jwtDecode(doctoken);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.clear();
          alert("Session expired. Please log in again.");
          router.push("./doctor-login");
          return;
        }

        setDoctorName(localStorage.getItem("doctor_name") || "Doctor");
        setDoctorId(localStorage.getItem("doctor_id"));
      } catch (error) {
        console.error("Invalid token:", error);
        router.push("./doctor-login");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (doctorId) {
      fetchQueue(doctorId);
    }
  }, [doctorId]);

  const fetchQueue = async (doctorId) => {
    try {
      const doctoken = localStorage.getItem("doctortoken");
      const res = await fetch(`${API_BASE_URL}/doctor-queue?doctor_id=${doctorId}`, {
        headers: { Authorization: `Bearer ${doctoken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(data || []);
      } else {
        console.error("Failed to fetch queue");
      }
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async (patientId) => {
    try {
      const doctoken = localStorage.getItem("doctortoken");
      const res = await fetch(`${API_BASE_URL}/doctorremovepatient/${patientId}?doctor_id=${doctorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${doctoken}` },
      });
      if (res.status === 401) {
        alert("Unauthorized. Please log in again.");
        router.push("./doctor-login");
        return;
      }
      if (res.ok) {
        setQueue(queue.filter((patient) => patient.id !== patientId));
      } else {
        alert("Failed to mark patient as done");
      }
    } catch (error) {
      console.error("Error marking patient as done:", error);
    }
  };

  return (
    <div className="min-h-screen p-6 animate-gradient text-white rounded-3xl shadow-lg border border-neutral-800">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-center">Doctor Dashboard</h1>
        <br />
        <hr />
        <br />
        <p className="text-5xl font-semibold text-white mt-2">{doctorName ? `Dr. ${doctorName}` : "Loading doctor details..."}</p>
      </header>
      <section>
  <h2 className="text-xl font-semibold mb-4 px-2">Patient Queue</h2>

  {queue.length === 0 ? (
    <p className="text-neutral-400">No patients in the queue.</p>
  ) : (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800 shadow-md">
      <table className="min-w-full text-left bg-[#1a1a1a] text-white rounded-2xl">
        <thead className="bg-[#2b2b2b] text-neutral-300">
          <tr>
            <th className="px-6 py-4">Patient Name</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((patient, idx) => (
            <tr
              key={patient.id}
              className={`${idx % 2 === 0 ? "bg-[#1f1f1f]" : "bg-[#2a2a2a]"} border-t border-neutral-700`}
            >
              <td className="px-6 py-4">{patient.patient_name}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleDone(patient.id)}
                  className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl hover:brightness-110 transition"
                >
                  Done
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>

    </div>
  );
}
