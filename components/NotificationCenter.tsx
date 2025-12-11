import React from 'react';
import { Notification } from '../types';
import { IconBell, IconAlert } from './Icons';

interface NotificationCenterProps {
  notifications: Notification[]; isOpen: boolean; onClose: () => void; onSelect: (assetId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-fire-700 text-white p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
             <IconBell className="w-5 h-5" />
             <h3 className="font-bold text-lg">Centrum upozornění</h3>
             <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">{notifications.length}</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 bg-gray-50 flex-1">
           {notifications.length === 0 ? (
             <div className="text-center py-10 text-gray-500">
               <p className="font-medium">Vše v pořádku</p>
               <p className="text-sm">Žádná aktivní upozornění.</p>
             </div>
           ) : (
             <div className="space-y-3">
                {notifications.map((n, idx) => (
                  <div key={idx} onClick={()=>{onSelect(n.assetId);onClose();}} 
                    className={`p-4 rounded-lg border-l-4 shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow flex items-start gap-3 ${
                      n.type === 'DANGER' ? 'border-red-500' : 'border-orange-400'
                    }`}>
                     <div className={`mt-1 flex-shrink-0 ${n.type==='DANGER'?'text-red-500':'text-orange-500'}`}>
                        <IconAlert className="w-5 h-5"/>
                     </div>
                     <div>
                       <div className="font-bold text-gray-900">{n.assetName}</div>
                       <div className={`text-sm font-medium ${n.type==='DANGER'?'text-red-600':'text-orange-600'}`}>
                          {n.type==='DANGER' ? `PROŠLO před ${Math.abs(n.daysRemaining)} dny` : `Vyprší za ${n.daysRemaining} dní`}
                       </div>
                       <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <span>Termín: {new Date(n.date).toLocaleDateString('cs-CZ')}</span>
                       </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-100 p-3 text-right border-t border-gray-200">
           <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 shadow-sm">
             Zavřít
           </button>
        </div>
      </div>
    </div>
  );
};