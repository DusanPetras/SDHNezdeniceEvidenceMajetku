import React, { useState, useEffect, useRef } from 'react';
import { Asset } from '../types';
import { generateAssetDescription } from '../services/geminiService';
import { processImageFile } from '../services/imageUtils';
import { IconSparkles, IconUpload } from './Icons';

interface AssetFormProps {
  initialData?: Asset;
  onSave: (asset: Omit<Asset, 'id'>) => void;
  onCancel: () => void;
  availableManagers: string[];
  availableLocations: string[];
  availableCategories: string[];
  availableConditions: string[];
}

const AssetForm: React.FC<AssetFormProps> = ({ 
  initialData, onSave, onCancel, availableManagers, availableLocations, availableCategories, availableConditions
}) => {
  const [formData, setFormData] = useState<Omit<Asset, 'id'>>({
    name: '', category: availableCategories[0] || '', location: availableLocations[0] || '', condition: availableConditions[0] || '',
    purchaseDate: new Date().toISOString().split('T')[0], price: 0, manager: availableManagers[0] || '',
    description: '', imageUrl: '', inventoryNumber: '', nextServiceDate: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) { const { id, ...rest } = initialData; setFormData(rest); }
  }, [initialData]);

  const handleAiGenerate = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    const desc = await generateAssetDescription(formData.name, formData.category);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const processFile = async (file: File) => {
    try {
      const b64 = await processImageFile(file);
      setFormData(prev => ({ ...prev, imageUrl: b64 }));
    } catch { alert("Chyba obrázku"); }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 mt-6">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
           {initialData ? 'Editace majetku' : 'Nová položka majetku'}
        </h2>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-6">
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Název položky</label>
              <input required type="text" className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border" 
                value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evidenční číslo</label>
              <input required type="text" className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border" 
                value={formData.inventoryNumber} onChange={e=>setFormData({...formData, inventoryNumber: e.target.value})} />
           </div>
        </div>

        {/* Categories & State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border bg-white" 
                value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>
                 {availableCategories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umístění</label>
              <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border bg-white" 
                value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})}>
                 {availableLocations.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stav</label>
              <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border bg-white" 
                value={formData.condition} onChange={e=>setFormData({...formData, condition: e.target.value})}>
                 {availableConditions.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
           </div>
        </div>

        {/* Manager & Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Správce</label>
              <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border bg-white" 
                value={formData.manager} onChange={e=>setFormData({...formData, manager: e.target.value})}>
                 {availableManagers.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum pořízení</label>
              <input type="date" className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border" 
                value={formData.purchaseDate} onChange={e=>setFormData({...formData, purchaseDate: e.target.value})} />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cena (Kč)</label>
              <input type="number" className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border" 
                value={formData.price} onChange={e=>setFormData({...formData, price: Number(e.target.value)})} />
           </div>
        </div>

        {/* Maintenance */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-bold text-orange-900 mb-1">Datum příští revize/údržby</label>
              <input type="date" className="w-full rounded-md border-orange-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border" 
                value={formData.nextServiceDate||''} onChange={e=>setFormData({...formData, nextServiceDate: e.target.value})} />
           </div>
           <div>
              <label className="block text-sm font-bold text-orange-900 mb-1">Poznámka k údržbě</label>
              <input type="text" className="w-full rounded-md border-orange-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border" 
                placeholder="Např. Výměna oleje..."
                value={formData.maintenanceNotes||''} onChange={e=>setFormData({...formData, maintenanceNotes: e.target.value})} />
           </div>
        </div>

        {/* Description & Image */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-2">
             <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Technický popis</label>
                <button type="button" onClick={handleAiGenerate} disabled={isGenerating} className="text-fire-600 hover:text-fire-800 text-xs font-bold flex items-center gap-1">
                  <IconSparkles className="w-3 h-3"/> {isGenerating?'Generuji...':'Vygenerovat AI'}
                </button>
             </div>
             <textarea rows={5} className="w-full rounded-md border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border" 
               value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
           </div>

           <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fotografie</label>
              <div 
                className={`border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer transition-colors ${formData.imageUrl ? 'border-fire-300 bg-fire-50' : 'border-gray-300 hover:border-fire-400 bg-gray-50'}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if(e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
              >
                 <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={e => {if(e.target.files?.[0]) processFile(e.target.files[0])}} />
                 
                 {formData.imageUrl ? (
                    <div className="relative w-full h-full p-1 group">
                       <img src={formData.imageUrl} className="w-full h-full object-contain rounded" />
                       <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded">
                          <span className="text-white text-xs font-bold">Změnit</span>
                       </div>
                       <button type="button" onClick={(e)=>{e.stopPropagation();setFormData({...formData, imageUrl:''})}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md font-bold">&times;</button>
                    </div>
                 ) : (
                    <div className="text-center p-2">
                       <IconUpload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                       <span className="text-xs text-gray-500">Klikni nebo přetáhni</span>
                    </div>
                 )}
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
           <button type="button" onClick={onCancel} className="px-5 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 bg-white">
             Zrušit
           </button>
           <button type="submit" className="px-5 py-2 bg-fire-700 hover:bg-fire-800 text-white rounded-md shadow-sm font-bold">
             Uložit záznam
           </button>
        </div>
      </form>
    </div>
  );
};

export default AssetForm;