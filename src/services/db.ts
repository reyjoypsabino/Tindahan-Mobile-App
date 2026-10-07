import * as SQLite from 'expo-sqlite';
import type { ImageSourcePropType } from 'react-native';

export interface DbProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_uri: string;
}

// Bundled sample photos (src/assets). Stored in image_uri as `asset:<key>`
// so they survive app updates; anything else in image_uri is a file URI
// from the camera / photo library.
const ASSET_IMAGES: Record<string, ImageSourcePropType> = {
  'prod-ligo': require('../assets/prod-ligo.jpg'),
  'prod-rice': require('../assets/prod-rice.jpg'),
  'prod-coke': require('../assets/prod-coke.jpg'),
  'prod-kopiko': require('../assets/prod-kopiko.jpg'),
  'prod-naturespring': require('../assets/prod-naturespring.jpg'),
};

export function imageSourceFor(imageUri: string): ImageSourcePropType | null {
  if (!imageUri) return null;
  if (imageUri.startsWith('asset:')) return ASSET_IMAGES[imageUri.slice('asset:'.length)] ?? null;
  return { uri: imageUri };
}

interface SeedDef {
  name: string;
  category: string;
  price: number;
  stock: number;
  asset: string;
  /** Names this sample had in earlier versions; migrated in place. */
  legacyNames: string[];
}

// Sample catalog matching the bundled product photos.
const SEEDS: SeedDef[] = [
  { name: 'Ligo Sardines 155g', category: 'Canned Goods', price: 25.0, stock: 36, asset: 'prod-ligo', legacyNames: [] },
  { name: 'Regular Milled Rice (per kg)', category: 'Rice/Grains', price: 55.0, stock: 25, asset: 'prod-rice', legacyNames: ['Mati Brown Rice (5kg)'] },
  { name: 'Coca-Cola 250ml', category: 'Beverages', price: 20.0, stock: 48, asset: 'prod-coke', legacyNames: [] },
  { name: 'Kopiko Brown Coffee Sachet', category: 'Coffee/Sachets', price: 4.0, stock: 60, asset: 'prod-kopiko', legacyNames: [] },
  { name: "Nature's Spring Water 500ml", category: 'Beverages', price: 15.0, stock: 30, asset: 'prod-naturespring', legacyNames: [] },
];

// Sample rows from earlier versions with no photo counterpart.
const RETIRED_SAMPLES = ['Fresh Davao Bananas', 'Coconut Virgin Oil'];

let _db: SQLite.SQLiteDatabase | null = null;
let _initialized = false;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    // Lazily opened (not at import time) so a cold/slow emulator that hasn't
    // mounted native modules yet can't crash the whole app on first import.
    _db = SQLite.openDatabaseSync('pos_inventory.db');
  }
  return _db;
}

export function initDatabase(): void {
  if (_initialized) return;
  const db = getDb();
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      image_uri TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
  `);
  // Migration for databases created before image_uri existed.
  const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(products);');
  if (!columns.some((c) => c.name === 'image_uri')) {
    db.execSync(`ALTER TABLE products ADD COLUMN image_uri TEXT NOT NULL DEFAULT '';`);
  }

  const countRow = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM products;');
  const versionRow = db.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
  const schemaVersion = versionRow?.user_version ?? 0;

  if ((countRow?.count ?? 0) === 0) {
    // Fresh install: seed the photo-backed sample catalog.
    for (const s of SEEDS) {
      db.runSync(
        'INSERT INTO products (name, category, price, stock, image_uri) VALUES (?, ?, ?, ?, ?);',
        [s.name, s.category, s.price, s.stock, `asset:${s.asset}`],
      );
    }
  } else if (schemaVersion < 2) {
    // One-time refresh for databases seeded by earlier versions:
    // update earlier sample rows in place (user-added products are untouched),
    // attach bundled photos, and drop retired samples the user never modified
    // (still photo-less). Runs once so user deletions stay deleted.
    for (const s of SEEDS) {
      for (const legacy of s.legacyNames) {
        db.runSync(
          'UPDATE products SET name = ?, category = ?, price = ?, stock = ?, image_uri = ? WHERE name = ?;',
          [s.name, s.category, s.price, s.stock, `asset:${s.asset}`, legacy],
        );
      }
      const existing = db.getFirstSync<{ id: number }>('SELECT id FROM products WHERE name = ?;', [
        s.name,
      ]);
      if (!existing) {
        db.runSync(
          'INSERT INTO products (name, category, price, stock, image_uri) VALUES (?, ?, ?, ?, ?);',
          [s.name, s.category, s.price, s.stock, `asset:${s.asset}`],
        );
      } else {
        db.runSync('UPDATE products SET image_uri = ? WHERE name = ? AND image_uri = ?;', [
          `asset:${s.asset}`,
          s.name,
          '',
        ]);
      }
    }
    for (const retired of RETIRED_SAMPLES) {
      db.runSync('DELETE FROM products WHERE name = ? AND image_uri = ?;', [retired, '']);
    }
  }
  db.execSync(`PRAGMA user_version = 2;`);
  _initialized = true;
}

export function getProducts(search = ''): DbProduct[] {
  initDatabase();
  const db = getDb();
  if (search.trim() === '') {
    return db.getAllSync<DbProduct>('SELECT * FROM products ORDER BY id DESC;');
  }
  return db.getAllSync<DbProduct>('SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC;', [
    `%${search}%`,
  ]);
}

export function addProduct(
  name: string,
  category: string,
  price: number,
  stock: number,
  imageUri = '',
): void {
  initDatabase();
  getDb().runSync(
    'INSERT INTO products (name, category, price, stock, image_uri) VALUES (?, ?, ?, ?, ?);',
    [name, category, price, stock, imageUri],
  );
}

export function deleteProduct(id: number): void {
  initDatabase();
  getDb().runSync('DELETE FROM products WHERE id = ?;', [id]);
}

export function getProductById(id: number): DbProduct | null {
  initDatabase();
  return getDb().getFirstSync<DbProduct>('SELECT * FROM products WHERE id = ?;', [id]);
}

export function updateProductPrice(id: number, price: number): void {
  initDatabase();
  getDb().runSync('UPDATE products SET price = ? WHERE id = ?;', [price, id]);
}

export interface ProductUpdate {
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUri?: string;
}

export function updateProduct(id: number, p: ProductUpdate): void {
  initDatabase();
  if (p.imageUri === undefined) {
    getDb().runSync('UPDATE products SET name = ?, category = ?, price = ?, stock = ? WHERE id = ?;', [
      p.name,
      p.category,
      p.price,
      p.stock,
      id,
    ]);
  } else {
    getDb().runSync(
      'UPDATE products SET name = ?, category = ?, price = ?, stock = ?, image_uri = ? WHERE id = ?;',
      [p.name, p.category, p.price, p.stock, p.imageUri, id],
    );
  }
}

export function adjustStock(id: number, delta: number): void {
  initDatabase();
  getDb().runSync('UPDATE products SET stock = stock + ? WHERE id = ?;', [delta, id]);
}
