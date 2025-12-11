
import { supabase } from './supabaseClient';
import { Asset, ActivityLog } from '../types';

const ASSET_TABLE = 'assets';
const SETTINGS_TABLE = 'settings_lists';
const LOGS_TABLE = 'activity_logs';

// Helper to map DB columns (snake_case) to App types (camelCase)
const mapAssetFromDb = (dbAsset: any): Asset => ({
  id: dbAsset.id,
  name: dbAsset.name,
  category: dbAsset.category,
  location: dbAsset.location,
  condition: dbAsset.condition,
  purchaseDate: dbAsset.purchase_date,
  price: Number(dbAsset.price),
  manager: dbAsset.manager,
  description: dbAsset.description || '',
  imageUrl: dbAsset.image_url || '',
  inventoryNumber: dbAsset.inventory_number || '',
  maintenanceNotes: dbAsset.maintenance_notes || '',
  isDeleted: dbAsset.is_deleted,
  nextServiceDate: dbAsset.next_service_date || ''
});

// Helper to map App types to DB columns
const mapAssetToDb = (asset: Partial<Asset>) => {
  const dbObj: any = {};
  // Only map ID if it exists (for updates/restores)
  if (asset.id !== undefined) dbObj.id = asset.id;
  
  if (asset.name !== undefined) dbObj.name = asset.name;
  if (asset.category !== undefined) dbObj.category = asset.category;
  if (asset.location !== undefined) dbObj.location = asset.location;
  if (asset.condition !== undefined) dbObj.condition = asset.condition;
  if (asset.purchaseDate !== undefined) dbObj.purchase_date = asset.purchaseDate;
  if (asset.price !== undefined) dbObj.price = asset.price;
  if (asset.manager !== undefined) dbObj.manager = asset.manager;
  if (asset.description !== undefined) dbObj.description = asset.description;
  if (asset.imageUrl !== undefined) dbObj.image_url = asset.imageUrl;
  if (asset.inventoryNumber !== undefined) dbObj.inventory_number = asset.inventoryNumber;
  if (asset.maintenanceNotes !== undefined) dbObj.maintenance_notes = asset.maintenanceNotes;
  if (asset.isDeleted !== undefined) dbObj.is_deleted = asset.isDeleted;
  if (asset.nextServiceDate !== undefined) dbObj.next_service_date = asset.nextServiceDate || null;
  return dbObj;
};

// --- Logging ---

export const logActivity = async (username: string, action: string, details: string = '') => {
  if (!supabase) return;
  // Nahrazení českých znaků za Unicode sekvence pro bezpečné uložení
  const safeAction = action
    .replace(/ř/g, '\\u0159').replace(/Ř/g, '\\u0158')
    .replace(/č/g, '\\u010d').replace(/Č/g, '\\u010c')
    .replace(/š/g, '\\u0161').replace(/Š/g, '\\u0160')
    .replace(/ž/g, '\\u017e').replace(/Ž/g, '\\u017d')
    .replace(/ě/g, '\\u011b').replace(/Ě/g, '\\u011a')
    .replace(/á/g, '\\u00e1').replace(/Á/g, '\\u00c1')
    .replace(/í/g, '\\u00ed').replace(/Í/g, '\\u00cd')
    .replace(/é/g, '\\u00e9').replace(/É/g, '\\u00c9')
    .replace(/ů/g, '\\u016f').replace(/Ů/g, '\\u016e')
    .replace(/ú/g, '\\u00fa').replace(/Ú/g, '\\u00da')
    .replace(/ý/g, '\\u00fd').replace(/Ý/g, '\\u00dd')
    .replace(/ň/g, '\\u0148').replace(/Ň/g, '\\u0147')
    .replace(/ť/g, '\\u0165').replace(/Ť/g, '\\u0164')
    .replace(/ď/g, '\\u010f').replace(/Ď/g, '\\u010e');

  const safeDetails = details
    .replace(/ř/g, '\\u0159').replace(/Ř/g, '\\u0158')
    .replace(/č/g, '\\u010d').replace(/Č/g, '\\u010c')
    .replace(/š/g, '\\u0161').replace(/Š/g, '\\u0160')
    .replace(/ž/g, '\\u017e').replace(/Ž/g, '\\u017d')
    .replace(/ě/g, '\\u011b').replace(/Ě/g, '\\u011a')
    .replace(/á/g, '\\u00e1').replace(/Á/g, '\\u00c1')
    .replace(/í/g, '\\u00ed').replace(/Í/g, '\\u00cd')
    .replace(/é/g, '\\u00e9').replace(/É/g, '\\u00c9')
    .replace(/ů/g, '\\u016f').replace(/Ů/g, '\\u016e')
    .replace(/ú/g, '\\u00fa').replace(/Ú/g, '\\u00da')
    .replace(/ý/g, '\\u00fd').replace(/Ý/g, '\\u00dd')
    .replace(/ň/g, '\\u0148').replace(/Ň/g, '\\u0147')
    .replace(/ť/g, '\\u0165').replace(/Ť/g, '\\u0164')
    .replace(/ď/g, '\\u010f').replace(/Ď/g, '\\u010e');

  await supabase.from(LOGS_TABLE).insert({ 
    username, 
    action: safeAction, 
    details: safeDetails 
  });
};

