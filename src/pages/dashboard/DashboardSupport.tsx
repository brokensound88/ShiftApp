import React from 'react';
import { Card } from '../../components/dashboard/ui/Card';
import { MessageSquare, Phone, Mail } from 'lucide-react';

export function DashboardSupport() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Support</h1>
      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-4 text-blue-600" />
          <h3 className="font-medium mb-2">Live Chat</h3>
          <p className="text-sm text-gray-600 mb-4">Get instant help from our team</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg w-full">
            Start Chat
          </button>
        </Card>
        
        <Card className="p-6 text-center">
          <Phone className="w-8 h-8 mx-auto mb-4 text-blue-600" />
          <h3 className="font-medium mb-2">Phone Support</h3>
          <p className="text-sm text-gray-600 mb-4">Call us 24/7</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg w-full">
            Call Now
          </button>
        </Card>
        
        <Card className="p-6 text-center">
          <Mail className="w-8 h-8 mx-auto mb-4 text-blue-600" />
          <h3 className="font-medium mb-2">Email Support</h3>
          <p className="text-sm text-gray-600 mb-4">Get help via email</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg w-full">
            Send Email
          </button>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="font-medium mb-4">FAQs</h3>
        <div className="space-y-4">
          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer p-4 hover:bg-gray-50 rounded-lg">
              <span>How do I connect my bank account?</span>
              <span className="transition group-open:rotate-180">▼</span>
            </summary>
            <p className="p-4 text-gray-600">
              You can connect your bank account through the Settings page. We support most major banks and use secure protocols for connection.
            </p>
          </details>
          
          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer p-4 hover:bg-gray-50 rounded-lg">
              <span>What are the transaction fees?</span>
              <span className="transition group-open:rotate-180">▼</span>
            </summary>
            <p className="p-4 text-gray-600">
              Our fees are among the lowest in the industry, starting at just 0.1% per transaction with no hidden charges.
            </p>
          </details>
        </div>
      </Card>
    </div>
  );
}