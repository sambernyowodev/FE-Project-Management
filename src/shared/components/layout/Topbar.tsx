import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, User, LogOut, Building2 } from 'lucide-react';
import { useProfile, useLogout } from '@/modules/auth/hooks/useAuth';

interface TopbarProps {
  onToggleMobileMenu?: () => void;
}

export function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const { data: profileRes } = useProfile();
  const profile = profileRes?.data;
  const { logout } = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="md:hidden flex justify-between items-center h-16 px-4 w-full sticky top-0 z-30 bg-surface-container border-b border-outline-variant select-none">
      {/* Hamburger Menu & Brand */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Buka Menu"
          className="p-2 -ml-1.5 text-secondary hover:text-primary hover:bg-surface-container-high rounded-xl transition-all cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
            <Building2 className="text-on-primary w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black text-primary leading-tight">MII PM</span>
            <span className="text-[9px] text-secondary font-semibold uppercase tracking-wider leading-none">Enterprise</span>
          </div>
        </div>
      </div>

      {/* User Profile Avatar / Dropdown */}
      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        {profile && (
          <div>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center overflow-hidden cursor-pointer select-none transition-transform active:scale-95"
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {getInitials(profile.fullName)}
                </span>
              )}
            </div>

            {/* Mobile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User info header in dropdown */}
                <div className="px-3 py-2 border-b border-outline-variant/30 flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-bold text-on-background truncate leading-tight">
                    {profile.fullName}
                  </span>
                  <span className="text-[10px] text-secondary truncate">
                    {profile.email}
                  </span>
                </div>

                <NavLink
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-secondary hover:bg-surface-container-high hover:text-on-background transition-colors mt-1"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>Profil Saya</span>
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-error hover:bg-error/10 hover:text-error transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
