
import React, { useState } from 'react';
import { Asset, UserRole } from '../types';
import { IconArrowLeft, IconPrinter, IconSparkles, IconEdit, IconTrash, IconImage, IconAlert, IconCalendar } from './Icons';
import { generateMaintenanceAdvice } from '../services/geminiService';

interface AssetCardProps {
  asset: Asset;
  onBack: () => void;
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
  userRole: UserRole;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onBack, onDelete, onEdit, userRole }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const loadAdvice = async () => {
    setLoadingAdvice(true);
    const result = await generateMaintenanceAdvice(asset);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  // Check for alerts
  const checkAlert = (): { type: 'WARNING' | 'DANGER' | null, text: string } => {
    if (!asset.nextServiceDate) return { type: null, text: '' };
    
    const today = new Date();
    const serviceDate = new Date(asset.nextServiceDate);
    const diffTime = serviceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { type: 'DANGER', text: `Termín revize/údržby propadl před ${Math.abs(diffDays)} dny!` };
    if (diffDays <= 30) return { type: 'WARNING', text: `Blíží se termín revize/údržby za ${diffDays} dní.` };
    return { type: null, text: '' };
  };

  const alertStatus = checkAlert();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar - Hidden on Print */}
      <div className="flex justify-between items-center mb-6 no-print">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-fire-700 transition-colors"
        >
          <IconArrowLeft className="w-5 h-5 mr-2" /> Zpět na seznam
        </button>
        <div className="space-x-2">
           {userRole === 'ADMIN' && (
             <>
               <button 
                onClick={() => onEdit(asset)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium inline-flex items-center"
              >
                 <IconEdit className="w-4 h-4 mr-2" />
                 Upravit
              </button>
               <button 
                onClick={() => {
                    if(window.confirm('Opravdu odstranit tuto položku?')) onDelete(asset.id);
                }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium inline-flex items-center"
              >
                 <IconTrash className="w-4 h-4 mr-2" />
                Smazat
              </button>
             </>
           )}
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm font-medium flex items-center inline-flex"
          >
            <IconPrinter className="w-4 h-4 mr-2" /> Tisk Karty
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertStatus.type && (
          <div className={`mb-4 p-4 rounded-lg border flex items-center gap-3 shadow-sm no-print
            ${alertStatus.type === 'DANGER' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}
          >
              <IconAlert className="w-6 h-6 flex-shrink-0" />
              <span className="font-bold">{alertStatus.text}</span>
          </div>
      )}

      {/* Card Content */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 card-print">
        
        {/* Print Header */}
        <div className="bg-fire-700 text-white p-6 flex justify-between items-center">
          <div>
             <h1 className="text-3xl font-bold text-white">{asset.name}</h1>
             <p className="text-white opacity-90 mt-1">{asset.inventoryNumber}</p>
          </div>
          <div className="text-right">
             <div className="text-xs uppercase tracking-wider text-white opacity-80">SDH Nezdenice</div>
             <div className="text-lg font-semibold text-white">{asset.category}</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/3 p-6 bg-gray-50 border-r border-gray-100 flex flex-col items-center justify-center">
             {asset.imageUrl ? (
               <div className="w-full h-64 flex items-center justify-center bg-white rounded border border-gray-200 p-2">
                 <img 
                  src={asset.imageUrl} 
                  alt={asset.name} 
                  className="max-w-full max-h-full object-contain"
                />
               </div>
             ) : (
               <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                 <div className="text-center">
                   <IconImage className="w-12 h-12 mx-auto mb-2" />
                   <span className="text-sm">Bez fotografie</span>
                 </div>
               </div>
             )}
             <div className="mt-4 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white
                  ${asset.condition === 'Nové' ? 'bg-green-600' : 
                    asset.condition === 'Dobrý' ? 'bg-blue-600' : 
                    asset.condition === 'Opotřebované' ? 'bg-orange-500' : 
                    asset.condition === 'Poškozené' ? 'bg-red-600' : 'bg-gray-600'}`}
                >
                  Stav: {asset.condition}
                </span>
             </div>
          </div>

          {/* Details Section */}
          <div className="md:w-2/3 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Základní informace</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6">
              <div>
                <span className="block text-xs text-gray-500 uppercase">Umístění</span>
                <span className="font-medium text-gray-900">{asset.location}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase">Správce</span>
                <span className="font-medium text-gray-900">{asset.manager}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase">Datum pořízení</span>
                <span className="font-medium text-gray-900">{new Date(asset.purchaseDate).toLocaleDateString('cs-CZ')}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase">Pořizovací cena</span>
                <span className="font-medium text-gray-900">{asset.price.toLocaleString('cs-CZ')} Kč</span>
              </div>
            </div>

            {asset.nextServiceDate && (
                 <div className="mb-6 bg-blue-50 p-3 rounded border border-blue-100 flex items-start gap-3">
                    <IconCalendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <span className="block text-xs text-blue-600 uppercase font-bold mb-1">Plánovaná revize / Údržba</span>
                        <div className="font-medium text-gray-900">
                            {new Date(asset.nextServiceDate).toLocaleDateString('cs-CZ')}
                        </div>
                        {asset.maintenanceNotes && (
                            <p className="text-sm text-gray-600 mt-1">{asset.maintenanceNotes}</p>
                        )}
                    </div>
                 </div>
            )}

            <div className="mb-6">
              <span className="block text-xs text-gray-500 uppercase mb-1">Popis</span>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded">{asset.description}</p>
            </div>

            {/* AI Maintenance Section */}
            <div className="mt-8 pt-6 border-t border-gray-100 no-print">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-gray-800 flex items-center">
                   <IconSparkles className="w-5 h-5 text-purple-600 mr-2" />
                   AI Asistent Údržby
                 </h3>
                 {!advice && (
                   <button 
                    onClick={loadAdvice}
                    disabled={loadingAdvice}
                    className="text-sm text-purple-600 hover:text-purple-800 underline disabled:opacity-50"
                   >
                     {loadingAdvice ? 'Generuji...' : 'Načíst doporučení'}
                   </button>
                 )}
               </div>
               
               {advice && (
                 <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: advice }} />
                 </div>
               )}
            </div>
            
            {/* Print Only Signature Area */}
            <div className="print-only mt-12 pt-12 border-t-2 border-gray-300">
              <div className="flex justify-between">
                <div className="text-center w-1/3">
                  <div className="h-16 border-b border-gray-400 mb-2"></div>
                  <p className="text-sm">Podpis správce</p>
                </div>
                <div className="text-center w-1/3">
                  <div className="h-16 border-b border-gray-400 mb-2"></div>
                  <p className="text-sm">Datum kontroly</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