export const fetchLogs = async (): Promise<ActivityLog[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(LOGS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100); 
    
  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
  
  // Helper funkce pro dekódování Unicode sekvencí zpět na znaky
  const decodeUnicode = (str: string) => {
    return str.replace(/\\u[\dA-F]{4}/gi, (match) => {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
  };
  
  return data.map((log: any) => ({
    id: log.id,
    createdAt: log.created_at,
    username: log.username,
    action: decodeUnicode(log.action),
    details: decodeUnicode(log.details || '')
  }));
};

// --- Assets ---

export const fetchAssets = async (): Promise<Asset[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(ASSET_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
  return (data || []).map(mapAssetFromDb);
};

export const createAsset = async (asset: Omit<Asset, 'id'>, username: string): Promise<Asset> => {
  if (!supabase) throw new Error("Supabase not configured");

  const dbData = mapAssetToDb(asset);
  
  const { data, error } = await supabase
    .from(ASSET_TABLE)
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  
  await logActivity(username, 'CREATE_ASSET', `Vytvo\u0159en majetek: ${asset.name} (${asset.inventoryNumber})`);
  
  return mapAssetFromDb(data);
};

export const updateAsset = async (id: string, updates: Partial<Asset>, username: string): Promise<Asset> => {
  if (!supabase) throw new Error("Supabase not configured");

  const dbData = mapAssetToDb(updates);

  const { data, error } = await supabase
    .from(ASSET_TABLE)
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  await logActivity(username, 'UPDATE_ASSET', `Upraven majetek ID: ${id}`);
  
  return mapAssetFromDb(data);
};

export const deleteAssetSoft = async (id: string, username: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from(ASSET_TABLE)
    .update({ is_deleted: true })
    .eq('id', id);
  if (error) throw error;
  
  await logActivity(username, 'DELETE_ASSET', `Smaz\u00e1n (soft) majetek ID: ${id}`);
};

// --- Settings Lists ---

export const fetchSettingsList = async (type: string): Promise<string[]> => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('value')
    .eq('type', type)
    .eq('is_active', true); // Fetch only active items
  
  if (error) {
    return [];
  }
  return (data || []).map(item => item.value);
};

export const addSettingsItem = async (type: string, value: string, username: string): Promise<void> => {
  if (!supabase) return;
  // Use UPSERT: insert new or update existing (even if inactive) to active
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .upsert({ type, value, is_active: true }, { onConflict: 'type, value' });

  if (error) throw error;
  
  await logActivity(username, 'ADD_SETTING', `P\u0159id\u00e1no do ${type}: ${value}`);
};

export const removeSettingsItem = async (type: string, value: string, username: string): Promise<void> => {
  if (!supabase) return;
  // Soft delete: update is_active to false instead of deleting row
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .update({ is_active: false })
    .eq('type', type)
    .eq('value', value);

  if (error) throw error;
  
  await logActivity(username, 'REMOVE_SETTING', `Odebr\u00e1no z ${type}: ${value}`);
};

// --- Full Backup & Restore ---

export interface BackupData {
  timestamp: string;
  assets: Asset[];
  settings: {
    type: string;
    value: string;
    is_active?: boolean;
  }[];
  logs?: ActivityLog[]; 
}

export const getFullBackup = async (username: string): Promise<BackupData> => {
  if (!supabase) throw new Error("Supabase not configured");

  // 1. Fetch all assets (including deleted)
  const { data: assetsDb, error: assetsError } = await supabase
    .from(ASSET_TABLE)
    .select('*');
  if (assetsError) throw assetsError;
  const assets = (assetsDb || []).map(mapAssetFromDb);

  // 2. Fetch all settings (including inactive)
  const { data: settingsDb, error: settingsError } = await supabase
    .from(SETTINGS_TABLE)
    .select('type, value, is_active');
  if (settingsError) throw settingsError;

  // 3. Fetch logs for backup
  const logs = await fetchLogs();

  await logActivity(username, 'EXPORT_BACKUP', 'Sta\u017eena kompletn\u00ed z\u00e1loha syst\u00e9mu');

  return {
    timestamp: new Date().toISOString(),
    assets,
    settings: settingsDb || [],
    logs
  };
};

export const restoreFullBackup = async (backup: BackupData, username: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase not configured");

  // 1. Restore Settings
  if (backup.settings && backup.settings.length > 0) {
    const { error: settingsError } = await supabase
      .from(SETTINGS_TABLE)
      .upsert(backup.settings, { onConflict: 'type, value', ignoreDuplicates: true });
    
    if (settingsError) throw settingsError;
  }

  // 2. Restore Assets
  if (backup.assets && backup.assets.length > 0) {
    const assetsToInsert = backup.assets.map(mapAssetToDb);
    const { error: assetsError } = await supabase
      .from(ASSET_TABLE)
      .upsert(assetsToInsert, { onConflict: 'id' });
    
    if (assetsError) throw assetsError;
  }
  
  await logActivity(username, 'RESTORE_BACKUP', `Obnovena z\u00e1loha z ${backup.timestamp}`);
};
