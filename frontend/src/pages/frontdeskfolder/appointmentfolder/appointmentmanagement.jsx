import { useState, useEffect } from 'react';
import { useRouter } from "next/router";
import API_BASE_URL from '../../../../config';

export default function AppointmentManagement() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setAppointments(data);
    }
  };

  const addAppointment = async () => {
    if (!patientName || !doctorId || !appointmentTime) return;

    const res = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        patient_name: patientName, 
        doctor_id: parseInt(doctorId), 
        appointment_time: appointmentTime 
      })
    });

    if (res.status === 401) {
      router.push('/frontdeskfolder/loginfolder/login');
      return;
    }

    if (res.ok) {
      setPatientName('');
      setDoctorId('');
      setAppointmentTime('');
      fetchAppointments();
    }

    const resqueue = await fetch(`${API_BASE_URL}/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ patient_name: patientName })
    });

    if (resqueue.status === 401) {
      router.push('/frontdeskfolder/loginfolder/login');
      return;
    }

    if (!resqueue.ok) {
      alert("Failed to add patient to queue");
    }
  };

  const deleteAppointment = async (appointmentId, patientNameused) => {
    const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      router.push('/frontdeskfolder/loginfolder/login');
      return;
    }

    if (res.ok) {
      setAppointments(appointments.filter(appt => appt.id !== appointmentId));
    } else {
      alert("Failed to delete appointment");
    }

    const res2 = await fetch(`${API_BASE_URL}/queue/${patientNameused}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res2.status === 401) {
      router.push('/frontdeskfolder/loginfolder/login');
      return;
    }

    if (!res2.ok) {
      alert("Failed to remove patient from queue");
    }
  };

  return (
    <div className="bg-[#0d0d0d] p-4 md:p-6 rounded-3xl shadow-lg border border-neutral-800 max-w-screen-lg mx-auto overflow-x-auto">
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">Manage Appointments</h2>

      {/* Input Form */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 justify-center mb-8">
        <input
          type="text"
          placeholder="Patient Name"
          value={patientName}
          onChange={e => setPatientName(e.target.value)}
          className="bg-neutral-900 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 w-full md:w-56"
        />
        <input
          type="number"
          placeholder="Doctor ID"
          value={doctorId}
          onChange={e => setDoctorId(e.target.value)}
          className="bg-neutral-900 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 w-full md:w-56"
        />
        <input
          type="text"
          placeholder="Appointment Time"
          value={appointmentTime}
          onChange={e => setAppointmentTime(e.target.value)}
          className="bg-neutral-900 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 w-full md:w-56"
        />
        <button
          onClick={addAppointment}
          className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-6 py-2 rounded-xl font-semibold hover:brightness-110 transition-all w-full md:w-auto"
        >
          Book Appointment
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-800">
        <table className="min-w-full text-sm text-center text-white bg-neutral-900 rounded-xl overflow-hidden">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Patient</th>
              <th className="px-6 py-3">Doctor</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt, idx) => (
              <tr key={appt.id} className={idx % 2 === 0 ? "bg-neutral-900" : "bg-neutral-950"}>
                <td className="px-6 py-3">{appt.id}</td>
                <td className="px-6 py-3">{appt.patient_name}</td>
                <td className="px-6 py-3">{appt.doctor_name}</td>
                <td className="px-6 py-3">{appt.appointment_time}</td>
                <td className="px-6 py-3">{appt.status}</td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => deleteAppointment(appt.id, appt.patient_name)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg transition-all"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
