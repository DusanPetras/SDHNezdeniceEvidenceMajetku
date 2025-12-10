
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
  category: string; // Changed from Enum to string to allow dynamic settings
  location: string; // Changed from Enum to string
  condition: string; // Changed from Enum to string
  purchaseDate: string;
  price: number;
  manager: string; 
  description: string;
  imageUrl: string;
  inventoryNumber: string;
  maintenanceNotes?: string;
}

export type ViewMode = 'LIST' | 'GRID' | 'DETAIL' | 'FORM' | 'EDIT' | 'TRASH' | 'SETTINGS';
