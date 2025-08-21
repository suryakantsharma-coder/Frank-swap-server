import cron from 'node-cron';
import fs from 'fs';

const DATA_FILE = './src/database/frankPrice.json';
let currentValue = 0.26;
let cronJob = null;

// ✅ Load saved value on startup (or create filse if missing)
function loadValue() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log({ data });
      if (data.value !== undefined) {
        currentValue = parseFloat(data.value);
        console.log(`Loaded saved value: ${currentValue}`);
      }
    } catch (err) {
      console.error('Error loading value.json:', err);
    }
  } else {
    console.log('value.json not found. Creating new file...');
    saveValue(); // ✅ create file with initial value
  }
}

// ✅ Save value to JSON file
function saveValue() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ value: currentValue }, null, 2));
  } catch (err) {
    console.error('Error saving value.json:', err);
  }
}

export function updateValue() {
  if (currentValue <= 1.001) {
    currentValue += 0.019;
    saveValue(); // ✅ persist after every updates
    console.log(`[${new Date().toISOString()}] Daily update executed - Value: ${currentValue}`);
  } else {
    if (cronJob) {
      cronJob.stop();
      console.log('Cron job stopped. Price reached 1.026');
    } else {
      console.log('Cron job is not running.');
    }
  }
  return currentValue;
}

export function startDailyUpdater() {
  cron.schedule('0 0 * * *', () => {
    console.log('⏱ Running scheduled update every minute...');
    updateValue();
  });

  console.log('Daily updater started...');
}

export function getCurrentValue() {
  return currentValue;
}

export function setCurrentValue(value) {
  currentValue = value;
  saveValue(); // ✅ persist manual changes
  console.log(`Value manually set to: ${currentValue}`);
}

export function triggerUpdate() {
  console.log('Manually triggering update...');
  return updateValue();
}

// ✅ Load or create value.json when module loads
loadValue();
