import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useProfile, useLogout } from '@/modules/auth/hooks/useAuth';

export function Layout() {
  const token = localStorage.getItem('token');
  const { isLoading, isError } = useProfile();
  const { logout } = useLogout();

  useEffect(() => {
    if (!token || isError) {
      logout();
    }
  }, [token, isError, logout]);

  if (!token || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 relative min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

