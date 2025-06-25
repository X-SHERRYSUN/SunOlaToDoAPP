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
import { getCurrentUser, getCurrentUsername } from './authService';

// Use a consistent shared document ID that doesn't depend on user authentication
const SHARED_DOC_ID = 'sun-ola-shared-data';

// Get user data from Firestore for all users (always returns shared data)
export const getUserData = async (userId, username = null) => {
  try {
    console.log('Getting shared data from document:', SHARED_DOC_ID);
    const sharedDocRef = doc(db, 'shared-data', SHARED_DOC_ID);
    const sharedDoc = await getDoc(sharedDocRef);
    
    if (sharedDoc.exists()) {
      const data = sharedDoc.data();
      console.log('Retrieved shared data:', data);
      return { data, error: null };
    } else {
      console.log('No shared data found, returning default data');
      // Return default data if document doesn't exist
      const defaultData = getDefaultCloudData();
      return { data: defaultData, error: null };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return { data: null, error: error.message };
  }
};

// Save user data to Firestore (always save to shared document)
export const saveUserData = async (userId, userData, username = null) => {
  try {
    console.log('Saving data to shared document:', SHARED_DOC_ID);
    const sharedDocRef = doc(db, 'shared-data', SHARED_DOC_ID);
    const currentUsername = username || getCurrentUsername();
    
    console.log('Saving data for username:', currentUsername);
    console.log('Data to save:', userData);
    
    if (currentUsername && userData[currentUsername]) {
      // Update only the specific user's data
      const updateData = {
        [`${currentUsername}`]: userData[currentUsername],
        lastUpdated: serverTimestamp()
      };
      
      console.log('Updating specific user data:', updateData);
      await setDoc(sharedDocRef, updateData, { merge: true });
    } else {
      // Update full data structure
      console.log('Updating full data structure');
      await setDoc(sharedDocRef, {
        ...userData,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }
    
    console.log('Data saved successfully');
    return { error: null };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { error: error.message };
  }
};

// Update specific user data fields
export const updateUserData = async (userId, updates, username = null) => {
  try {
    console.log('Updating user data in shared document:', SHARED_DOC_ID);
    const sharedDocRef = doc(db, 'shared-data', SHARED_DOC_ID);
    const currentUsername = username || getCurrentUsername();
    
    console.log('Updating data for username:', currentUsername);
    console.log('Updates:', updates);
    
    if (currentUsername) {
      // Create nested update object for specific user
      const nestedUpdates = {};
      Object.keys(updates).forEach(key => {
        if (key !== 'lastUpdated') {
          nestedUpdates[`${currentUsername}.${key}`] = updates[key];
        }
      });
      nestedUpdates.lastUpdated = serverTimestamp();
      
      console.log('Applying nested updates:', nestedUpdates);
      await updateDoc(sharedDocRef, nestedUpdates);
    } else {
      await updateDoc(sharedDocRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    }
    
    console.log('User data updated successfully');
    return { error: null };
  } catch (error) {
    console.error('Error updating user data:', error);
    return { error: error.message };
  }
};

// Listen to real-time updates for shared data
export const listenToUserData = (userId, callback, username = null) => {
  console.log('Setting up listener for shared document:', SHARED_DOC_ID);
  const sharedDocRef = doc(db, 'shared-data', SHARED_DOC_ID);
  
  return onSnapshot(sharedDocRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      console.log('Real-time update received:', data);
      callback({ data, error: null });
    } else {
      console.log('No shared document found, using default data');
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
    console.log('Migrating local data to cloud');
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
      console.log('Migrating local data to cloud');
      const result = await saveUserData(user.uid, localData);
      return result;
    }

    console.log('Cloud data already exists, skipping migration');
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