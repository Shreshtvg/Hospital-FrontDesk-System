import { useState } from 'react';
import { useRouter } from 'next/router';
// import '../../globals.css';
import API_BASE_URL from '../../../../config';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/frontdesk/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      console.log("after login");

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        router.push('../dashboardfolder/dashboard');
      } else {
        const errorData = await res.json();

        if (res.status === 404 || errorData.msg === 'User not found') {
          alert('User not found');
        } else {
          alert(errorData.msg || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert("Didn't receive response from server");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-gradient space-y-6">
      <form onSubmit={handleLogin} className="bg-neutral-900 p-6 rounded-3xl shadow-lg border border-neutral-800 w-80">
        <h2 className="text-2xl mb-4 text-center font-semibold text-white">Front Desk Login</h2>
        <div className="mb-4">
          <label className="block mb-1 text-neutral-400">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="bg-neutral-800 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all w-full"
            required
          />
        </div>
        <div className="mb-4 text-neutral-400">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-neutral-800 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all w-full"
            required
          />
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white py-2 rounded-xl font-semibold hover:brightness-110 transition-all">
          Login
        </button>
        <div className="mt-4 text-center text-neutral-400">
          <span>New user? </span>
          <button 
            type="button" 
            onClick={() => router.push('./signup')} 
            className="text-blue-500 underline"
          >
            Sign up here.
          </button>
        </div>
      </form>

      {/* ✅ "Go to Main Page" Button */}
      <button 
        onClick={() => router.push('/')} 
        className="mt-6 bg-neutral-700 text-white px-4 py-2 rounded-xl hover:bg-neutral-600 transition-all"
      >
        Go to Main Page
      </button>
    </div>
  );
}
