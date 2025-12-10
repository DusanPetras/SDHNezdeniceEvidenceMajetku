
import { supabase } from './supabaseClient';
import { Asset } from '../types';

const ASSET_TABLE = 'assets';
const SETTINGS_TABLE = 'settings_lists';

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

export const createAsset = async (asset: Omit<Asset, 'id'>): Promise<Asset> => {
  if (!supabase) throw new Error("Supabase not configured");

  const dbData = mapAssetToDb(asset);
  
  const { data, error } = await supabase
    .from(ASSET_TABLE)
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return mapAssetFromDb(data);
};

export const updateAsset = async (id: string, updates: Partial<Asset>): Promise<Asset> => {
  if (!supabase) throw new Error("Supabase not configured");

  const dbData = mapAssetToDb(updates);

  const { data, error } = await supabase
    .from(ASSET_TABLE)
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapAssetFromDb(data);
};

export const deleteAssetSoft = async (id: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from(ASSET_TABLE)
    .update({ is_deleted: true })
    .eq('id', id);
  if (error) throw error;
};

export const deleteAssetPermanent = async (id: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from(ASSET_TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const restoreAsset = async (id: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from(ASSET_TABLE)
    .update({ is_deleted: false })
    .eq('id', id);
  if (error) throw error;
};

// --- Settings Lists ---

export const fetchSettingsList = async (type: string): Promise<string[]> => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('value')
    .eq('type', type);
  
  if (error) {
    return [];
  }
  return (data || []).map(item => item.value);
};

export const addSettingsItem = async (type: string, value: string): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .insert({ type, value });
  if (error) throw error;
};

export const removeSettingsItem = async (type: string, value: string): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .delete()
    .eq('type', type)
    .eq('value', value);
  if (error) throw error;
};

// --- Full Backup & Restore ---

export interface BackupData {
  timestamp: string;
  assets: Asset[];
  settings: {
    type: string;
    value: string;
  }[];
}

export const getFullBackup = async (): Promise<BackupData> => {
  if (!supabase) throw new Error("Supabase not configured");

  // 1. Fetch all assets (including deleted)
  const { data: assetsDb, error: assetsError } = await supabase
    .from(ASSET_TABLE)
    .select('*');
  
  if (assetsError) throw assetsError;
  const assets = (assetsDb || []).map(mapAssetFromDb);

  // 2. Fetch all settings
  const { data: settingsDb, error: settingsError } = await supabase
    .from(SETTINGS_TABLE)
    .select('type, value');

  if (settingsError) throw settingsError;

  return {
    timestamp: new Date().toISOString(),
    assets,
    settings: settingsDb || []
  };
};

export const restoreFullBackup = async (backup: BackupData): Promise<void> => {
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
    
    // Upsert = update if exists, insert if not
    const { error: assetsError } = await supabase
      .from(ASSET_TABLE)
      .upsert(assetsToInsert, { onConflict: 'id' });
    
    if (assetsError) throw assetsError;
  }
};
