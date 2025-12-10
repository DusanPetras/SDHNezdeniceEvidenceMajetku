import { Asset, AssetCategory, AssetCondition, AssetLocation } from './types';

export const INITIAL_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Tatra 815 CAS 30',
    category: AssetCategory.VEHICLE,
    location: AssetLocation.STATION_MAIN,
    condition: AssetCondition.GOOD,
    purchaseDate: '2015-05-12',
    price: 4500000,
    manager: 'Jan Novák',
    description: 'Cisternová automobilová stříkačka pro velkokapacitní hašení.',
    inventoryNumber: 'SDH-V-001',
    imageUrl: 'https://picsum.photos/800/600',
    maintenanceNotes: 'Pravidelná servisní prohlídka nutná v 10/2024.'
  },
  {
    id: '2',
    name: 'Přilba Gallet F1 XF',
    category: AssetCategory.PROTECTIVE_GEAR,
    location: AssetLocation.CAS_30,
    condition: AssetCondition.NEW,
    purchaseDate: '2023-01-15',
    price: 9500,
    manager: 'Petr Svoboda',
    description: 'Zásahová přilba pro hasiče, barva luminiscenční, zlatý štít.',
    inventoryNumber: 'SDH-O-042',
    imageUrl: 'https://picsum.photos/400/400'
  },
  {
    id: '3',
    name: 'Motorová pila Stihl MS 462',
    category: AssetCategory.TOOLS,
    location: AssetLocation.CAS_30,
    condition: AssetCondition.GOOD,
    purchaseDate: '2020-08-20',
    price: 28000,
    manager: 'Karel Dvořák',
    description: 'Profesionální motorová pila pro záchranné práce.',
    inventoryNumber: 'SDH-T-015',
    imageUrl: 'https://picsum.photos/400/401'
  },
  {
    id: '4',
    name: 'Hadice B75 Izolovaná',
    category: AssetCategory.HOSES,
    location: AssetLocation.WAREHOUSE,
    condition: AssetCondition.WORN,
    purchaseDate: '2018-03-10',
    price: 1800,
    manager: 'Jan Novák',
    description: 'Tlaková požární hadice, délka 20m.',
    inventoryNumber: 'SDH-H-105',
    imageUrl: 'https://picsum.photos/400/402'
  }
];

export const MOCK_MANAGERS = [
  'Jan Novák',
  'Petr Svoboda',
  'Karel Dvořák',
  'Milan Černý',
  'Lukáš Veselý'
];