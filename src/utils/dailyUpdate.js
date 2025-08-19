import cron from 'node-cron';

let currentValue = 0.26;

export function updateValue() {
  currentValue += 0.019;

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Daily update executed - Value: ${currentValue}`);
  return currentValue;
}

export function startDailyUpdater() {
  cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled daily update...');
    updateValue();
  });

  console.log('Running initial update...');
  updateValue();
}

export function getCurrentValue() {
  return currentValue;
}

export function setCurrentValue(value) {
  currentValue = value;
  console.log(`Value manually set to: ${currentValue}`);
}

export function triggerUpdate() {
  console.log('Manually triggering update...');
  return updateValue();
}
