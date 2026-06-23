import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useRegister } from '../../modules/auth/hooks/useAuth';
import { useEffect, useState } from 'react';

export function RegisterPage() {
  const {
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    error,
    isPending,
    isSuccess,
    handleSubmit
  } = useRegister();

  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create an Account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sign up to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center">
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow outline-none"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow outline-none"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-shadow outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-6"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
          Sign in
        </Link>
      </div>

      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Registration Successful!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Your account has been created successfully. You can now log in using your credentials.
            </p>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 dark:shadow-none"
            >
              Go to Login Page
            </button>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              Redirecting automatically in {countdown} seconds...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
