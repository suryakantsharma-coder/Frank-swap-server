// storage.js
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON file
const DATA_FILE = './src/database/token-manager.json';

/**
 * Ensure file exists, if not create with empty JSON object
 */
async function ensureFileExists() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2));
  }
}

/**
 * Read entire JSON file safely
 */
async function readData() {
  await ensureFileExists();
  try {
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    console.log(`✅ Read data.json: ${rawData}`);
    return JSON.parse(rawData || '{}');
  } catch (err) {
    console.error('Error reading JSON file, recreating...', err);
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2));
    return {};
  }
}

/**
 * Write entire JSON object to file
 */
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function setIncrementTokenCount(count) {
  const data = await readData();
  const pre = parseFloat(data['tokenCount']) || 0;
  data['tokenCount'] = pre + parseFloat(count);
  await writeData(data);
}

/**
 * Set a key-value pair
 */
export async function setValue(key, value) {
  const data = await readData();
  data[key] = value;
  await writeData(data);
  console.log(`✅ Saved: ${key} = ${value}`);
}

/**
 * Get a value by key
 */
export async function getValue(key) {
  const data = await readData();
  console.log(data[key]);
  return data[key] || null;
}
