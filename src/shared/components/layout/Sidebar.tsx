import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CalendarDays, 
  TicketCheck, 
  FileText, 
  FileSpreadsheet, 
  Settings,
  Building2
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Timeline', href: '/timeline', icon: CalendarDays },
  { name: 'Support', href: '/support', icon: TicketCheck },
  { name: 'Billing', href: '/billing', icon: FileText },
  { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-container border-r border-outline-variant py-6 px-4 gap-2 z-40 transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
          <Building2 className="text-on-primary w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-primary leading-tight">HCM PM</h2>
          <p className="text-xs text-secondary uppercase tracking-wider font-semibold">Enterprise Suite</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full flex-1">
        {navigation.map((item) => (
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

      <div className="mt-auto pt-4 border-t border-outline-variant">
        {bottomNavigation.map((item) => (
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
    </nav>
  );
}
