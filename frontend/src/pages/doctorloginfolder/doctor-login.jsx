import { useState } from 'react';
import { useRouter } from 'next/router';
// import '../globals.css';

export default function DoctorLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        // alert('Doctor login successful');
        localStorage.setItem('doctortoken', data.access_token);
        localStorage.setItem('doctor_name', data.doctor_name);
        localStorage.setItem('doctor_id', data.doctor_id);
        router.push('./doctor-dashboard');
      } else {
        const errorData = await res.json();
        alert(errorData.detail || 'Doctor login failed');
      }
    } catch (error) {
      console.error('Error during doctor login:', error);
      alert('No response from server');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-gradient space-y-6">
      <form
        onSubmit={handleDoctorLogin}
        className="bg-neutral-900 p-6 rounded-3xl shadow-lg border border-neutral-800 w-80"
      >
        <h2 className="text-2xl mb-4 text-center font-semibold text-white">Doctor Login</h2>
        <div className="mb-4">
          <label className="block mb-1 text-neutral-400">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="bg-neutral-800 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-neutral-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-neutral-800 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white py-2 rounded-xl font-semibold hover:brightness-110 transition-all"
        >
          Login as Doctor
        </button>
      </form>

      <button
        onClick={() => router.push('/')}
        className="mt-6 bg-neutral-700 text-white px-4 py-2 rounded-xl hover:bg-neutral-600 transition-all"
      >
        Go to Main Page
      </button>
    </div>
  );
}
