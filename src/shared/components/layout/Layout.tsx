import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useProfile, useLogout } from '@/modules/auth/hooks/useAuth';

export function Layout() {
  const token = localStorage.getItem('token');
  const { isLoading, isError } = useProfile();
  const { logout } = useLogout();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!token || isError) {
      logout();
    }
  }, [token, isError, logout]);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!token || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col md:ml-64 relative min-w-0 w-full">
        <Topbar onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 min-w-0">
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
