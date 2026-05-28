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
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
}
