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
import { getCurrentUser, getCurrentUsername, getCurrentUserId } from './authService';

// Get user data from Firestore for specific user (each user has their own document)
export const getUserData = async (userId, username = null) => {
  try {
    const currentUsername = username || getCurrentUsername();
    const consistentUserId = getCurrentUserId();
    
    // Use the consistent user ID instead of Firebase UID for document reference
    const documentId = consistentUserId || userId;
    
    console.log('Getting user data for:', currentUsername, 'with document ID:', documentId);
    
    const userDocRef = doc(db, 'users', documentId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('User data loaded from Firestore:', data);
      return { data, error: null };
    } else {
      // Return default data if document doesn't exist
      const defaultData = getDefaultUserData(currentUsername);
      console.log('No existing data found, returning default data for:', currentUsername);
      return { data: defaultData, error: null };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return { data: null, error: error.message };
  }
};

// Save user data to Firestore for specific user (each user has their own document)
export const saveUserData = async (userId, userData, username = null) => {
  try {
    const currentUsername = username || getCurrentUsername();
    const consistentUserId = getCurrentUserId();
    
    // Use the consistent user ID instead of Firebase UID for document reference
    const documentId = consistentUserId || userId;
    
    console.log('Saving user data for:', currentUsername, 'to document ID:', documentId);
    
    const userDocRef = doc(db, 'users', documentId);
    
    // Each user only saves their own data structure
    const userSpecificData = {
      username: currentUsername,
      streak: userData.streak || 0,
      rewardChances: userData.rewardChances || 0,
      monthlyRewards: userData.monthlyRewards || 0,
      todos: userData.todos || {},
      monthlyStreaks: userData.monthlyStreaks || {},
      lastUpdated: serverTimestamp(),
      updatedBy: currentUsername
    };
    
    await setDoc(userDocRef, userSpecificData, { merge: true });
    console.log('User data saved successfully for:', currentUsername);
    
    return { error: null };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { error: error.message };
  }
};

// Update specific user data fields
export const updateUserData = async (userId, updates, username = null) => {
  try {
    const currentUsername = username || getCurrentUsername();
    const consistentUserId = getCurrentUserId();
    
    // Use the consistent user ID instead of Firebase UID for document reference
    const documentId = consistentUserId || userId;
    
    console.log('Updating user data for:', currentUsername, 'document ID:', documentId);
    
    const userDocRef = doc(db, 'users', documentId);
    
    const updateData = {
      ...updates,
      lastUpdated: serverTimestamp(),
      updatedBy: currentUsername
    };
    
    await updateDoc(userDocRef, updateData);
    console.log('User data updated successfully for:', currentUsername);
    
    return { error: null };
  } catch (error) {
    console.error('Error updating user data:', error);
    return { error: error.message };
  }
};

// Listen to real-time updates for specific user
export const listenToUserData = (userId, callback, username = null) => {
  const currentUsername = username || getCurrentUsername();
  const consistentUserId = getCurrentUserId();
  
  // Use the consistent user ID instead of Firebase UID for document reference
  const documentId = consistentUserId || userId;
  
  console.log('Setting up real-time listener for:', currentUsername, 'document ID:', documentId);
  
  const userDocRef = doc(db, 'users', documentId);
  
  return onSnapshot(userDocRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      console.log('Real-time update received for:', currentUsername, data);
      callback({ data, error: null });
    } else {
      const defaultData = getDefaultUserData(currentUsername);
      console.log('No document found, providing default data for:', currentUsername);
      callback({ data: defaultData, error: null });
    }
  }, (error) => {
    console.error('Error listening to user data:', error);
    callback({ data: null, error: error.message });
  });
};

// Function to get data for both users (for Overview page)
export const getBothUsersData = async () => {
  try {
    console.log('Getting data for both users for Overview page');
    
    // Get data for both Sun and Ola
    const sunDocRef = doc(db, 'users', 'user-streak-app-sun');
    const olaDocRef = doc(db, 'users', 'user-streak-app-ola');
    
    const [sunDoc, olaDoc] = await Promise.all([
      getDoc(sunDocRef),
      getDoc(olaDocRef)
    ]);
    
    const sunData = sunDoc.exists() ? sunDoc.data() : getDefaultUserData('sun');
    const olaData = olaDoc.exists() ? olaDoc.data() : getDefaultUserData('ola');
    
    // Return in the format expected by Overview component
    const combinedData = {
      sun: sunData,
      ola: olaData
    };
    
    console.log('Combined data for overview:', combinedData);
    return { data: combinedData, error: null };
  } catch (error) {
    console.error('Error getting both users data:', error);
    return { data: null, error: error.message };
  }
};

// Migrate localStorage data to Firestore
export const migrateLocalDataToCloud = async (localData) => {
  const user = getCurrentUser();
  const currentUsername = getCurrentUsername();
  
  if (!user || !currentUsername) {
    return { error: 'User not authenticated' };
  }

  try {
    console.log('Migrating local data to cloud for user:', currentUsername);
    
    // Check if cloud data already exists
    const { data: cloudData, error } = await getUserData(user.uid, currentUsername);
    
    if (error) {
      return { error };
    }

    // Extract the current user's data from local data
    const userLocalData = localData[currentUsername] || localData;
    
    // If cloud data is empty or default, migrate user's local data
    const isCloudDataEmpty = !cloudData || 
      (cloudData.streak === 0 && Object.keys(cloudData.todos || {}).length === 0);

    if (isCloudDataEmpty && userLocalData) {
      console.log('Migrating user data:', userLocalData);
      const result = await saveUserData(user.uid, userLocalData, currentUsername);
      return result;
    }

    return { error: null };
  } catch (error) {
    console.error('Error migrating local data:', error);
    return { error: error.message };
  }
};

// Default user data structure for a single user
const getDefaultUserData = (username) => ({
  username: username,
  streak: 0,
  rewardChances: 0,
  monthlyRewards: 0,
  todos: {},
  monthlyStreaks: {},
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
}); 