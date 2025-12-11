
import React, { useState, useEffect, useRef } from 'react';
import { AppUser, ActivityLog } from '../types';
import { fetchLogs } from '../services/dataService';

interface SettingsGroupProps {
  title: string; 
  items: string[]; 
  onAdd: (item: string) => void; 
  onRemove: (item: string) => void; 
  placeholder: string;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, items, onAdd, onRemove, placeholder }) => {
  const [newItem, setNewItem] = useState('');
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">{title}</h3>
      <ul className="mb-3 space-y-1 max-h-40 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <li key={index} className="flex justify-between items-center text-sm bg-gray-50 px-2 py-1 rounded">
            <span>{item}</span>
            <button onClick={() => onRemove(item)} className="text-red-500 hover:text-red-700 font-bold px-1" title="Odebrat">&times;</button>
          </li>
        ))}
        {items.length === 0 && <li className="text-gray-400 text-xs italic">Seznam je prázdný</li>}
      </ul>
      <div className="flex gap-2">
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={placeholder} 
          className="flex-1 border border-gray-300 rounded text-sm p-1.5 focus:ring-fire-500 focus:border-fire-500" />
        <button onClick={() => { if(newItem.trim()) { onAdd(newItem.trim()); setNewItem(''); }}} 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded text-sm font-medium">Přidat</button>
      </div>
    </div>
  );
};

interface SettingsProps {
  managers: string[]; 
  onAddManager: (v: string) => void; 
  onRemoveManager: (v: string) => void;

  locations: string[]; 
  onAddLocation: (v: string) => void; 
  onRemoveLocation: (v: string) => void;

  categories: string[]; 
  onAddCategory: (v: string) => void; 
  onRemoveCategory: (v: string) => void;

  conditions: string[]; 
  onAddCondition: (v: string) => void; 
  onRemoveCondition: (v: string) => void;

  onClose: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  isProcessing: boolean;
  currentUser: AppUser;
}

export const Settings: React.FC<SettingsProps> = ({
  managers, onAddManager, onRemoveManager,
  locations, onAddLocation, onRemoveLocation,
  categories, onAddCategory, onRemoveCategory,
  conditions, onAddCondition, onRemoveCondition,
  onClose, onExportBackup, onImportBackup, isProcessing, currentUser
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoadingLogs(true);
    const data = await fetchLogs();
    setLogs(data);
    setLoadingLogs(false);
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Nastavení aplikace</h2>
        <button onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50">Zavřít</button>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
           <h3 className="font-bold text-blue-900">Správa dat a Zálohování</h3>
           <p className="text-sm text-blue-700">Exportujte celou databázi do JSON souboru pro bezpečné uložení.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={onExportBackup} disabled={isProcessing} className="bg-white border border-blue-200 text-blue-800 px-4 py-2 rounded shadow-sm hover:bg-blue-50 font-medium disabled:opacity-50">
            {isProcessing ? 'Pracuji...' : 'Stáhnout Zálohu'}
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 font-medium disabled:opacity-50">
            {isProcessing ? 'Pracuji...' : 'Obnovit ze Zálohy'}
            </button>
        </div>
        <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onImportBackup(e.target.files[0]); if(fileInputRef.current) fileInputRef.current.value=''; }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SettingsGroup title="Seznam Správců" items={managers} onAdd={onAddManager} onRemove={onRemoveManager} placeholder="Jméno a Příjmení..." />
        <SettingsGroup title="Seznam Umístění" items={locations} onAdd={onAddLocation} onRemove={onRemoveLocation} placeholder="Např. Sklad, Garáž..." />
        <SettingsGroup title="Kategorie Majetku" items={categories} onAdd={onAddCategory} onRemove={onRemoveCategory} placeholder="Např. Vysílačky..." />
        <SettingsGroup title="Stavy Majetku" items={conditions} onAdd={onAddCondition} onRemove={onRemoveCondition} placeholder="Např. V servisu..." />
      </div>

      {/* Audit Log Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
           <h3 className="font-bold text-gray-900">Historie aktivit (Posledních 100)</h3>
           <button onClick={loadLogs} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Aktualizovat</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
           {loadingLogs ? (
             <div className="p-8 text-center text-gray-500">Načítám logy...</div>
           ) : (
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-500 font-medium text-xs border-b border-gray-200">
                 <tr>
                   <th className="px-6 py-3">Datum</th>
                   <th className="px-6 py-3">Uživatel</th>
                   <th className="px-6 py-3">Akce</th>
                   <th className="px-6 py-3">Detaily</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {logs.map((log) => (
                   <tr key={log.id} className="hover:bg-gray-50">
                     <td className="px-6 py-2 whitespace-nowrap text-gray-600">
                       {new Date(log.createdAt).toLocaleString('cs-CZ')}
                     </td>
                     <td className="px-6 py-2 font-medium text-gray-900">{log.username}</td>
                     <td className="px-6 py-2">
                       <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                         log.action === 'LOGIN' ? 'bg-green-100 text-green-800' :
                         log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                         log.action.includes('CREATE') ? 'bg-blue-100 text-blue-800' :
                         'bg-gray-100 text-gray-800'
                       }`}>
                         {log.action}
                       </span>
                     </td>
                     <td className="px-6 py-2 text-gray-600 truncate max-w-xs" title={log.details}>
                       {log.details}
                     </td>
                   </tr>
                 ))}
                 {logs.length === 0 && (
                   <tr><td colSpan={4} className="p-6 text-center text-gray-400">Žádné záznamy</td></tr>
                 )}
               </tbody>
             </table>
           )}
        </div>
      </div>
    </div>
  );
};
