import { useState } from 'react';
import { useRouter } from 'next/router';
// import '../../globals.css';
import { API_BASE_URL } from '../../config';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      console.log("after request");

      if (res.ok) {
        alert('Registration successful, please login');
        router.push('/');
      } else {
        const errorData = await res.json();
        alert(errorData.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animate-gradient">
      <form onSubmit={handleSignUp} className="bg-neutral-900 p-6 rounded-3xl shadow-lg border border-neutral-800 w-80">
        <h2 className="text-2xl mb-4 text-center font-semibold text-white">Sign Up</h2>
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
        <div className="mb-4">
          <label className="block mb-1 text-neutral-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-neutral-800 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-neutral-400">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="bg-neutral-800 text-white placeholder:text-neutral-500 border border-neutral-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all w-full"
            required
          />
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white py-2 rounded-xl font-semibold hover:brightness-110 transition-all">
          Sign Up
        </button>
      </form>
    </div>
  );
}
