// Cloud Storage utility functions - combines localStorage with Firebase
import { getCurrentUser, getCurrentUsername } from '../firebase/authService';
import { 
  getUserData as getFirestoreData, 
  saveUserData as saveFirestoreData,
  migrateLocalDataToCloud,
  listenToUserData
} from '../firebase/firestoreService';
import { 
  loadUserData as loadLocalData, 
  saveUserData as saveLocalData,
  calculateCompletionRate,
  getMonthKey,
  getDaysInMonth,
  calculateCurrentMonthStreak,
  calculateMonthlyRewards,
  isFullMonthComplete,
  processMonthlySettlement,
  getTotalRewards,
  getCurrentMonthProgress,
  calculateCurrentStreak,
  calculateStreak,
  calculateRewardChances,
  getGMT8Date,
  formatDate,
  getDetailedDate,
  getDisplayDate
} from './storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Check if user is authenticated and online
export const isCloudEnabled = () => {
  return getCurrentUser() !== null && navigator.onLine;
};

// Set up real-time listener for user data
export const setupRealtimeListener = async (userId, callback, username = null) => {
  if (!userId || !navigator.onLine) {
    console.warn('Cannot set up realtime listener: user not authenticated or offline');
    return null;
  }

  try {
    const currentUsername = username || getCurrentUsername();
    const unsubscribe = listenToUserData(userId, ({ data, error }) => {
      if (error) {
        console.error('Real-time listener error:', error);
        return;
      }

      if (data) {
        // Save to localStorage as backup
        saveLocalData(data);
        // Call the callback with the updated data
        callback(data);
      }
    }, currentUsername);

    console.log('Real-time listener set up for user:', userId, 'username:', currentUsername);
    return unsubscribe;
  } catch (error) {
    console.error('Failed to set up real-time listener:', error);
    return null;
  }
};

// Load user data (cloud first, fallback to local)
export const loadUserData = async () => {
  const user = getCurrentUser();
  const username = getCurrentUsername();
  
  if (user && navigator.onLine) {
    try {
      console.log('Loading data from cloud for user:', user.uid, 'username:', username);
      const { data: cloudData, error } = await getFirestoreData(user.uid, username);
      
      if (!error && cloudData) {
        console.log('Cloud data loaded successfully');
        // Also save to localStorage as backup
        saveLocalData(cloudData);
        return cloudData;
      } else if (error) {
        console.warn('Error loading cloud data:', error);
      }
    } catch (error) {
      console.warn('Failed to load cloud data, using local data:', error);
    }
  }
  
  // Fallback to localStorage
  console.log('Loading data from localStorage');
  return loadLocalData();
};

// Save user data (both cloud and local)
export const saveUserData = async (data) => {
  const user = getCurrentUser();
  const username = getCurrentUsername();
  
  // Always save to localStorage first (for offline support)
  saveLocalData(data);
  
  // Save to cloud if authenticated and online
  if (user && navigator.onLine) {
    try {
      console.log('Saving data to cloud for user:', user.uid, 'username:', username);
      const { error } = await saveFirestoreData(user.uid, data, username);
      if (error) {
        console.warn('Failed to save to cloud:', error);
      } else {
        console.log('Data saved to cloud successfully');
      }
    } catch (error) {
      console.warn('Failed to save to cloud:', error);
    }
  } else {
    console.log('Data saved to localStorage only (user not authenticated or offline)');
  }
  
  return data;
};

// Update specific user data
export const updateUserData = async (updates) => {
  const currentData = await loadUserData();
  const updatedData = { ...currentData, ...updates };
  return await saveUserData(updatedData);
};

