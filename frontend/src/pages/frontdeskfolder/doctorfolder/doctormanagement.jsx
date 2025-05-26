import { useState, useEffect } from 'react';
import Link from 'next/link';
import API_BASE_URL from '../../../../config';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        window.location.href = '/frontdeskfolder/loginfolder/login';
        return;
      }

      if (!res.ok) {
        setError('Failed to fetch doctors');
        return;
      }

      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Something went wrong while fetching doctors');
    } finally {
      setLoading(false);
    }
  };

  const deleteDoctor = async (id) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        window.location.href = '/frontdeskfolder/loginfolder/login';
        return;
      }

      if (!res.ok) {
        const msg = await res.text();
        alert('Failed to delete doctor: ' + msg);
        return;
      }

      fetchDoctors(); // Refresh list
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Something went wrong while deleting');
    }
  };

  return (
    <div className="bg-[#0d0d0d] p-6 rounded-3xl shadow-lg border border-neutral-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-white w-full md:px-10">Doctor Profiles</h2>
        <Link href="/frontdeskfolder/doctorfolder/adddoctor">
          <button className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-6 py-2 rounded-xl font-semibold hover:brightness-110 transition-all w-full md:w-auto">
            + Add Doctor
          </button>
        </Link>
      </div>

      {/* Status Messages */}
      {loading && <p className="text-white">Loading doctors...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && doctors.length === 0 && (
        <p className="text-neutral-400">No doctors found.</p>
      )}

      {/* Doctors Table */}
      {!loading && !error && doctors.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="min-w-full text-sm text-center text-white bg-neutral-900 rounded-xl overflow-hidden">
            <thead className="bg-neutral-800 text-neutral-400">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Specialization</th>
                <th className="px-4 py-3 whitespace-nowrap">Gender</th>
                <th className="px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc, idx) => (
                <tr key={doc.id} className={idx % 2 === 0 ? "bg-neutral-900" : "bg-neutral-950"}>
                  <td className="px-4 py-3 whitespace-nowrap">{doc.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{doc.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{doc.specialization}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{doc.gender}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => deleteDoctor(doc.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
