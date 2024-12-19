import React from 'react';
import { Card } from '../../components/dashboard/ui/Card';

export function DashboardSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Notifications
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All notifications</option>
                  <option>Important only</option>
                  <option>None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Two-Factor Authentication
                </label>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">Connected Accounts</h3>
            <div className="space-y-4">
              <button className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                + Connect Bank Account
              </button>
              <button className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                + Connect Crypto Wallet
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}