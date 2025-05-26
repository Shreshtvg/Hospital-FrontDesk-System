import { useState, useEffect } from 'react';
import { useRouter } from "next/router"; 
import API_BASE_URL from '../../../../config';

export default function QueueManagement() {
  const [queue, setQueue] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const router = useRouter();

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        router.push('/frontdeskfolder/loginfolder/login');
        return;
      }

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      setQueue(data);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    }
  };

  const clearQueue = async () => {
    const res = await fetch(`${API_BASE_URL}/queue-deleteall`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchQueue();
    }
  };

  const filteredQueue = searchQuery
    ? queue.filter((item) => {
        const patientNameMatch = item.patient_name.toLowerCase().includes(searchQuery.toLowerCase());
        const queueNumberMatch = item.queue_number.toString().includes(searchQuery);
        return patientNameMatch || queueNumberMatch;
      })
    : queue;

  return (
    <div className="bg-[#0d0d0d] p-6 rounded-3xl shadow-lg border border-neutral-800">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-white w-full md:px-10">Queue Management</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full md:w-auto md:px-2">
          <input
            type="text"
            placeholder="Search Queue Number or Patient Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-neutral-900 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all w-full sm:w-56"
          />
          <button 
            onClick={clearQueue} 
            className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-6 py-2 rounded-xl font-semibold hover:brightness-110 transition-all w-full sm:w-auto"
          >
            Clear Queue
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-800">
        <table className="min-w-full text-sm text-center text-white bg-neutral-900 rounded-xl overflow-hidden">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Queue Number</th>
              <th className="px-4 py-3 whitespace-nowrap">Patient Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueue.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-neutral-900" : "bg-neutral-950"}>
                <td className="px-4 py-3 whitespace-nowrap">{item.queue_number}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.patient_name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
