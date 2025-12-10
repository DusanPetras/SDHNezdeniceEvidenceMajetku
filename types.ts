
export enum AssetCondition {
  NEW = 'Nové',
  GOOD = 'Dobrý',
  WORN = 'Opotřebované',
  DAMAGED = 'Poškozené',
  RETIRED = 'K vyřazení'
}

export enum AssetCategory {
  VEHICLE = 'Vozidla',
  PROTECTIVE_GEAR = 'Ochranné pomůcky',
  HOSES = 'Hadice a armatury',
  TOOLS = 'Nářadí',
  ELECTRONICS = 'Elektronika',
  OTHER = 'Ostatní'
}

export enum AssetLocation {
  STATION_MAIN = 'Zbrojnice - Hlavní hala',
  STATION_OFFICE = 'Zbrojnice - Kancelář',
  STATION_LOCKER = 'Zbrojnice - Šatna',
  CAS_30 = 'Tatra 815 (CAS 30)',
  DA_TRANSIT = 'Ford Transit (DA)',
  WAREHOUSE = 'Sklad'
}

export interface Asset {
  id: string;
  name: string;
  category: string; 
  location: string; 
  condition: string; 
  purchaseDate: string;
  price: number;
  manager: string; 
  description: string;
  imageUrl: string; // Base64 string or URL
  inventoryNumber: string;
  maintenanceNotes?: string;
  isDeleted?: boolean;
  nextServiceDate?: string;
}

export interface Notification {
  assetId: string;
  assetName: string;
  date: string;
  type: 'WARNING' | 'DANGER'; // Warning = upcoming, Danger = overdue
  daysRemaining: number;
}

export type ViewMode = 'LIST' | 'GRID' | 'DETAIL' | 'FORM' | 'EDIT' | 'TRASH' | 'SETTINGS';

// --- Auth Types ---

export type UserRole = 'ADMIN' | 'READER';

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
}
