import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  TicketCheck,
  Users,
  FileText,
  FileSpreadsheet,
  Settings,
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  Coins,
  Shield
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Support', href: '/support', icon: TicketCheck },
  { name: 'Billing', href: '/billing', icon: FileText },
  { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
];

const masterNavigation = [
  { name: 'Members', href: '/master/members', icon: Users },
  { name: 'Projects', href: '/master/projects', icon: FolderKanban },
  { name: 'Roles', href: '/master/roles', icon: Shield },
  { name: 'Role Rates', href: '/master/role-rates', icon: Coins },
];

export function Sidebar() {
  const location = useLocation();
  const isMasterRouteActive = location.pathname.startsWith('/master');
  const [isMasterOpen, setIsMasterOpen] = useState(isMasterRouteActive);

  // Sync open state when path changes to a master route
  useEffect(() => {
    if (isMasterRouteActive) {
      setIsMasterOpen(true);
    }
  }, [isMasterRouteActive]);

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-container border-r border-outline-variant py-6 px-4 gap-2 z-40 transition-all duration-200 ease-in-out select-none">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
          <Building2 className="text-on-primary w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-primary leading-tight">HCM PM</h2>
          <p className="text-xs text-secondary uppercase tracking-wider font-semibold">Enterprise Suite</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex flex-col gap-1 w-full flex-1 overflow-y-auto pr-1">
        {/* Dashboard link */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out",
              isActive
                ? "bg-primary-container text-on-primary-container"
                : "text-secondary hover:bg-surface-container-high"
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        {/* Collapsible Master Data Menu */}
        <div>
          <button
            type="button"
            onClick={() => setIsMasterOpen(!isMasterOpen)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out cursor-pointer text-secondary hover:bg-surface-container-high",
              isMasterRouteActive && "text-primary font-bold bg-primary-container/10"
            )}
          >
            <div className="flex items-center gap-3">
              <Database className={cn("w-5 h-5", isMasterRouteActive ? "text-primary" : "text-secondary")} />
              <span>Master Data</span>
            </div>
            {isMasterOpen ? (
              <ChevronDown className="w-4 h-4 text-secondary shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
            )}
          </button>

          {/* Sub Navigation Items */}
          <div
            className={cn(
              "flex flex-col gap-0.5 mt-1 overflow-hidden transition-all duration-300 ease-in-out pl-2 border-l border-outline-variant/50 ml-5",
              isMasterOpen ? "max-h-60 opacity-100 py-1" : "max-h-0 opacity-0 pointer-events-none"
            )}
          >
            {masterNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out",
                    isActive
                      ? "bg-primary text-on-primary font-bold shadow-sm"
                      : "text-secondary hover:bg-surface-container-high"
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-outline-variant/30 my-2" />

        {/* Other Main Links */}
        {mainNavigation.slice(1).map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out",
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-secondary hover:bg-surface-container-high"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Settings Bottom (Left fallback/future options) */}
      <div className="mt-auto pt-4 border-t border-outline-variant">
        <NavLink
          to="/master/role-rates"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out",
              isActive
                ? "bg-primary-container text-on-primary-container"
                : "text-secondary hover:bg-surface-container-high"
            )
          }
        >
          <Settings className="w-5 h-5" />
          <span>Configuration</span>
        </NavLink>
      </div>
    </nav>
  );
}
