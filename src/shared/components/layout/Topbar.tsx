import { Menu, Bell, User } from 'lucide-react';

export function Topbar() {
  return (
    <header className="md:hidden flex justify-between items-center h-16 px-4 w-full sticky top-0 z-50 bg-surface-container-lowest border-b border-outline-variant">
      <div className="flex items-center gap-2">
        <Menu className="text-primary w-6 h-6 cursor-pointer" />
        <span className="text-2xl font-bold text-primary">HCM Pro</span>
      </div>
      <div className="flex items-center gap-4">
        <Bell className="text-on-surface-variant cursor-pointer w-6 h-6" />
        <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center overflow-hidden cursor-pointer">
          <User className="text-secondary w-5 h-5" />
        </div>
      </div>
    </header>
  );
}
