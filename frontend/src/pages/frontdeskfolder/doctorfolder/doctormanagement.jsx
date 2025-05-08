import { useState, useEffect } from 'react';
import Link from 'next/link';
import '../../globals.css';

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
      const res = await fetch('http://localhost:8000/doctors', {
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
      const res = await fetch(`http://localhost:8000/doctors/${id}`, {
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white px-10 w-full">Doctor Profiles</h2>
        <Link href="/frontdeskfolder/doctorfolder/adddoctor">
          <button className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-9 py-1 rounded-xl font-semibold hover:brightness-110 transition-all">
            + Add Doctor
          </button>
        </Link>
      </div>

      {loading && <p className="text-white">Loading doctors...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && doctors.length === 0 && (
        <p className="text-neutral-400">No doctors found.</p>
      )}

      {!loading && !error && doctors.length > 0 && (
        <table className="min-w-full table-auto text-left text-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Specialization</th>
              <th className="px-4 py-2 border-b">Gender</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc.id} className="border-b">
                <td className="px-4 py-2">{doc.id}</td>
                <td className="px-4 py-2">{doc.name}</td>
                <td className="px-4 py-2">{doc.specialization}</td>
                <td className="px-4 py-2">{doc.gender}</td>
                <td className="px-4 py-2">
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
      )}
    </div>
  );
}
