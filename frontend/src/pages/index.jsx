// pages/index.js
// import './globals.css';
import { useRouter } from 'next/router';

//bg-[#0d0d0d] actually this is the color of the background used before

export const config = {
  unstable_runtimeJS: true
};

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-gradient space-y-8 py-12 px-6 text-white">

      <h1 className="text-4xl sm:text-7xl font-bold text-center mb-12 bg-gradient-to-r from-fuchsia-500 to-indigo-400 text-transparent bg-clip-text animate-fade-in">
  Sparsh Hospital
</h1>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
        <button
          onClick={() => router.push('./frontdeskfolder/loginfolder/login')}
          className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white border border-gray-300 rounded-xl shadow-lg hover:brightness-125 transition-all text-xl font-semibold"

        >
          Front Desk Login
        </button>
        <button
          onClick={() => router.push('./doctorloginfolder/doctor-login')}
          className="w-full sm:w-auto px-12 py-4 bg-neutral-900 text-white border border-gray-300 rounded-xl shadow-lg hover:brightness-125 transition-all text-xl font-semibold"

        >
          Doctor Login
        </button>
      </div>
    </div>
  );
}
