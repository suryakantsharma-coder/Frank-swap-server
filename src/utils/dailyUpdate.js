// import cron from 'node-cron';

// let currentValue = 0.26;
// let cronJob = null;

// export function updateValue() {
//   if (currentValue <= 1.026) {
//     currentValue += 0.019;
//     const timestamp = new Date().toISOString();
//     console.log(`[${timestamp}] Daily update executed - Value: ${currentValue}`);
//   } else {
//     if (cronJob) {
//       cronJob.stop();
//       console.log('Cron job stopped. price reached 1.026');
//     } else {
//       console.log('Cron job is running.');
//     }
//   }
//   return currentValue;
// }

// export function startDailyUpdater() {
//   cron.schedule('0 0 * * *', () => {
//     console.log('Running scheduled daily update...');
//     updateValue();
//   });

//   cronJob = cron.schedule('*/1 * * * * *', () => {
//     updateValue();
//     console.log('running a task every minute');
//   });

//   console.log('Running initial update...');
// }

// export function getCurrentValue() {
//   return currentValue;
// }

// export function setCurrentValue(value) {
//   currentValue = value;
//   console.log(`Value manually set to: ${currentValue}`);
// }

// export function triggerUpdate() {
//   console.log('Manually triggering update...');
//   return updateValue();
// }
