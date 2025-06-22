// Cloud Storage utility functions - combines localStorage with Firebase
import { getCurrentUser } from '../firebase/authService';
import { 
  getUserData as getFirestoreData, 
  saveUserData as saveFirestoreData,
  migrateLocalDataToCloud 
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

// Load user data (cloud first, fallback to local)
export const loadUserData = async () => {
  const user = getCurrentUser();
  
  if (user && navigator.onLine) {
    try {
      const { data: cloudData, error } = await getFirestoreData(user.uid);
      
      if (!error && cloudData) {
        // Also save to localStorage as backup
        saveLocalData(cloudData);
        return cloudData;
      }
    } catch (error) {
      console.warn('Failed to load cloud data, using local data:', error);
    }
  }
  
  // Fallback to localStorage
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
      const { error } = await saveFirestoreData(user.uid, data);
      if (error) {
        console.warn('Failed to save to cloud:', error);
      }
    } catch (error) {
      console.warn('Failed to save to cloud:', error);
    }
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
    const localData = loadLocalData();
    const result = await migrateLocalDataToCloud(localData);
    
    if (!result.error) {
      // After successful migration, load fresh cloud data
      const { data: cloudData } = await getFirestoreData(user.uid);
      if (cloudData) {
        saveLocalData(cloudData);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    return { error: error.message };
  }
};

// Sync data between local and cloud
export const syncData = async () => {
  const user = getCurrentUser();
  if (!user || !navigator.onLine) return;
  
  try {
    const localData = loadLocalData();
    const { data: cloudData, error } = await getFirestoreData(user.uid);
    
    if (error) {
      console.warn('Failed to sync data:', error);
      return;
    }
    
    // Compare timestamps to determine which data is newer
    const localTimestamp = new Date(localData.lastUpdated || 0).getTime();
    const cloudTimestamp = new Date(cloudData.lastUpdated || 0).getTime();
    
    if (localTimestamp > cloudTimestamp) {
      // Local data is newer, upload to cloud
      await saveFirestoreData(user.uid, localData);
    } else if (cloudTimestamp > localTimestamp) {
      // Cloud data is newer, download to local
      saveLocalData(cloudData);
    }
  } catch (error) {
    console.warn('Sync failed:', error);
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