
import React, { useState, useRef } from 'react';
import { IconTrash, IconPlus, IconX, IconDownload, IconUpload } from './Icons';

interface SettingsGroupProps {
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder: string;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, items, onAdd, onRemove, placeholder }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col h-full">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      
      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-48 mb-4 border rounded-md bg-gray-50 p-2 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm group">
            <span className="text-gray-700 text-sm font-medium">{item}</span>
            <button 
              onClick={() => onRemove(item)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
              title="Odstranit"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
        />
        <button 
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-3 py-2 bg-fire-600 text-white rounded-md hover:bg-fire-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

interface SettingsProps {
  managers: string[];
  setManagers: (val: string[]) => void;
  locations: string[];
  setLocations: (val: string[]) => void;
  categories: string[];
  setCategories: (val: string[]) => void;
  conditions: string[];
  setConditions: (val: string[]) => void;
  onClose: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  managers, setManagers,
  locations, setLocations,
  categories, setCategories,
  conditions, setConditions,
  onClose,
  onExportBackup,
  onImportBackup
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (!list.includes(item)) {
      setList([...list, item]);
    }
  };

  const removeItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.filter(i => i !== item));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportBackup(e.target.files[0]);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Nastavení konfigurace</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
           <IconX className="w-5 h-5" /> Zavřít nastavení
        </button>
      </div>

      {/* Data Management Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-blue-800 mb-2">Správa dat (Zálohování)</h3>
        <p className="text-sm text-blue-600 mb-4">
          Data se automaticky ukládají do prohlížeče. Zde si můžete stáhnout kompletní zálohu do souboru pro přenos na jiný počítač.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onExportBackup}
            className="flex items-center px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 font-medium text-sm transition-colors"
          >
            <IconDownload className="w-4 h-4 mr-2" /> Stáhnout kompletní zálohu (.json)
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white border border-transparent rounded-md hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            <IconUpload className="w-4 h-4 mr-2" /> Nahrát zálohu ze souboru
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <SettingsGroup 
          title="Správci" 
          items={managers} 
          onAdd={(val) => addItem(managers, setManagers, val)}
          onRemove={(val) => removeItem(managers, setManagers, val)}
          placeholder="Jméno správce..."
        />
        <SettingsGroup 
          title="Umístění majetku" 
          items={locations} 
          onAdd={(val) => addItem(locations, setLocations, val)}
          onRemove={(val) => removeItem(locations, setLocations, val)}
          placeholder="Nové umístění..."
        />
        <SettingsGroup 
          title="Kategorie" 
          items={categories} 
          onAdd={(val) => addItem(categories, setCategories, val)}
          onRemove={(val) => removeItem(categories, setCategories, val)}
          placeholder="Nová kategorie..."
        />
        <SettingsGroup 
          title="Stavy majetku" 
          items={conditions} 
          onAdd={(val) => addItem(conditions, setConditions, val)}
          onRemove={(val) => removeItem(conditions, setConditions, val)}
          placeholder="Nový stav..."
        />
      </div>
    </div>
  );
};
