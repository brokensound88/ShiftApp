import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function CompanyLayout() {
  const location = useLocation();
  
  return (
    <div className="pt-24">
      <nav className="bg-cream-100 border-b border-cream-200">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8 overflow-x-auto">
            <NavLink to="/company" active={location.pathname === '/company'}>About</NavLink>
            <NavLink to="/company/team" active={location.pathname === '/company/team'}>Team</NavLink>
            <NavLink to="/company/careers" active={location.pathname === '/company/careers'}>Careers</NavLink>
            <NavLink to="/company/press" active={location.pathname === '/company/press'}>Press</NavLink>
            <NavLink to="/company/contact" active={location.pathname === '/company/contact'}>Contact</NavLink>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`py-4 px-2 border-b-2 font-medium ${
        active 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  );
}