// Cloud Storage utility functions - combines localStorage with Firebase
import { getCurrentUser } from '../firebase/authService';
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

// Check if user is authenticated and online
export const isCloudEnabled = () => {
  return getCurrentUser() !== null && navigator.onLine;
};

// Set up real-time listener for user data
export const setupRealtimeListener = async (userId, callback) => {
  if (!userId || !navigator.onLine) {
    console.warn('Cannot set up realtime listener: user not authenticated or offline');
    return null;
  }

  try {
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
    });

    console.log('Real-time listener set up for user:', userId);
    return unsubscribe;
  } catch (error) {
    console.error('Failed to set up real-time listener:', error);
    return null;
  }
};

// Load user data (cloud first, fallback to local)
export const loadUserData = async () => {
  const user = getCurrentUser();
  
  if (user && navigator.onLine) {
    try {
      console.log('Loading data from cloud for user:', user.uid);
      const { data: cloudData, error } = await getFirestoreData(user.uid);
      
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
  
  // Always save to localStorage first (for offline support)
  saveLocalData(data);
  
  // Save to cloud if authenticated and online
  if (user && navigator.onLine) {
    try {
      console.log('Saving data to cloud for user:', user.uid);
      const { error } = await saveFirestoreData(user.uid, data);
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
      const { data: cloudData } = await getFirestoreData(user.uid);
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
    const { data: cloudData, error } = await getFirestoreData(user.uid);
    
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
      // Local data is newer, upload to cloud
      console.log('Local data is newer, uploading to cloud');
      await saveFirestoreData(user.uid, localData);
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
    const { data: cloudData, error } = await getFirestoreData(user.uid);
    
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