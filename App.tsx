
import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Asset, ViewMode, AssetCategory, AssetCondition, AssetLocation, Notification, AppUser } from './types';
import { INITIAL_ASSETS, MOCK_MANAGERS } from './constants';
import { AssetForm } from './components/AssetForm';
import { AssetCard } from './components/AssetCard';
import { Settings } from './components/Settings';
import { NotificationCenter } from './components/NotificationCenter';
import { Login } from './components/Login';
import { IconFire, IconList, IconGrid, IconPlus, IconDownload, IconSearch, IconTrash, IconRotate, IconSettings, IconFilePdf, IconImage, IconBell } from './components/Icons';
import * as dataService from './services/dataService';
import { isSupabaseConfigured } from './services/supabaseClient';

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  
  // Configuration State
  const [managers, setManagers] = useState<string[]>(MOCK_MANAGERS);
  const [locations, setLocations] = useState<string[]>(Object.values(AssetLocation));
  const [categories, setCategories] = useState<string[]>(Object.values(AssetCategory));
  const [conditions, setConditions] = useState<string[]>(Object.values(AssetCondition));

  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  
  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);

  // Backup loading state
  const [backupProcessing, setBackupProcessing] = useState(false);

  // --- Auth & Init ---

  useEffect(() => {
    // Check if user is already logged in (localStorage persistence)
    const storedUser = localStorage.getItem('sdh_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('sdh_user');
      }
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      setConfigError(true);
      return;
    }
  }, []);

  // Load data when user is logged in
  useEffect(() => {
    if (user && isSupabaseConfigured) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedAssets = await dataService.fetchAssets();
      setAssets(fetchedAssets);

      const fetchedManagers = await dataService.fetchSettingsList('MANAGER');
      if (fetchedManagers.length > 0) setManagers(fetchedManagers);

      const fetchedLocations = await dataService.fetchSettingsList('LOCATION');
      if (fetchedLocations.length > 0) setLocations(fetchedLocations);

      const fetchedCategories = await dataService.fetchSettingsList('CATEGORY');
      if (fetchedCategories.length > 0) setCategories(fetchedCategories);

      const fetchedConditions = await dataService.fetchSettingsList('CONDITION');
      if (fetchedConditions.length > 0) setConditions(fetchedConditions);

    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: AppUser) => {
    setUser(loggedInUser);
    localStorage.setItem('sdh_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sdh_user');
    setAssets([]);
  };

  // --- Computed Values ---

  const activeAssets = useMemo(() => assets.filter(a => !a.isDeleted), [assets]);
  const deletedAssets = useMemo(() => assets.filter(a => a.isDeleted), [assets]);
  const totalValue = activeAssets.reduce((sum, a) => sum + a.price, 0);
  
  const filteredAssets = useMemo(() => {
    return activeAssets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            asset.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'ALL' || asset.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeAssets, searchTerm, filterCategory]);

  // --- Notification Logic ---
  const notifications = useMemo<Notification[]>(() => {
    const list: Notification[] = [];
    const today = new Date();

    activeAssets.forEach(asset => {
      if (asset.nextServiceDate) {
        const serviceDate = new Date(asset.nextServiceDate);
        const diffTime = serviceDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          list.push({
            assetId: asset.id,
            assetName: asset.name,
            date: asset.nextServiceDate,
            type: 'DANGER',
            daysRemaining: diffDays
          });
        } else if (diffDays <= 30) {
          list.push({
            assetId: asset.id,
            assetName: asset.name,
            date: asset.nextServiceDate,
            type: 'WARNING',
            daysRemaining: diffDays
          });
        }
      }
    });
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [activeAssets]);

  // --- Handlers ---

  const handleAddAsset = async (newAssetData: Omit<Asset, 'id'>) => {
    try {
      const savedAsset = await dataService.createAsset(newAssetData);
      setAssets(prev => [savedAsset, ...prev]);
      setViewMode('LIST');
    } catch (e) {
      alert("Chyba při ukládání: " + e);
    }
  };

  const handleUpdateAsset = async (assetData: Omit<Asset, 'id'>) => {
    if (!selectedAssetId) return;
    try {
      const updatedAsset = await dataService.updateAsset(selectedAssetId, assetData);
      setAssets(prev => prev.map(a => a.id === selectedAssetId ? updatedAsset : a));
      setViewMode('DETAIL');
    } catch (e) {
      alert("Chyba při aktualizaci: " + e);
    }
  };

  const handleEditClick = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    setViewMode('EDIT');
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await dataService.deleteAssetSoft(id);
      setAssets(prev => prev.map(a => a.id === id ? { ...a, isDeleted: true } : a));
      if (viewMode === 'DETAIL') {
         setViewMode('LIST');
         setSelectedAssetId(null);
      }
    } catch (e) {
      alert("Chyba při mazání: " + e);
    }
  };

  const onDeleteClick = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`Opravdu smazat položku "${asset.name}"? (Lze obnovit z koše)`)) {
      handleDeleteAsset(asset.id);
    }
  };

  const handleRestoreAsset = async (id: string) => {
    try {
      await dataService.restoreAsset(id);
      setAssets(prev => prev.map(a => a.id === id ? { ...a, isDeleted: false } : a));
    } catch (e) {
      alert("Chyba při obnově: " + e);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await dataService.deleteAssetPermanent(id);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert("Chyba při trvalém smazání: " + e);
    }
  };

  // --- Export / Import Handlers ---

  const handleBackupExport = async () => {
    setBackupProcessing(true);
    try {
      // Fetch fresh complete data from server
      const backupData = await dataService.getFullBackup();
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SDH_FullBackup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Chyba při vytváření zálohy: " + err);
    } finally {
      setBackupProcessing(false);
    }
  };

  const handleBackupImport = async (file: File) => {
    if (!window.confirm("Pozor! Import sloučí data ze zálohy s aktuální databází. Existující záznamy se stejným ID budou přepsány. Chcete pokračovat?")) {
      return;
    }

    setBackupProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        await dataService.restoreFullBackup(json);
        alert("Obnova dat byla úspěšná! Aplikace nyní znovu načte data.");
        await loadData(); // Reload UI
      } catch (err) {
        console.error(err);
        alert("Chyba při importu dat: " + err);
      } finally {
        setBackupProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  // --- CSV / PDF Exports ---

  const handleExportCSV = () => {
    const headers = ['ID', 'Název', 'Kategorie', 'Umístění', 'Stav', 'Cena', 'Správce', 'Ev. Číslo', 'Příští revize'];
    const escapeCsvValue = (val: string | number) => {
      const stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };
    const rows = activeAssets.map(a => [
      escapeCsvValue(a.id), 
      escapeCsvValue(a.name), 
      escapeCsvValue(a.category), 
      escapeCsvValue(a.location), 
      escapeCsvValue(a.condition), 
      escapeCsvValue(a.price), 
      escapeCsvValue(a.manager), 
      escapeCsvValue(a.inventoryNumber),
      escapeCsvValue(a.nextServiceDate || '')
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sdh_majetek_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const normalize = (str: string | number) => {
        return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };
    doc.setFontSize(18);
    doc.text("Seznam majetku - SDH Nezdenice", 14, 22);
    doc.setFontSize(11);
    doc.text(`Datum exportu: ${new Date().toLocaleDateString('cs-CZ')}`, 14, 30);
    const tableColumn = ["Nazev", "Ev.C.", "Kategorie", "Umisteni", "Stav", "Cena", "Revize"];
    const tableRows = filteredAssets.map(asset => [
      normalize(asset.name),
      normalize(asset.inventoryNumber),
      normalize(asset.category),
      normalize(asset.location),
      normalize(asset.condition),
      `${asset.price} Kc`,
      asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString('cs-CZ') : '-'
    ]);
    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [190, 18, 60] },
      styles: { fontSize: 9 },
    });
    doc.save(`sdh_majetek_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Rendering ---

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-fire-700 p-6 text-center">
            <IconFire className="w-16 h-16 text-white mx-auto mb-4 opacity-90" />
            <h1 className="text-2xl font-bold text-white">SDH Nezdenice</h1>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Chybí konfigurace databáze</h2>
            <p className="text-gray-600 text-sm mb-6">
              Aplikace není propojena s Supabase. Zkontrolujte soubor <code>.env</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    if (loading) return <div className="text-center py-20 text-gray-500">Načítám data...</div>;

    if (viewMode === 'FORM') {
      return (
        <AssetForm 
          onSave={handleAddAsset} 
          onCancel={() => setViewMode('LIST')} 
          availableManagers={managers}
          availableLocations={locations}
          availableCategories={categories}
          availableConditions={conditions}
        />
      );
    }

    if (viewMode === 'EDIT' && selectedAssetId) {
      const assetToEdit = assets.find(a => a.id === selectedAssetId);
      if (!assetToEdit) return <div>Chyba: Majetek nenalezen</div>;
      return (
         <AssetForm 
          initialData={assetToEdit}
          onSave={handleUpdateAsset} 
          onCancel={() => setViewMode('DETAIL')} 
          availableManagers={managers}
          availableLocations={locations}
          availableCategories={categories}
          availableConditions={conditions}
        />
      );
    }

    if (viewMode === 'DETAIL' && selectedAssetId) {
      const asset = assets.find(a => a.id === selectedAssetId);
      if (asset) {
        return (
          <AssetCard 
            asset={asset} 
            onBack={() => {
              setSelectedAssetId(null);
              setViewMode('LIST');
            }}
            onDelete={handleDeleteAsset}
            onEdit={handleEditClick}
            userRole={user.role}
          />
        );
      }
    }

    if (viewMode === 'SETTINGS') {
      return (
        <Settings 
          managers={managers} setManagers={(v) => { setManagers(v); v.forEach(i => dataService.addSettingsItem('MANAGER', i).catch(()=>{})); }}
          locations={locations} setLocations={(v) => { setLocations(v); v.forEach(i => dataService.addSettingsItem('LOCATION', i).catch(()=>{})); }}
          categories={categories} setCategories={(v) => { setCategories(v); v.forEach(i => dataService.addSettingsItem('CATEGORY', i).catch(()=>{})); }}
          conditions={conditions} setConditions={(v) => { setConditions(v); v.forEach(i => dataService.addSettingsItem('CONDITION', i).catch(()=>{})); }}
          onClose={() => setViewMode('LIST')}
          onExportBackup={handleBackupExport}
          onImportBackup={handleBackupImport}
          isProcessing={backupProcessing}
        />
      );
    }

    if (viewMode === 'TRASH') {
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
           <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
             <h2 className="text-lg font-bold text-gray-800 flex items-center">
               <IconTrash className="w-5 h-5 mr-2 text-gray-600" />
               Koš (Smazané položky)
             </h2>
             <button onClick={() => setViewMode('LIST')} className="text-sm text-blue-600 hover:underline">Zpět na seznam</button>
           </div>
           {deletedAssets.length === 0 ? (
             <div className="p-8 text-center text-gray-500">Koš je prázdný.</div>
           ) : (
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Název</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akce</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deletedAssets.map(asset => (
                    <tr key={asset.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{asset.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{asset.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleRestoreAsset(asset.id)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                          title="Obnovit"
                        >
                          <IconRotate className="w-4 h-4 mr-1" /> Obnovit
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Opravdu trvale smazat? Tato akce je nevratná.')) handlePermanentDelete(asset.id);
                          }}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          title="Trvale smazat"
                        >
                          <IconTrash className="w-4 h-4 mr-1" /> Smazat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-64">
              <IconSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 bg-transparent" />
              <input 
                type="text" 
                placeholder="Hledat majetek..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 bg-white rounded-md focus:ring-fire-500 focus:border-fire-500"
              />
            </div>
            <select 
              className="border border-gray-300 bg-white rounded-md px-3 py-2"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="ALL">Všechny kategorie</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {/* View Toggles */}
            <div className="flex bg-gray-100 rounded p-1">
              <button 
                onClick={() => setViewMode('LIST')}
                className={`p-2 rounded ${viewMode === 'LIST' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <IconList className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('GRID')}
                className={`p-2 rounded ${viewMode === 'GRID' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <IconGrid className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-px bg-gray-300 mx-1 h-8"></div>

            {user.role === 'ADMIN' && (
              <button 
                onClick={() => setViewMode('TRASH')}
                className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors relative"
                title="Koš"
              >
                <IconTrash className="w-4 h-4" />
                {deletedAssets.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {deletedAssets.length}
                  </span>
                )}
              </button>
            )}

            <button 
              onClick={handleExportCSV}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
              title="Export do CSV"
            >
              <IconDownload className="w-4 h-4 mr-2" /> CSV
            </button>
             <button 
              onClick={handleExportPDF}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
              title="Export do PDF"
            >
              <IconFilePdf className="w-4 h-4 mr-2" /> PDF
            </button>
            {user.role === 'ADMIN' && (
              <button 
                onClick={() => setViewMode('FORM')}
                className="flex items-center px-4 py-2 bg-fire-600 text-white rounded-md hover:bg-fire-700 shadow-md transition-colors text-sm font-medium"
              >
                <IconPlus className="w-4 h-4 mr-2" /> Nový Majetek
              </button>
            )}
          </div>
        </div>

        {/* Data Display */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            Žádný majetek nenalezen.
          </div>
        ) : viewMode === 'LIST' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Název / Ev.č.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Umístění</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stav</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cena</th>
                    {user.role === 'ADMIN' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssets.map(asset => (
                    <tr 
                      key={asset.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedAssetId(asset.id);
                        setViewMode('DETAIL');
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                           <div className="h-10 w-10 flex-shrink-0">
                              <img className="h-10 w-10 rounded object-contain bg-gray-50" src={asset.imageUrl} alt="" />
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                             <div className="text-xs text-gray-500">{asset.inventoryNumber}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white
                          ${asset.condition === 'Nové' ? 'bg-green-600' : 
                            asset.condition === 'Dobrý' ? 'bg-blue-600' : 
                            asset.condition === 'Opotřebované' ? 'bg-orange-500' : 
                            asset.condition === 'Poškozené' ? 'bg-red-600' : 'bg-gray-600'}`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{asset.price.toLocaleString('cs-CZ')} Kč</td>
                      
                      {user.role === 'ADMIN' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={(e) => onDeleteClick(e, asset)}
                            className="text-red-600 hover:text-red-900 p-2 relative z-10"
                            title="Smazat do koše"
                          >
                            <IconTrash className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map(asset => (
               <div 
                key={asset.id} 
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer flex flex-col overflow-hidden"
                onClick={() => {
                  setSelectedAssetId(asset.id);
                  setViewMode('DETAIL');
                }}
               >
                 <div className="relative h-48 w-full bg-gray-50 border-b border-gray-100 flex items-center justify-center p-2">
                    {asset.imageUrl ? (
                        <img 
                            src={asset.imageUrl} 
                            alt={asset.name} 
                            className="max-h-full max-w-full object-contain" 
                        />
                    ) : (
                        <IconImage className="w-12 h-12 text-gray-300" />
                    )}
                    <span className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 text-xs rounded font-medium backdrop-blur-sm">
                      {asset.location}
                    </span>
                 </div>
                 <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{asset.name}</h3>
                    <p className="text-xs text-gray-500 mb-2 font-mono">{asset.inventoryNumber}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">{asset.description}</p>
                 </div>
                 <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center mt-auto">
                    <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded px-2 py-1 truncate max-w-[50%]">{asset.category}</span>
                    <span className="text-sm font-bold text-fire-700">{asset.price.toLocaleString('cs-CZ')} Kč</span>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-fire-700 text-white shadow-lg no-print relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            setViewMode('LIST');
            setSelectedAssetId(null);
          }}>
            <div className="p-2 bg-white rounded-full">
               <IconFire className="w-6 h-6 text-fire-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SDH Nezdenice</h1>
              <p className="text-xs text-white opacity-90">Správa majetku a techniky</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Notification Bell */}
             <div className="relative">
               <button 
                 onClick={() => setShowNotifications(!showNotifications)}
                 className="p-2 text-white hover:bg-fire-600 rounded-full transition-colors relative"
                 title="Upozornění"
               >
                 <IconBell className="w-6 h-6" />
                 {notifications.length > 0 && (
                   <span className="absolute top-1 right-1 bg-yellow-400 text-fire-800 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-fire-700">
                     {notifications.length}
                   </span>
                 )}
               </button>
               <NotificationCenter 
                  notifications={notifications} 
                  isOpen={showNotifications} 
                  onClose={() => setShowNotifications(false)}
                  onSelect={(id) => {
                    setSelectedAssetId(id);
                    setViewMode('DETAIL');
                  }}
               />
             </div>

             {user.role === 'ADMIN' && (
                <button 
                  onClick={() => setViewMode('SETTINGS')}
                  className="p-2 text-white hover:bg-fire-600 rounded-full transition-colors"
                  title="Nastavení"
                >
                    <IconSettings className="w-6 h-6" />
                </button>
             )}
             
             <div className="text-right border-l border-fire-600 pl-4 ml-2">
               <div className="text-xs opacity-70 uppercase tracking-wide">Přihlášen</div>
               <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{user.username}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-xs text-fire-200 hover:text-white underline ml-1"
                  >
                    Odhlásit
                  </button>
               </div>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Stats (Only show in List/Grid mode) */}
        {(viewMode === 'LIST' || viewMode === 'GRID') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-fire-600">
              <div className="text-gray-500 text-sm font-medium uppercase">Celková hodnota majetku</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{totalValue.toLocaleString('cs-CZ')} Kč</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="text-gray-500 text-sm font-medium uppercase">Počet položek</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{activeAssets.length}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
              <div className="text-gray-500 text-sm font-medium uppercase">Upozornění na údržbu</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {notifications.length} 
                <span className="text-sm font-normal text-gray-400 ml-2">
                  (Revize/Servis)
                </span>
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} SDH Nezdenice. Vyvinuto pro potřeby sboru.
        </div>
      </footer>
    </div>
  );
}

export default App;
