
import React from 'react';
import { Asset } from '../types';
import { AssetCard } from './AssetCard';
import { IconFire } from './Icons';

interface PrintReportProps {
  assets: Asset[];
}

export const PrintReport: React.FC<PrintReportProps> = ({ assets }) => {
  return (
    <div className="hidden print:block text-black font-sans bg-white">
      {/* 1. Titulní strana - Soupis */}
      <div className="p-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-4 mb-8 border-b-2 border-black pb-6">
          <div className="text-black">
             <IconFire className="w-16 h-16" />
          </div>
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-wider">SDH Nezdenice</h1>
            <p className="text-2xl mt-1 font-light">Evidenční soupis majetku</p>
            <p className="text-sm mt-4 text-gray-600">Datum vyhotovení sestavy: {new Date().toLocaleDateString('cs-CZ')}</p>
          </div>
        </div>

        <div className="mb-6">
           <h2 className="text-xl font-bold mb-2 uppercase border-b border-gray-400 pb-1">Souhrnný seznam položek</h2>
           <table className="w-full text-left text-sm border-collapse">
             <thead>
               <tr className="border-b-2 border-black font-bold">
                  <th className="py-2 pr-2">Ev. Číslo</th>
                  <th className="py-2 pr-2">Název</th>
                  <th className="py-2 pr-2">Kategorie</th>
                  <th className="py-2 pr-2">Umístění</th>
                  <th className="py-2 pr-2">Stav</th>
                  <th className="py-2 text-right">Cena</th>
               </tr>
             </thead>
             <tbody>
               {assets.map((asset, index) => (
                 <tr key={asset.id} className="border-b border-gray-300">
                   <td className="py-2 pr-2 font-mono font-bold">{asset.inventoryNumber}</td>
                   <td className="py-2 pr-2 font-bold">{asset.name}</td>
                   <td className="py-2 pr-2">{asset.category}</td>
                   <td className="py-2 pr-2">{asset.location}</td>
                   <td className="py-2 pr-2">{asset.condition}</td>
                   <td className="py-2 text-right whitespace-nowrap">{asset.price.toLocaleString('cs-CZ')} Kč</td>
                 </tr>
               ))}
             </tbody>
             <tfoot>
               <tr className="font-bold text-lg border-t-2 border-black">
                 <td colSpan={5} className="py-4 text-right pr-4">Celková hodnota majetku:</td>
                 <td className="py-4 text-right">{assets.reduce((sum, a) => sum + a.price, 0).toLocaleString('cs-CZ')} Kč</td>
               </tr>
             </tfoot>
           </table>
        </div>
        
        <div className="mt-auto text-center text-xs text-gray-500 pb-4">
           Vygenerováno systémem správy majetku SDH Nezdenice
        </div>
      </div>

      {/* 2. Jednotlivé karty - Každá na novou stránku */}
      {assets.map(asset => (
        <div key={asset.id} className="break-before-page p-4 h-screen flex flex-col justify-center">
           {/* Reuse existing AssetCard but pass dummy handlers as actions are hidden in print */}
           <div className="border border-black p-4 rounded shadow-none">
             <div className="text-xs font-mono mb-2 text-right text-gray-500">List evidenční karty: {asset.inventoryNumber}</div>
             <AssetCard 
                asset={asset} 
                onBack={()=>{}} 
                onDelete={()=>{}} 
                onEdit={()=>{}} 
                onPrint={()=>{}}
                userRole="READER" // Hide edit buttons logic inside card
             />
           </div>
           <div className="mt-4 text-center text-xs border-t border-gray-300 pt-2">
             Evidenční karta majetku SDH Nezdenice | {new Date().toLocaleDateString('cs-CZ')}
           </div>
        </div>
      ))}
    </div>
  );
};
