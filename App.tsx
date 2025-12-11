
import React, { useState, useMemo, useEffect } from 'react';
import { Asset, ViewMode, AssetCategory, AssetCondition, AssetLocation, Notification, AppUser } from './types';
import { INITIAL_ASSETS, MOCK_MANAGERS } from './constants';
import AssetForm from './components/AssetForm';
import { AssetCard } from './components/AssetCard';
import { Settings } from './components/Settings';
import { NotificationCenter } from './components/NotificationCenter';
import { PrintReport } from './components/PrintReport';
import { Login } from './components/Login';
import { IconFire, IconList, IconGrid, IconPlus, IconSearch, IconSettings, IconBell, IconImage, IconPrinter, IconFilePdf } from './components/Icons';
import * as dataService from './services/dataService';
import { isSupabaseConfigured, initSupabase } from './services/supabaseClient';
import { initGemini } from './services/geminiService';
import { generatePDF } from './services/pdfService';

export function App() {
  const [configLoaded, setConfigLoaded] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  
  const [managers, setManagers] = useState<string[]>(MOCK_MANAGERS);
  const [locations, setLocations] = useState<string[]>(Object.values(AssetLocation));
  const [categories, setCategories] = useState<string[]>(Object.values(AssetCategory));
  const [conditions, setConditions] = useState<string[]>(Object.values(AssetCondition));

  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [backupProcessing, setBackupProcessing] = useState(false);

  // Load Config (Fallback logic: config.json -> import.meta.env)
  useEffect(() => {
    const loadConfiguration = async () => {
      // 1. Výchozí hodnoty z .env (Build time / Environment variables)
      // Bezpečný přístup k import.meta.env
      const env = (import.meta as any).env || {};
      
      let config = {
        VITE_API_KEY: env.VITE_API_KEY || '',
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || '',
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || ''
      };

      // 2. Pokus o načtení runtime konfigurace (config.json)
      try {
        const response = await fetch('/config.json');
        if (response.ok) {
          const jsonConfig = await response.json();
          // Přepsat .env hodnoty těmi z config.json, pokud existují
          config = { ...config, ...jsonConfig };
          console.log("Konfigurace načtena z config.json");
        } else {
          console.log("config.json nenalezen, použity .env proměnné");
        }
      } catch (err) {
        console.warn("Chyba při stahování config.json, použity .env proměnné:", err);
      }

      // 3. Inicializace služeb
      initSupabase(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY);
      initGemini(config.VITE_API_KEY);
      setConfigLoaded(true);
    };

    loadConfiguration();
  }, []);

  useEffect(() => {
    if (!configLoaded) return;
    
    const storedUser = localStorage.getItem('sdh_user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { localStorage.removeItem('sdh_user'); }
    }
  }, [configLoaded]);

  useEffect(() => {
    if (configLoaded && user && isSupabaseConfigured) loadData();
    else if (configLoaded && user && !isSupabaseConfigured) {
        setLoading(false);
        setConfigError(true);
    }
  }, [user, configLoaded, isSupabaseConfigured]);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedAssets = await dataService.fetchAssets();
      setAssets(fetchedAssets);
      const m = await dataService.fetchSettingsList('MANAGER'); if(m.length) setManagers(m);
      const l = await dataService.fetchSettingsList('LOCATION'); if(l.length) setLocations(l);
      const c = await dataService.fetchSettingsList('CATEGORY'); if(c.length) setCategories(c);
      const co = await dataService.fetchSettingsList('CONDITION'); if(co.length) setConditions(co);
    } catch (error) { console.error("Failed to load data", error); } finally { setLoading(false); }
  };

  const handleLoginSuccess = (loggedInUser: AppUser) => {
    setUser(loggedInUser);
    localStorage.setItem('sdh_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('sdh_user'); setAssets([]); };

  const activeAssets = useMemo(() => assets.filter(a => !a.isDeleted), [assets]);
  const totalValue = activeAssets.reduce((sum, a) => sum + a.price, 0);
  
  const filteredAssets = useMemo(() => {
    return activeAssets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || asset.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'ALL' || asset.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeAssets, searchTerm, filterCategory]);

  const notifications = useMemo<Notification[]>(() => {
    const list: Notification[] = [];
    const today = new Date();
    activeAssets.forEach(asset => {
      if (asset.nextServiceDate) {
        const diffDays = Math.ceil((new Date(asset.nextServiceDate).getTime() - today.getTime()) / (86400000));
        if (diffDays <= 30) list.push({
            assetId: asset.id, assetName: asset.name, date: asset.nextServiceDate,
            type: diffDays < 0 ? 'DANGER' : 'WARNING', daysRemaining: diffDays
        });
      }
    });
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [activeAssets]);

  const handleAddAsset = async (data: Omit<Asset, 'id'>) => {
    if (!user) return;
    try { setAssets([await dataService.createAsset(data, user.username), ...assets]); setViewMode('LIST'); } catch(e) { alert(e); }
  };
  const handleUpdateAsset = async (data: Omit<Asset, 'id'>) => {
    if (!selectedAssetId || !user) return;
    try { const u = await dataService.updateAsset(selectedAssetId, data, user.username); setAssets(assets.map(a => a.id === selectedAssetId ? u : a)); setViewMode('DETAIL'); } catch(e) { alert(e); }
  };
  const handleDeleteAsset = async (id: string) => {
    if (!user) return;
    try { await dataService.deleteAssetSoft(id, user.username); setAssets(assets.map(a => a.id === id ? { ...a, isDeleted: true } : a)); if(viewMode==='DETAIL'){ setViewMode('LIST'); setSelectedAssetId(null); } } catch(e) { alert(e); }
  };
  const handleBackupExport = async () => {
    if (!user) return;
    setBackupProcessing(true);
    try {
      const data = await dataService.getFullBackup(user.username);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `SDH_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch(e) { alert(e); } finally { setBackupProcessing(false); }
  };
  const handleBackupImport = async (file: File) => {
    if (!user) return;
    if(!confirm("Import přepíše data. Pokračovat?")) return;
    setBackupProcessing(true);
    const r = new FileReader();
    r.onload = async (e) => {
        try { await dataService.restoreFullBackup(JSON.parse(e.target?.result as string), user.username); await loadData(); alert("OK"); }
        catch(err) { alert(err); } finally { setBackupProcessing(false); }
    };
    r.readAsText(file);
  };
  
  // Settings Handlers
  const handleAddSetting = async (type: string, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (!user) return;
    try {
        await dataService.addSettingsItem(type, value, user.username);
        setter(prev => [...prev, value]);
    } catch (e) { console.error(e); alert("Chyba při ukládání nastavení"); }
  };

  const handleRemoveSetting = async (type: string, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (!user) return;
    try {
        await dataService.removeSettingsItem(type, value, user.username);
        setter(prev => prev.filter(item => item !== value));
    } catch (e) { console.error(e); alert("Chyba při odebírání nastavení"); }
  };

  const handlePrintReport = () => {
    try {
      window.print();
    } catch (e) {
      alert("Tisk není v tomto prostředí podporován. Použijte prosím tlačítko 'Export PDF'.");
      console.error(e);
    }
  };

  const handleExportPDF = async () => {
    setBackupProcessing(true);
    try {
        const filename = `SDH_Majetek_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDF(filteredAssets, filename);
    } catch (e) {
        console.error(e);
        alert("Chyba při generování PDF. Zkontrolujte připojení k internetu (pro stažení fontů).");
    } finally {
        setBackupProcessing(false);
    }
  };

  const handlePrintSingleAsset = async (asset: Asset) => {
    setBackupProcessing(true);
    try {
        const filename = `SDH_Karta_${asset.inventoryNumber}.pdf`;
        await generatePDF([asset], filename);
    } catch (e) {
        console.error(e);
        alert("Chyba při generování PDF karty.");
    } finally {
        setBackupProcessing(false);
    }
  }

  if (!configLoaded) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500 font-medium">Načítám konfiguraci...</div>;

  if (configError) return <div className="p-4 text-red-600 font-bold text-center mt-10">Chyba konfigurace DB. Zkontrolujte soubor config.json nebo .env.</div>;
  
  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  const renderContent = () => {
    if (loading) return <div className="p-10 text-center text-gray-500">Načítám data...</div>;
    
    if (viewMode === 'FORM') return <AssetForm onSave={handleAddAsset} onCancel={() => setViewMode('LIST')} availableManagers={managers} availableLocations={locations} availableCategories={categories} availableConditions={conditions} />;
    
    if (viewMode === 'EDIT' && selectedAssetId) {
        const a = assets.find(x => x.id === selectedAssetId);
        return a ? <AssetForm initialData={a} onSave={handleUpdateAsset} onCancel={() => setViewMode('DETAIL')} availableManagers={managers} availableLocations={locations} availableCategories={categories} availableConditions={conditions} /> : <div>Chyba</div>;
    }

    if (viewMode === 'DETAIL' && selectedAssetId) {
        const a = assets.find(x => x.id === selectedAssetId);
        return a ? <AssetCard asset={a} onBack={() => { setSelectedAssetId(null); setViewMode('LIST'); }} onDelete={handleDeleteAsset} onEdit={(ast) => { setSelectedAssetId(ast.id); setViewMode('EDIT'); }} onPrint={() => handlePrintSingleAsset(a)} userRole={user.role} /> : null;
    }

    if (viewMode === 'SETTINGS') return <Settings 
        managers={managers} 
        onAddManager={(v) => handleAddSetting('MANAGER', v, setManagers)}
        onRemoveManager={(v) => handleRemoveSetting('MANAGER', v, setManagers)}
        
        locations={locations} 
        onAddLocation={(v) => handleAddSetting('LOCATION', v, setLocations)}
        onRemoveLocation={(v) => handleRemoveSetting('LOCATION', v, setLocations)}
        
        categories={categories} 
        onAddCategory={(v) => handleAddSetting('CATEGORY', v, setCategories)}
        onRemoveCategory={(v) => handleRemoveSetting('CATEGORY', v, setCategories)}
        
        conditions={conditions} 
        onAddCondition={(v) => handleAddSetting('CONDITION', v, setConditions)}
        onRemoveCondition={(v) => handleRemoveSetting('CONDITION', v, setConditions)}
        
        onClose={() => setViewMode('LIST')} 
        onExportBackup={handleBackupExport} 
        onImportBackup={handleBackupImport} 
        isProcessing={backupProcessing}
        currentUser={user}
    />;

    return (
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
           <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <IconSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
               <input type="text" placeholder="Hledat majetek..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} 
                 className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-fire-500 focus:border-fire-500" />
             </div>
             <select className="border border-gray-300 rounded-md py-2 px-3 focus:ring-fire-500 focus:border-fire-500 bg-white" 
               value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
                 <option value="ALL">Všechny kategorie</option>
                 {categories.map(c=><option key={c} value={c}>{c}</option>)}
             </select>
           </div>
           
           <div className="flex gap-2">
             <div className="bg-gray-100 p-1 rounded-md flex">
               <button onClick={()=>setViewMode('LIST')} className={`p-2 rounded ${viewMode === 'LIST' ? 'bg-white shadow text-fire-700' : 'text-gray-500 hover:text-gray-700'}`}><IconList className="w-5 h-5"/></button>
               <button onClick={()=>setViewMode('GRID')} className={`p-2 rounded ${viewMode === 'GRID' ? 'bg-white shadow text-fire-700' : 'text-gray-500 hover:text-gray-700'}`}><IconGrid className="w-5 h-5"/></button>
             </div>
             
             <button onClick={handleExportPDF} disabled={backupProcessing} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50" title="Stáhnout jako PDF">
                <IconFilePdf className="w-4 h-4" /> {backupProcessing ? 'Pracuji...' : 'PDF'}
             </button>

             {user.role === 'ADMIN' && (
               <button onClick={()=>setViewMode('FORM')} className="bg-fire-700 hover:bg-fire-800 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm transition-colors">
                 <IconPlus className="w-4 h-4" /> Nový majetek
               </button>
             )}
           </div>
        </div>

        {/* Content */}
        {filteredAssets.length === 0 ? <div className="text-center py-10 text-gray-500">Žádné položky k zobrazení.</div> : 
         viewMode === 'LIST' ? (
           <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs border-b border-gray-200">
                 <tr>
                   <th className="p-4 w-20 text-center">Foto</th>
                   <th className="p-4">Název / Ev.Č.</th>
                   <th className="p-4 hidden sm:table-cell">Kategorie</th>
                   <th className="p-4 hidden md:table-cell">Umístění</th>
                   <th className="p-4">Stav</th>
                   <th className="p-4 text-right">Cena</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredAssets.map(a => (
                   <tr key={a.id} onClick={()=>{setSelectedAssetId(a.id);setViewMode('DETAIL');}} className="cursor-pointer hover:bg-gray-50 transition-colors">
                     <td className="p-4">
                       <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                         {a.imageUrl ? (
                           <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" />
                         ) : (
                           <IconImage className="w-6 h-6 text-gray-300" />
                         )}
                       </div>
                     </td>
                     <td className="p-4">
                       <div className="font-bold text-gray-900">{a.name}</div>
                       <div className="text-gray-500 text-xs">{a.inventoryNumber}</div>
                     </td>
                     <td className="p-4 hidden sm:table-cell text-gray-600">{a.category}</td>
                     <td className="p-4 hidden md:table-cell text-gray-600">{a.location}</td>
                     <td className="p-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         a.condition === 'Nové' ? 'bg-green-100 text-green-800' :
                         a.condition === 'Dobrý' ? 'bg-blue-100 text-blue-800' :
                         a.condition === 'K vyřazení' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                       }`}>
                         {a.condition}
                       </span>
                     </td>
                     <td className="p-4 text-right font-medium text-gray-900">{a.price.toLocaleString('cs-CZ')} Kč</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         ) : (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAssets.map(a => (
                 <div key={a.id} onClick={()=>{setSelectedAssetId(a.id);setViewMode('DETAIL');}} 
                   className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col">
                    <div className="h-40 bg-gray-100 flex items-center justify-center border-b border-gray-100 relative">
                       {a.imageUrl ? <img src={a.imageUrl} className="w-full h-full object-cover"/> : <IconImage className="w-12 h-12 text-gray-300"/>}
                       <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 rounded text-xs font-bold shadow-sm">{a.condition}</div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="font-bold text-gray-900 truncate mb-1" title={a.name}>{a.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{a.inventoryNumber}</div>
                      <div className="mt-auto flex justify-between items-end">
                         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{a.category}</span>
                         <span className="font-bold text-fire-700">{a.price.toLocaleString('cs-CZ')}</span>
                      </div>
                    </div>
                 </div>
              ))}
           </div>
         )
        }
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans print:hidden">
        <header className="bg-fire-700 text-white shadow-lg">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="bg-white p-1.5 rounded-full text-fire-700">
                 <IconFire className="w-6 h-6" />
               </div>
               <div>
                 <h1 className="text-lg font-bold leading-none">SDH Nezdenice</h1>
                 <span className="text-xs text-fire-100 opacity-90 block">Správa majetku</span>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Stats - Hidden on Mobile */}
              <div className="hidden lg:flex gap-6 mr-4 text-sm border-r border-fire-600 pr-6">
                 <div>
                    <span className="block text-fire-200 text-xs">CELKEM POLOŽEK</span>
                    <span className="font-bold">{activeAssets.length}</span>
                 </div>
                 <div>
                    <span className="block text-fire-200 text-xs">HODNOTA</span>
                    <span className="font-bold">{totalValue.toLocaleString('cs-CZ')} Kč</span>
                 </div>
              </div>

              <div className="relative cursor-pointer" onClick={() => setShowNotifications(true)}>
                 <IconBell className={`w-6 h-6 hover:text-fire-100 transition-colors ${notifications.some(n=>n.type==='DANGER') ? 'animate-pulse text-yellow-300' : ''}`} />
                 {notifications.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-yellow-400 text-fire-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                     {notifications.length}
                   </span>
                 )}
              </div>

              {user.role === 'ADMIN' && (
                <button onClick={() => setViewMode('SETTINGS')} className="hover:text-fire-100 transition-colors" title="Nastavení">
                  <IconSettings className="w-6 h-6" />
                </button>
              )}

              <div className="text-right ml-2">
                <div className="text-xs text-fire-200 uppercase font-bold tracking-wider">UŽIVATEL</div>
                <div className="text-sm font-bold flex items-center gap-2">
                   {user.username}
                   <button onClick={handleLogout} className="text-xs font-normal underline hover:text-fire-200 opacity-80">(Odhlásit)</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
           {renderContent()}
        </main>

        <NotificationCenter 
          isOpen={showNotifications} 
          onClose={() => setShowNotifications(false)} 
          notifications={notifications}
          onSelect={(id) => { setSelectedAssetId(id); setViewMode('DETAIL'); }} 
        />
      </div>
      
      {/* Hidden Print Report Component */}
      <PrintReport assets={filteredAssets} />
    </>
  );
}
