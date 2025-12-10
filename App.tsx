
import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Asset, ViewMode, AssetCategory, AssetCondition, AssetLocation } from './types';
import { INITIAL_ASSETS, MOCK_MANAGERS } from './constants';
import { AssetForm } from './components/AssetForm';
import { AssetCard } from './components/AssetCard';
import { Settings } from './components/Settings';
import { IconFire, IconList, IconGrid, IconPlus, IconDownload, IconSearch, IconTrash, IconRotate, IconSettings, IconFilePdf, IconImage } from './components/Icons';

// Storage Keys
const STORAGE_KEYS = {
  ASSETS: 'sdh_assets_data',
  DELETED: 'sdh_deleted_data',
  MANAGERS: 'sdh_conf_managers',
  LOCATIONS: 'sdh_conf_locations',
  CATEGORIES: 'sdh_conf_categories',
  CONDITIONS: 'sdh_conf_conditions'
};

// Helper to load from local storage or return default
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Error parsing storage for ${key}`, e);
      return defaultValue;
    }
  }
  return defaultValue;
};

function App() {
  // Initialize state from LocalStorage
  const [assets, setAssets] = useState<Asset[]>(() => 
    loadFromStorage(STORAGE_KEYS.ASSETS, INITIAL_ASSETS)
  );
  const [deletedAssets, setDeletedAssets] = useState<Asset[]>(() => 
    loadFromStorage(STORAGE_KEYS.DELETED, [])
  );
  
  // Configuration State (Settings) - also persisted
  const [managers, setManagers] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEYS.MANAGERS, MOCK_MANAGERS)
  );
  const [locations, setLocations] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEYS.LOCATIONS, Object.values(AssetLocation))
  );
  const [categories, setCategories] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEYS.CATEGORIES, Object.values(AssetCategory))
  );
  const [conditions, setConditions] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEYS.CONDITIONS, Object.values(AssetCondition))
  );

  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Persistence Effects - Save to LocalStorage whenever state changes
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets)), [assets]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.DELETED, JSON.stringify(deletedAssets)), [deletedAssets]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.MANAGERS, JSON.stringify(managers)), [managers]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations)), [locations]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CONDITIONS, JSON.stringify(conditions)), [conditions]);

  // Computed Values
  const totalValue = assets.reduce((sum, a) => sum + a.price, 0);
  
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            asset.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'ALL' || asset.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [assets, searchTerm, filterCategory]);

  const handleAddAsset = (newAssetData: Omit<Asset, 'id'>) => {
    const newAsset: Asset = {
      ...newAssetData,
      id: Date.now().toString(),
    };
    setAssets(prev => [...prev, newAsset]);
    setViewMode('LIST');
  };

  const handleUpdateAsset = (assetData: Omit<Asset, 'id'>) => {
    if (!selectedAssetId) return;
    setAssets(prev => prev.map(a => a.id === selectedAssetId ? { ...assetData, id: selectedAssetId } : a));
    setViewMode('DETAIL');
  };

  const handleEditClick = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    setViewMode('EDIT');
  };

  const handleDeleteAsset = (id: string) => {
    // Find the asset in the current list
    const assetToDelete = assets.find(a => a.id === id);
    
    if (assetToDelete) {
      // 1. Add to trash
      setDeletedAssets(prev => [assetToDelete, ...prev]);
      // 2. Remove from active list
      setAssets(prev => prev.filter(a => a.id !== id));
      // 3. Reset view
      if (viewMode === 'DETAIL') {
         setViewMode('LIST');
         setSelectedAssetId(null);
      }
    }
  };

  // Helper to handle delete click in list view safely
  const onDeleteClick = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation(); // Stop row click
    e.preventDefault();
    if (window.confirm(`Opravdu smazat položku "${asset.name}"? (Lze obnovit z koše)`)) {
      handleDeleteAsset(asset.id);
    }
  };

  const handleRestoreAsset = (id: string) => {
    const assetToRestore = deletedAssets.find(a => a.id === id);
    if (assetToRestore) {
      setAssets(prev => [...prev, assetToRestore]);
      setDeletedAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const handlePermanentDelete = (id: string) => {
    setDeletedAssets(prev => prev.filter(a => a.id !== id));
  };

  // --- Export / Import Handlers ---

  const handleBackupExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      assets,
      deletedAssets,
      config: {
        managers,
        locations,
        categories,
        conditions
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SDH_Zaloha_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBackupImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Basic validation
        if (!json.assets || !json.config) {
          throw new Error("Neplatný formát souboru zálohy.");
        }

        if (window.confirm("POZOR: Tato akce přepíše veškerá aktuální data daty ze zálohy. Chcete pokračovat?")) {
          setAssets(json.assets || []);
          setDeletedAssets(json.deletedAssets || []);
          setManagers(json.config.managers || MOCK_MANAGERS);
          setLocations(json.config.locations || []);
          setCategories(json.config.categories || []);
          setConditions(json.config.conditions || []);
          alert("Data byla úspěšně obnovena.");
        }
      } catch (err) {
        console.error(err);
        alert("Chyba při načítání souboru: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  // --- File Exports (CSV/PDF) ---

  const handleExportCSV = () => {
    const headers = ['ID', 'Název', 'Kategorie', 'Umístění', 'Stav', 'Cena', 'Správce', 'Ev. Číslo'];
    
    // Funkce pro bezpečné formátování hodnot do CSV
    const escapeCsvValue = (val: string | number) => {
      const stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const rows = assets.map(a => [
      escapeCsvValue(a.id), 
      escapeCsvValue(a.name), 
      escapeCsvValue(a.category), 
      escapeCsvValue(a.location), 
      escapeCsvValue(a.condition), 
      escapeCsvValue(a.price), 
      escapeCsvValue(a.manager), 
      escapeCsvValue(a.inventoryNumber)
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
    URL.revokeObjectURL(url);
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
    
    const tableColumn = ["Nazev", "Ev.C.", "Kategorie", "Umisteni", "Stav", "Cena", "Spravce"];
    const tableRows = filteredAssets.map(asset => [
      normalize(asset.name),
      normalize(asset.inventoryNumber),
      normalize(asset.category),
      normalize(asset.location),
      normalize(asset.condition),
      `${asset.price} Kc`,
      normalize(asset.manager)
    ]);

    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [190, 18, 60] }, // SDH Primary Red
      styles: { fontSize: 9 },
    });

    doc.save(`sdh_majetek_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderContent = () => {
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
          />
        );
      }
    }

    if (viewMode === 'SETTINGS') {
      return (
        <Settings 
          managers={managers} setManagers={setManagers}
          locations={locations} setLocations={setLocations}
          categories={categories} setCategories={setCategories}
          conditions={conditions} setConditions={setConditions}
          onClose={() => setViewMode('LIST')}
          onExportBackup={handleBackupExport}
          onImportBackup={handleBackupImport}
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
            <button 
              onClick={() => setViewMode('FORM')}
              className="flex items-center px-4 py-2 bg-fire-600 text-white rounded-md hover:bg-fire-700 shadow-md transition-colors text-sm font-medium"
            >
              <IconPlus className="w-4 h-4 mr-2" /> Nový Majetek
            </button>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>
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
                              <img className="h-10 w-10 rounded object-contain" src={asset.imageUrl} alt="" />
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={(e) => onDeleteClick(e, asset)}
                          className="text-red-600 hover:text-red-900 p-2 relative z-10"
                          title="Smazat do koše"
                        >
                          <IconTrash className="w-5 h-5" />
                        </button>
                      </td>
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
      <header className="bg-fire-700 text-white shadow-lg no-print">
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
             <button 
              onClick={() => setViewMode('SETTINGS')}
              className="p-2 text-white hover:bg-fire-600 rounded-full transition-colors"
              title="Nastavení"
             >
                <IconSettings className="w-6 h-6" />
             </button>
             <div className="hidden md:block text-right">
               <span className="text-xs block opacity-70 uppercase tracking-wide">Přihlášen</span>
               <span className="text-sm font-medium">Admin</span>
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
              <div className="text-2xl font-bold text-gray-900 mt-1">{assets.length}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
              <div className="text-gray-500 text-sm font-medium uppercase">Vyžaduje údržbu</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">2 <span className="text-sm font-normal text-gray-400">(Simulováno)</span></div>
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
