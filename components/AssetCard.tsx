
import React, { useState } from 'react';
import { Asset, UserRole } from '../types';
import { IconArrowLeft, IconEdit, IconTrash, IconPrinter, IconAlert, IconCalendar } from './Icons';

interface AssetCardProps {
  asset: Asset;
  onBack: () => void;
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
  onPrint: () => void;
  userRole: UserRole;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onBack, onDelete, onEdit, onPrint, userRole }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const checkAlert = (): { text: string } | null => {
    if (!asset.nextServiceDate) return null;
    const today = new Date();
    const serviceDate = new Date(asset.nextServiceDate);
    const diffDays = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Termín propadl před ${Math.abs(diffDays)} dny` };
    if (diffDays <= 30) return { text: `Vyprší za ${diffDays} dní` };
    return null;
  };
  const alertStatus = checkAlert();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto border border-gray-200 print:shadow-none print:border-none print:max-w-none print:break-inside-avoid">
      {/* Navigation - Hidden on Print */}
      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-200 print:hidden">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors">
          <IconArrowLeft className="w-5 h-5 mr-1" /> Zpět na seznam
        </button>
        <div className="flex gap-3">
           {userRole === 'ADMIN' && (
             <>
               <button onClick={() => onEdit(asset)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 text-gray-700">
                 <IconEdit className="w-4 h-4"/> Upravit
               </button>
               <button onClick={() => { if(window.confirm('Opravdu smazat?')) onDelete(asset.id); }} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 rounded shadow-sm hover:bg-red-50 text-red-600">
                 <IconTrash className="w-4 h-4"/> Smazat
               </button>
             </>
           )}
          <button onClick={onPrint} className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded shadow-sm hover:bg-gray-700">
            <IconPrinter className="w-4 h-4"/> Tisk / PDF
          </button>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="bg-fire-700 text-white px-8 py-6 flex justify-between items-start print:bg-white print:text-black print:px-0 print:py-4 print:border-b-2 print:border-black">
         <div>
             <h1 className="text-3xl font-bold mb-1 print:text-2xl">{asset.name}</h1>
             <div className="text-fire-100 opacity-90 text-sm print:text-black print:opacity-100">Evidenční číslo: <b>{asset.inventoryNumber}</b></div>
         </div>
         <div className="bg-white/20 px-3 py-1 rounded text-sm font-bold backdrop-blur-sm border border-white/30 print:border print:border-black print:bg-transparent print:text-black">
            {asset.category}
         </div>
      </div>

      {/* Alert Banner */}
      {asset.nextServiceDate && showAlert && alertStatus && (
        <div className="bg-orange-50 border-b border-orange-100 px-8 py-3 flex items-center justify-between text-orange-800 print:border print:border-black print:my-2 print:bg-transparent print:text-black">
           <div className="flex items-center gap-2">
             <IconAlert className="w-5 h-5" />
             <span className="font-medium">UPOZORNĚNÍ: <b>{alertStatus.text}</b> (Datum: {new Date(asset.nextServiceDate).toLocaleDateString('cs-CZ')})</span>
           </div>
           <button onClick={() => setShowAlert(false)} className="text-orange-600 hover:text-orange-900 font-bold px-2 text-xl print:hidden">&times;</button>
        </div>
      )}

      {/* Content Grid */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10 print:grid-cols-3 print:gap-8 print:p-0 print:mt-4">
        
        {/* Left: Image (approx 1/3) */}
        <div className="md:col-span-1 print:col-span-1">
          <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50 aspect-square flex items-center justify-center cursor-pointer hover:border-fire-300 transition-colors relative group print:border print:border-black print:bg-white" onClick={() => asset.imageUrl && setShowFullImage(true)}>
            {asset.imageUrl ? (
                <>
                  <img src={asset.imageUrl} alt={asset.name} className="max-w-full max-h-full object-contain rounded" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center print:hidden">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm pointer-events-none">Zvětšit</span>
                  </div>
                </>
            ) : <span className="text-gray-400 font-medium print:text-black">Bez fotografie</span>}
          </div>
          
          <div className="mt-6 bg-white border border-gray-100 rounded-lg shadow-sm p-4 text-center print:border print:border-black print:shadow-none print:mt-4 print:p-2">
             <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 print:text-black">Stav majetku</div>
             <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold print:border print:border-black print:bg-transparent print:text-black ${
                 asset.condition === 'Nové' ? 'bg-green-100 text-green-800' :
                 asset.condition === 'Dobrý' ? 'bg-blue-100 text-blue-800' :
                 'bg-red-100 text-red-800'
             }`}>
                {asset.condition}
             </div>
          </div>
        </div>

        {/* Right: Info (approx 2/3) */}
        <div className="md:col-span-2 space-y-8 print:col-span-2 print:space-y-6">
          
          {/* Attributes Grid */}
          <div className="grid grid-cols-2 gap-6 print:gap-4">
             <div className="border-b border-gray-100 pb-2 print:border-black">
                <span className="block text-gray-400 text-xs font-bold uppercase mb-1 print:text-black">Umístění</span>
                <b className="text-lg text-gray-900 print:text-black">{asset.location}</b>
             </div>
             <div className="border-b border-gray-100 pb-2 print:border-black">
                <span className="block text-gray-400 text-xs font-bold uppercase mb-1 print:text-black">Správce</span>
                <b className="text-lg text-gray-900 print:text-black">{asset.manager}</b>
             </div>
             <div className="border-b border-gray-100 pb-2 print:border-black">
                <span className="block text-gray-400 text-xs font-bold uppercase mb-1 print:text-black">Datum pořízení</span>
                <b className="text-gray-900 print:text-black">{new Date(asset.purchaseDate).toLocaleDateString('cs-CZ')}</b>
             </div>
             <div className="border-b border-gray-100 pb-2 print:border-black">
                <span className="block text-gray-400 text-xs font-bold uppercase mb-1 print:text-black">Pořizovací cena</span>
                <b className="text-xl text-fire-700 print:text-black">{asset.price.toLocaleString('cs-CZ')} Kč</b>
             </div>
          </div>

          {/* Maintenance Section */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 print:bg-white print:border print:border-black print:p-3">
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 print:text-black">
                <IconCalendar className="w-4 h-4 text-gray-500 print:text-black"/> Údržba a servis
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <span className="text-xs text-gray-500 block print:text-black">Příští termín</span>
                  <span className="font-bold text-gray-900 print:text-black">{asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString('cs-CZ') : 'Nenaplánováno'}</span>
               </div>
               <div>
                  <span className="text-xs text-gray-500 block print:text-black">Poznámka</span>
                  <span className="text-gray-900 italic print:text-black">{asset.maintenanceNotes || 'Bez poznámky'}</span>
               </div>
             </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 print:text-black">Technický popis</h3>
            <div className="text-gray-700 leading-relaxed text-justify bg-white border border-gray-100 p-4 rounded-lg shadow-sm print:border print:border-black print:shadow-none print:text-black">
                {asset.description || "K této položce nebyl přidán žádný popis."}
            </div>
          </div>
          
        </div>
      </div>

      {/* Full Image Modal - Hidden on Print */}
      {showFullImage && asset.imageUrl && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col p-4 animate-fade-in print:hidden">
           <div className="flex justify-end mb-4">
             <button onClick={() => setShowFullImage(false)} className="bg-fire-600 hover:bg-fire-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                <span className="font-bold text-xl px-2">&times;</span>
             </button>
           </div>
           <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={() => setShowFullImage(false)}>
              <img src={asset.imageUrl} className="max-w-full max-h-full object-contain rounded shadow-2xl" />
           </div>
        </div>
      )}
    </div>
  );
};
