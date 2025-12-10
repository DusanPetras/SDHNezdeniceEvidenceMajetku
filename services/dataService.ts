
import { supabase } from './supabaseClient';
import { Asset } from '../types';

const ASSET_TABLE = 'assets';
const SETTINGS_TABLE = 'settings_lists';
const BUCKET_NAME = 'asset-images';

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
  const { data, error } = await supabase
    .from(ASSET_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
  return data.map(mapAssetFromDb);
};

export const createAsset = async (asset: Omit<Asset, 'id'>): Promise<Asset> => {
  let imageUrl = asset.imageUrl;

  // Upload image if provided as File
  if (asset.originalFile) {
    imageUrl = await uploadImage(asset.originalFile);
  }

  const dbData = mapAssetToDb({ ...asset, imageUrl });
  
  const { data, error } = await supabase
    .from(ASSET_TABLE)
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return mapAssetFromDb(data);
};

export const updateAsset = async (id: string, updates: Partial<Asset>): Promise<Asset> => {
  let imageUrl = updates.imageUrl;

  if (updates.originalFile) {
    imageUrl = await uploadImage(updates.originalFile);
  }

  const dbData = mapAssetToDb({ ...updates, imageUrl });

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
  const { error } = await supabase
    .from(ASSET_TABLE)
    .update({ is_deleted: true })
    .eq('id', id);
  if (error) throw error;
};

export const deleteAssetPermanent = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(ASSET_TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const restoreAsset = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(ASSET_TABLE)
    .update({ is_deleted: false })
    .eq('id', id);
  if (error) throw error;
};

// --- Settings Lists ---

export const fetchSettingsList = async (type: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('value')
    .eq('type', type);
  
  if (error) {
    console.error(`Error fetching ${type}:`, error);
    return [];
  }
  return data.map(item => item.value);
};

export const addSettingsItem = async (type: string, value: string): Promise<void> => {
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .insert({ type, value });
  if (error) throw error;
};

export const removeSettingsItem = async (type: string, value: string): Promise<void> => {
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .delete()
    .eq('type', type)
    .eq('value', value);
  if (error) throw error;
};

// --- Storage ---

const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
};