// Migrate localStorage data to cloud when user signs in
export const migrateToCloud = async () => {
  const user = getCurrentUser();
  if (!user) return { error: 'User not authenticated' };
  
  try {
    console.log('Migrating local data to cloud for user:', user.uid);
    const localData = loadLocalData();
    const result = await migrateLocalDataToCloud(localData);
    
    if (!result.error) {
      console.log('Migration successful');
      // After successful migration, load fresh cloud data
      const { data: cloudData } = await getFirestoreData(user.uid, getCurrentUsername());
      if (cloudData) {
        saveLocalData(cloudData);
      }
    } else {
      console.warn('Migration failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    return { error: error.message };
  }
};

// New function to migrate existing user-specific documents to shared document
export const migrateFromOldStructure = async () => {
  const user = getCurrentUser();
  if (!user || !navigator.onLine) {
    console.log('Migration skipped: user not authenticated or offline');
    return { error: 'User not authenticated or offline' };
  }
  
  try {
    console.log('Checking for old user-specific data to migrate...');
    
    // Try to get data from the old user-specific document structure
    const oldUserDocRef = doc(db, 'users', user.uid);
    const oldUserDoc = await getDoc(oldUserDocRef);
    
    if (oldUserDoc.exists()) {
      console.log('Found old user-specific data, migrating to shared document...');
      const oldData = oldUserDoc.data();
      
      // Get current shared data
      const { data: sharedData } = await getFirestoreData(user.uid, getCurrentUsername());
      
      // Merge old data with shared data
      const mergedData = mergeUserData(sharedData || getDefaultCloudData(), oldData);
      
      // Save to shared document
      await saveFirestoreData(user.uid, mergedData, getCurrentUsername());
      
      console.log('Migration completed successfully');
      return { data: mergedData, error: null };
    } else {
      console.log('No old user-specific data found');
      return { error: null };
    }
  } catch (error) {
    console.error('Migration from old structure failed:', error);
    return { error: error.message };
  }
};

// Default cloud data structure helper (moving it here since it's used in migration)
const getDefaultCloudData = () => ({
  sun: {
    streak: 0,
    rewardChances: 0,
    monthlyRewards: 0,
    todos: {},
    monthlyStreaks: {}
  },
  ola: {
    streak: 0,
    rewardChances: 0,
    monthlyRewards: 0,
    todos: {},
    monthlyStreaks: {}
  },
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
});

// Helper function to merge user data without overwriting other users
const mergeUserData = (cloudData, localData) => {
  const merged = { ...cloudData };
  
  // Merge each user's data separately to avoid conflicts
  for (const user of ['sun', 'ola']) {
    if (localData[user]) {
      merged[user] = {
        ...merged[user],
        ...localData[user],
        // Merge todos carefully - preserve all dates
        todos: {
          ...(merged[user]?.todos || {}),
          ...(localData[user]?.todos || {})
        },
        // Merge monthly streaks carefully
        monthlyStreaks: {
          ...(merged[user]?.monthlyStreaks || {}),
          ...(localData[user]?.monthlyStreaks || {})
        }
      };
    }
  }
  
  merged.lastUpdated = new Date().toISOString();
  return merged;
};

// Enhanced sync data between local and cloud
export const syncData = async () => {
  const user = getCurrentUser();
  if (!user || !navigator.onLine) {
    console.log('Sync skipped: user not authenticated or offline');
    return;
  }
  
  try {
    console.log('Syncing data for user:', user.uid);
    const localData = loadLocalData();
    const { data: cloudData, error } = await getFirestoreData(user.uid, getCurrentUsername());
    
    if (error) {
      console.warn('Failed to sync data:', error);
      return;
    }
    
    // If no cloud data exists, migrate local data
    if (!cloudData || Object.keys(cloudData).length === 0) {
      console.log('No cloud data found, migrating local data');
      await migrateLocalDataToCloud(localData);
      return;
    }
    
    // Compare timestamps to determine which data is newer
    const localTimestamp = new Date(localData.lastUpdated || 0).getTime();
    const cloudTimestamp = new Date(cloudData.lastUpdated || 0).getTime();
    
    if (localTimestamp > cloudTimestamp) {
      // Local data is newer, but we need to merge carefully to avoid overwriting other user's data
      console.log('Local data is newer, merging with cloud data');
      const mergedData = mergeUserData(cloudData, localData);
      await saveFirestoreData(user.uid, mergedData, getCurrentUsername());
      saveLocalData(mergedData);
    } else if (cloudTimestamp > localTimestamp) {
      // Cloud data is newer, download to local
      console.log('Cloud data is newer, downloading to local');
      saveLocalData(cloudData);
    } else {
      console.log('Data is in sync');
    }
  } catch (error) {
    console.warn('Sync failed:', error);
  }
};

// Force sync from cloud (useful for troubleshooting)
export const forceSyncFromCloud = async () => {
  const user = getCurrentUser();
  if (!user || !navigator.onLine) {
    return { error: 'User not authenticated or offline' };
  }
  
  try {
    console.log('Force syncing from cloud for user:', user.uid);
    const { data: cloudData, error } = await getFirestoreData(user.uid, getCurrentUsername());
    
    if (error) {
      return { error };
    }
    
    if (cloudData) {
      saveLocalData(cloudData);
      return { data: cloudData, error: null };
    }
    
    return { error: 'No cloud data found' };
  } catch (error) {
    console.error('Force sync failed:', error);
    return { error: error.message };
  }
};

// Export all the existing utility functions
export {
  calculateCompletionRate,
  getMonthKey,
  getDaysInMonth,
  calculateCurrentMonthStreak,
  calculateMonthlyRewards,
  isFullMonthComplete,
  processMonthlySettlement,
  getTotalRewards,
  getCurrentMonthProgress,
  calculateCurrentStreak,
  calculateStreak,
  calculateRewardChances,
  getGMT8Date,
  formatDate,
  getDetailedDate,
  getDisplayDate
}; 