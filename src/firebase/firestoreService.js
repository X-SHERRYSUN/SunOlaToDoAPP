// Firestore Database Service
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUser } from './authService';

// Use a shared document ID for both users
const SHARED_DOC_ID = 'shared-reward-streaks';

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    // Use the shared document instead of user-specific document
    const userDocRef = doc(db, 'shared-data', SHARED_DOC_ID);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { data: userDoc.data(), error: null };
    } else {
      // Return default data if user document doesn't exist
      const defaultData = getDefaultCloudData();
      return { data: defaultData, error: null };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return { data: null, error: error.message };
  }
};

// Save user data to Firestore
export const saveUserData = async (userId, userData) => {
  try {
    // Use the shared document instead of user-specific document
    const userDocRef = doc(db, 'shared-data', SHARED_DOC_ID);
    await setDoc(userDocRef, {
      ...userData,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    return { error: null };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { error: error.message };
  }
};

// Update specific user data fields
export const updateUserData = async (userId, updates) => {
  try {
    // Use the shared document instead of user-specific document
    const userDocRef = doc(db, 'shared-data', SHARED_DOC_ID);
    await updateDoc(userDocRef, {
      ...updates,
      lastUpdated: serverTimestamp()
    });
    
    return { error: null };
  } catch (error) {
    console.error('Error updating user data:', error);
    return { error: error.message };
  }
};

// Listen to real-time updates
export const listenToUserData = (userId, callback) => {
  // Use the shared document instead of user-specific document
  const userDocRef = doc(db, 'shared-data', SHARED_DOC_ID);
  
  return onSnapshot(userDocRef, (doc) => {
    if (doc.exists()) {
      callback({ data: doc.data(), error: null });
    } else {
      callback({ data: getDefaultCloudData(), error: null });
    }
  }, (error) => {
    console.error('Error listening to user data:', error);
    callback({ data: null, error: error.message });
  });
};

// Migrate localStorage data to Firestore
export const migrateLocalDataToCloud = async (localData) => {
  const user = getCurrentUser();
  if (!user) {
    return { error: 'User not authenticated' };
  }

  try {
    // Check if cloud data already exists in the shared document
    const { data: cloudData, error } = await getUserData(user.uid);
    
    if (error) {
      return { error };
    }

    // If cloud data is empty or default, migrate local data
    const isCloudDataEmpty = !cloudData || 
      (cloudData.sun?.streak === 0 && cloudData.ola?.streak === 0 && 
       Object.keys(cloudData.sun?.todos || {}).length === 0 && 
       Object.keys(cloudData.ola?.todos || {}).length === 0);

    if (isCloudDataEmpty && localData) {
      const result = await saveUserData(user.uid, localData);
      return result;
    }

    return { error: null };
  } catch (error) {
    console.error('Error migrating local data:', error);
    return { error: error.message };
  }
};

// Default cloud data structure
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