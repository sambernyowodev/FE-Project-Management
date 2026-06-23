import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients for modern sleek design */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-8 transition-all duration-300">
        {/* Logo/Brand placeholder */}
        <div className="flex justify-center mb-8">
          <div className="w-28 h-18">
            <img src="/mii.png" alt="Logo" className="w-full h-full" />
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
