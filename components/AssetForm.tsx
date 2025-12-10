
import React, { useState, useEffect, useRef } from 'react';
import { Asset } from '../types';
import { IconSparkles, IconUpload, IconImage, IconTrash, IconLink } from './Icons';
import { generateAssetDescription } from '../services/geminiService';
import { processImageFile } from '../services/imageUtils';

interface AssetFormProps {
  initialData?: Asset;
  onSave: (asset: Omit<Asset, 'id'>) => void;
  onCancel: () => void;
  availableManagers: string[];
  availableLocations: string[];
  availableCategories: string[];
  availableConditions: string[];
}

export const AssetForm: React.FC<AssetFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel,
  availableManagers,
  availableLocations,
  availableCategories,
  availableConditions
}) => {
  const [formData, setFormData] = useState<Omit<Asset, 'id'>>({
    name: '',
    category: availableCategories[0] || '',
    location: availableLocations[0] || '',
    condition: availableConditions[0] || '',
    purchaseDate: new Date().toISOString().split('T')[0],
    price: 0,
    manager: availableManagers[0] || '',
    description: '',
    imageUrl: '',
    inventoryNumber: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
      // If initial data has a very long URL (likely Base64) or standard URL, just display it.
    }
  }, [initialData]);

  const handleAiGenerate = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    const desc = await generateAssetDescription(formData.name, formData.category);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedImage = await processImageFile(file);
        setFormData(prev => ({ ...prev, imageUrl: resizedImage }));
      } catch (error) {
        console.error("Chyba při zpracování obrázku:", error);
        alert("Nepodařilo se zpracovat obrázek.");
      }
    }
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        {initialData ? 'Upravit majetek' : 'Přidat nový majetek'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name & Inventory Num */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Název majetku</label>
            <input 
              required
              type="text" 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Např. Vysílačka Motorola..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Evidenční číslo</label>
            <input 
              required
              type="text" 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.inventoryNumber}
              onChange={(e) => setFormData({...formData, inventoryNumber: e.target.value})}
              placeholder="SDH-XXX"
            />
          </div>
        </div>

        {/* Category, Location, Manager */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
            <label className="block text-sm font-medium text-gray-700">Kategorie</label>
            <select 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Umístění</label>
            <select 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            >
              {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Správce</label>
            <select 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.manager}
              onChange={(e) => setFormData({...formData, manager: e.target.value})}
            >
              {availableManagers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Details: Date, Price, Condition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
            <label className="block text-sm font-medium text-gray-700">Datum pořízení</label>
            <input 
              type="date" 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cena (Kč)</label>
            <input 
              type="number" 
              min="0"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stav</label>
            <select 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
            >
              {availableConditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fotografie</label>
          <div className="flex gap-4 items-start">
            
            {/* Image Preview / Upload Area */}
            <div className="flex-1">
              {formData.imageUrl ? (
                <div className="relative group w-full h-64 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      type="button" 
                      onClick={clearImage}
                      className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      title="Odstranit obrázek"
                    >
                      <IconTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconImage className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Klikněte pro nahrání fotografie</span>
                  <span className="text-xs text-gray-400 mt-1">(Automaticky zmenšeno pro uložení)</span>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* URL Toggle Option */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setUseUrlInput(!useUrlInput)}
                className="text-xs text-blue-600 hover:underline flex items-center whitespace-nowrap"
              >
                <IconLink className="w-3 h-3 mr-1" />
                {useUrlInput ? 'Skrýt zadání URL' : 'Vložit URL ručně'}
              </button>
            </div>
          </div>
          
          {useUrlInput && (
            <input 
              type="text" 
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fire-500 focus:outline-none focus:ring-fire-500"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://..."
            />
          )}
        </div>

        {/* Description + AI */}
        <div>
          <div className="flex justify-between items-center mb-1">
             <label className="block text-sm font-medium text-gray-700">Popis</label>
             <button
               type="button"
               onClick={handleAiGenerate}
               disabled={isGenerating || !formData.name}
               className={`text-xs flex items-center gap-1 px-2 py-1 rounded border ${isGenerating ? 'bg-gray-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
             >
               <IconSparkles className="w-3 h-3" />
               {isGenerating ? 'Generuji...' : 'Vygenerovat pomocí Gemini'}
             </button>
          </div>
          <textarea 
            rows={3}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Detailní popis majetku..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button 
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Zrušit
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-fire-600 rounded-md hover:bg-fire-700 focus:ring-2 focus:ring-offset-2 focus:ring-fire-500"
          >
            {initialData ? 'Uložit změny' : 'Vytvořit Majetek'}
          </button>
        </div>
      </form>
    </div>
  );
};
