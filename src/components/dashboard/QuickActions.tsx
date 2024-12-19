import React from 'react';
import { Plus, Send, CreditCard, PiggyBank } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <QuickActionButton
        icon={<Plus className="w-5 h-5" />}
        label="Add Account"
        onClick={() => {}}
      />
      <QuickActionButton
        icon={<Send className="w-5 h-5" />}
        label="Transfer"
        onClick={() => {}}
      />
      <QuickActionButton
        icon={<CreditCard className="w-5 h-5" />}
        label="Pay Bills"
        onClick={() => {}}
      />
      <QuickActionButton
        icon={<PiggyBank className="w-5 h-5" />}
        label="Set Goal"
        onClick={() => {}}
      />
    </div>
  );
}

function QuickActionButton({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-500 transition-colors"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}