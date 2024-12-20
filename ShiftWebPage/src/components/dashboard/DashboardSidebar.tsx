import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Settings, HelpCircle } from 'lucide-react';

export function DashboardSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-100">
      <div className="p-6">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          Shift
        </Link>
      </div>
      
      <nav className="mt-6">
        <SidebarLink 
          to="/dashboard" 
          icon={<Home className="w-5 h-5" />}
          active={location.pathname === '/dashboard'}
        >
          Overview
        </SidebarLink>
        <SidebarLink 
          to="/dashboard/payments" 
          icon={<CreditCard className="w-5 h-5" />}
          active={location.pathname === '/dashboard/payments'}
        >
          Payments
        </SidebarLink>
        <SidebarLink 
          to="/dashboard/settings" 
          icon={<Settings className="w-5 h-5" />}
          active={location.pathname === '/dashboard/settings'}
        >
          Settings
        </SidebarLink>
        <SidebarLink 
          to="/dashboard/support" 
          icon={<HelpCircle className="w-5 h-5" />}
          active={location.pathname === '/dashboard/support'}
        >
          Support
        </SidebarLink>
      </nav>
    </aside>
  );
}

function SidebarLink({ to, icon, children, active }: { 
  to: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${
        active ? 'bg-blue-50 text-blue-600' : ''
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}