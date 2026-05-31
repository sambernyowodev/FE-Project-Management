import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChangePassword } from '@/modules/auth/hooks/useAuth';
import {
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePasswordMutation = useChangePassword();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [clientError, setClientError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleBack = () => {
    navigate(-1);
  };

  // Real-time strength check requirements
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setSuccessMessage(null);

    // 1. Check for empty fields
    if (!oldPassword || !newPassword || !confirmPassword) {
      setClientError('Semua field wajib diisi');
      return;
    }

    // 2. Validate password strength
    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
      setClientError(
        'Password baru harus minimal 8 karakter dan mengandung campuran huruf besar, kecil, serta angka'
      );
      return;
    }

    // 3. New password cannot equal old password
    if (newPassword === oldPassword) {
      setClientError('Password baru tidak boleh sama dengan password lama');
      return;
    }

    // 4. Check confirm password match
    if (newPassword !== confirmPassword) {
      setClientError('Konfirmasi password baru tidak cocok');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword
      });
      
      setSuccessMessage('Password Anda berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err: any) {
      // Handle server error response
      const errMsg = err.response?.data?.message || err.message || 'Gagal mengubah password. Silakan coba lagi.';
      setClientError(Array.isArray(errMsg) ? errMsg[0] : errMsg);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-12">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-on-surface-variant cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-on-background">Ubah Password</h1>
          <p className="text-secondary text-xs md:text-sm">Jaga keamanan akun Anda dengan memperbarui password secara berkala.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
        {/* Form Alerts */}
        {clientError && (
          <div className="flex gap-3 items-center p-4 bg-error-container text-on-error-container rounded-xl border border-error/20 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
            <p className="text-xs font-semibold">{clientError}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex gap-3 items-center p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl border border-emerald-500/20 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-semibold">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Old Password */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-bold text-on-background uppercase tracking-wider">Password Lama</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password lama"
                className="w-full pl-10 pr-10 py-2.5 border border-outline-variant rounded-xl text-sm bg-background text-on-background placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
              <Lock className="w-4 h-4 text-secondary absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-3 text-secondary hover:text-on-background cursor-pointer"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <hr className="border-outline-variant/50 my-1" />

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-background uppercase tracking-wider">Password Baru</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                className="w-full pl-10 pr-10 py-2.5 border border-outline-variant rounded-xl text-sm bg-background text-on-background placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
              <KeyRound className="w-4 h-4 text-secondary absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-secondary hover:text-on-background cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Real-time Validation Criteria */}
            <div className="mt-2 p-3 bg-surface-container rounded-xl border border-outline-variant/30 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Syarat Password Baru:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-semibold text-secondary">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-outline-variant'}`}></span>
                  <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : ''}>Minimal 8 karakter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasUpperCase ? 'bg-emerald-500' : 'bg-outline-variant'}`}></span>
                  <span className={hasUpperCase ? 'text-emerald-600 dark:text-emerald-400' : ''}>Huruf besar (A-Z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasLowerCase ? 'bg-emerald-500' : 'bg-outline-variant'}`}></span>
                  <span className={hasLowerCase ? 'text-emerald-600 dark:text-emerald-400' : ''}>Huruf kecil (a-z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-outline-variant'}`}></span>
                  <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-400' : ''}>Angka (0-9)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-background uppercase tracking-wider">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan ulang password baru"
                className="w-full pl-10 pr-10 py-2.5 border border-outline-variant rounded-xl text-sm bg-background text-on-background placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
              <KeyRound className="w-4 h-4 text-secondary absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-secondary hover:text-on-background cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-4 border-t border-outline-variant/60 pt-5">
            <button
              type="button"
              onClick={handleBack}
              disabled={changePasswordMutation.isPending}
              className="px-5 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
