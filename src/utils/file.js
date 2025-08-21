// // utils/txStore.js
// import fs from 'fs';
// import path from 'path';

// const storeFile = path.join(process.cwd(), 'transactions.json');

// if (!fs.existsSync(storeFile)) {
//   fs.writeFileSync(storeFile, JSON.stringify({}), 'utf8');
// }

// export function loadTxStore() {
//   return JSON.parse(fs.readFileSync(storeFile, 'utf8'));
// }

// export function saveTxStore(store) {
//   fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
// }

// export function storeTransaction(signature, data) {
//   const store = loadTxStore();

//   if (store[signature]) {
//     return { status: 'exists', message: 'Transaction already stored' };
//   }

//   store[signature] = data;
//   saveTxStore(store);

//   return { status: 'stored', message: 'Transaction stored successfully' };
// }

import fs from 'fs';
import path from 'path';

// Configuration
const TX_STORE_FILE = path.join(process.cwd(), './src/database/transactions.json');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Load transaction store with error handling
function loadTxStore() {
  try {
    // Check if file exists
    if (!fs.existsSync(TX_STORE_FILE)) {
      const initialStore = {};
      saveTxStore(initialStore);
      return initialStore;
    }

    // Read file
    const fileContent = fs.readFileSync(TX_STORE_FILE, 'utf8');

    // Check if file is empty
    if (!fileContent.trim()) {
      const initialStore = {};
      saveTxStore(initialStore);
      return initialStore;
    }

    // Parse JSON
    const store = JSON.parse(fileContent);

    // Validate that it's an object
    if (typeof store !== 'object' || store === null || Array.isArray(store)) {
      throw new Error('Invalid store format - not an object');
    }

    // console.log(`📊 Loaded ${Object.keys(store).length} transactions from store`);
    return store;
  } catch (error) {
    console.error('❌ Error loading transaction store:', error.message);

    // Try to backup corrupted file
    if (fs.existsSync(TX_STORE_FILE)) {
      try {
        ensureBackupDir();
        const backupName = `corrupted-${Date.now()}.json`;
        const backupPath = path.join(BACKUP_DIR, backupName);
        fs.copyFileSync(TX_STORE_FILE, backupPath);
      } catch (backupError) {
        console.error('Failed to backup corrupted file:', backupError.message);
      }
    }

    // Return empty store and reinitialize
    const freshStore = {};
    saveTxStore(freshStore);
    return freshStore;
  }
}

// Save transaction store with atomic write
function saveTxStore(store) {
  try {
    // Validate input
    if (typeof store !== 'object' || store === null || Array.isArray(store)) {
      throw new Error('Invalid store data - must be an object');
    }

    // Create temporary file for atomic write
    const tempFile = TX_STORE_FILE + '.tmp';
    const jsonData = JSON.stringify(store, null, 2);

    // Write to temporary file first
    fs.writeFileSync(tempFile, jsonData, 'utf8');

    // Atomic rename (prevents corruption during write)
    fs.renameSync(tempFile, TX_STORE_FILE);

    // console.log(`💾 Saved ${Object.keys(store).length} transactions to store`);
    return true;
  } catch (error) {
    console.error('❌ Error saving transaction store:', error.message);

    // Clean up temp file if it exists
    const tempFile = TX_STORE_FILE + '.tmp';
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError.message);
      }
    }

    return false;
  }
}

// Enhanced transaction storage function
export function storeTransaction(signature, data) {
  try {
    // Validate inputs
    if (!signature || typeof signature !== 'string') {
      return {
        status: 'error',
        message: 'Invalid signature - must be non-empty string',
      };
    }

    if (!data || typeof data !== 'object') {
      return {
        status: 'error',
        message: 'Invalid data - must be an object',
      };
    }

    // Load current store
    const store = loadTxStore();

    // Check if transaction already exists
    if (store[signature]) {
      return {
        status: 'exists',
        message: 'Transaction already stored',
        existingData: store[signature],
      };
    }

    // Add metadata
    const enhancedData = {
      ...data,
      signature,
      storedAt: new Date().toISOString(),
      version: '1.0',
    };

    // Store transaction
    store[signature] = enhancedData;

    // Save to file
    const saveResult = saveTxStore(store);

    if (saveResult) {
      console.log(`✅ Transaction ${signature} stored successfully`);
      return {
        status: 'stored',
        message: 'Transaction stored successfully',
        data: enhancedData,
      };
    } else {
      return {
        status: 'error',
        message: 'Failed to save transaction to file',
      };
    }
  } catch (error) {
    console.error('❌ Error in storeTransaction:', error.message);
    return {
      status: 'error',
      message: `Storage error: ${error.message}`,
    };
  }
}

