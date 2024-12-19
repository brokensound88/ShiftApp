import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, LayoutDashboard } from 'lucide-react';
import { AnimatedGradientText } from '../shared/AnimatedGradientText';

export function Navigation() {
  return (
    <nav className="fixed w-full bg-cream-50/80 backdrop-blur-md z-50 border-b border-cream-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            <AnimatedGradientText>
              Shift
            </AnimatedGradientText>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/about">About</NavLink>
            <NavLink to="/features">Features</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard"
              className="px-6 py-2 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link 
              to="/signup"
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link 
      to={to}
      className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
    >
      {children}
    </Link>
  );
}