import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CustomerProvider } from './context/CustomerContext';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Features } from './pages/Features';
import { Contact } from './pages/Contact';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { DashboardPayments } from './pages/dashboard/DashboardPayments';
import { DashboardSettings } from './pages/dashboard/DashboardSettings';
import { DashboardSupport } from './pages/dashboard/DashboardSupport';

export default function App() {
  return (
    <CustomerProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="features" element={<Features />} />
            <Route path="contact" element={<Contact />} />
            <Route path="signup" element={<SignUp />} />
          </Route>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardOverview />} />
            <Route path="payments" element={<DashboardPayments />} />
            <Route path="settings" element={<DashboardSettings />} />
            <Route path="support" element={<DashboardSupport />} />
          </Route>
        </Routes>
      </Router>
    </CustomerProvider>
  );
}