// Get transaction by signature
export function getTransaction(signature) {
  try {
    if (!signature || typeof signature !== 'string') {
      return {
        status: 'error',
        message: 'Invalid signature',
      };
    }

    const store = loadTxStore();

    if (store[signature]) {
      return {
        status: 'found',
        data: store[signature],
      };
    } else {
      return {
        status: 'not_found',
        message: 'Transaction not found',
      };
    }
  } catch (error) {
    console.error('❌ Error getting transaction:', error.message);
    return {
      status: 'error',
      message: `Retrieval error: ${error.message}`,
    };
  }
}

// Get all transactions
export function getAllTransactions() {
  try {
    const store = loadTxStore();
    const transactions = Object.values(store);

    return {
      status: 'success',
      count: transactions.length,
      data: transactions,
    };
  } catch (error) {
    console.error('❌ Error getting all transactions:', error.message);
    return {
      status: 'error',
      message: `Retrieval error: ${error.message}`,
    };
  }
}

// Delete transaction
export function deleteTransaction(signature) {
  try {
    if (!signature || typeof signature !== 'string') {
      return {
        status: 'error',
        message: 'Invalid signature',
      };
    }

    const store = loadTxStore();

    if (!store[signature]) {
      return {
        status: 'not_found',
        message: 'Transaction not found',
      };
    }

    const deletedData = store[signature];
    delete store[signature];

    const saveResult = saveTxStore(store);

    if (saveResult) {
      console.log(`🗑️  Transaction ${signature} deleted`);
      return {
        status: 'deleted',
        message: 'Transaction deleted successfully',
        deletedData,
      };
    } else {
      return {
        status: 'error',
        message: 'Failed to save after deletion',
      };
    }
  } catch (error) {
    console.error('❌ Error deleting transaction:', error.message);
    return {
      status: 'error',
      message: `Deletion error: ${error.message}`,
    };
  }
}

// Clean up old transactions (optional utility)
export function cleanupOldTransactions(daysOld = 30) {
  try {
    const store = loadTxStore();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    const signatures = Object.keys(store);

    for (const signature of signatures) {
      const transaction = store[signature];
      if (transaction.storedAt && new Date(transaction.storedAt) < cutoffDate) {
        delete store[signature];
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      const saveResult = saveTxStore(store);
      if (saveResult) {
        console.log(`🧹 Cleaned up ${deletedCount} old transactions`);
        return {
          status: 'cleaned',
          deletedCount,
          message: `${deletedCount} old transactions removed`,
        };
      } else {
        return {
          status: 'error',
          message: 'Failed to save after cleanup',
        };
      }
    } else {
      return {
        status: 'no_action',
        message: 'No old transactions to clean up',
      };
    }
  } catch (error) {
    console.error('❌ Error cleaning up transactions:', error.message);
    return {
      status: 'error',
      message: `Cleanup error: ${error.message}`,
    };
  }
}

// Create backup of transaction store
export function backupTransactionStore() {
  try {
    ensureBackupDir();

    if (!fs.existsSync(TX_STORE_FILE)) {
      return {
        status: 'no_file',
        message: 'No transaction store to backup',
      };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `transactions-backup-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    fs.copyFileSync(TX_STORE_FILE, backupPath);

    console.log(`📋 Backup created: ${backupName}`);
    return {
      status: 'backed_up',
      backupPath,
      message: `Backup created successfully: ${backupName}`,
    };
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return {
      status: 'error',
      message: `Backup error: ${error.message}`,
    };
  }
}

// Usage example and testing

// console.log('🧪 Testing transaction storage...\n');

// // Test storing a transaction
// const testTransaction = {
//   amount: 100,
//   token: 'SOL',
//   recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
//   timestamp: Date.now(),
// };

// const signature = '5j7s2f2h3k4l5m6n7o8p9q1r2s3t4u5v6w7x8y9z';

// console.log('1. Storing transaction...');
// const storeResult = storeTransaction(signature, testTransaction);
// console.log('Result:', storeResult);

// console.log('\n2. Retrieving transaction...');
// const getResult = getTransaction(signature);
// console.log('Result:', getResult);

// console.log('\n3. Getting all transactions...');
// const allResult = getAllTransactions();
// console.log('Result:', allResult);

// console.log('\n4. Creating backup...');
// const backupResult = backupTransactionStore();
// console.log('Result:', backupResult);

// module.exports = {
//   loadTxStore,
//   saveTxStore,
//   storeTransaction,
//   getTransaction,
//   getAllTransactions,
//   deleteTransaction,
//   cleanupOldTransactions,
//   backupTransactionStore,
// };
