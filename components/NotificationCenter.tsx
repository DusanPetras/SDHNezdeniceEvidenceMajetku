
import React from 'react';
import { Notification } from '../types';
import { IconAlert, IconCalendar, IconX } from './Icons';

interface NotificationCenterProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
      <div className="bg-fire-700 text-white p-3 flex justify-between items-center">
        <h3 className="font-bold text-sm">Centrum upozornění ({notifications.length})</h3>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <IconX className="w-4 h-4" />
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Žádná nová upozornění.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif, idx) => (
              <div 
                key={idx} 
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${notif.type === 'DANGER' ? 'bg-red-50 hover:bg-red-100' : ''}`}
                onClick={() => {
                  onSelect(notif.assetId);
                  onClose();
                }}
              >
                <div className={`mt-1 ${notif.type === 'DANGER' ? 'text-red-600' : 'text-orange-500'}`}>
                  <IconAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900">{notif.assetName}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {notif.type === 'DANGER' 
                      ? `Prošlá revize před ${Math.abs(notif.daysRemaining)} dny` 
                      : `Blíží se revize za ${notif.daysRemaining} dní`}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <IconCalendar className="w-3 h-3 mr-1" />
                    {new Date(notif.date).toLocaleDateString('cs-CZ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
