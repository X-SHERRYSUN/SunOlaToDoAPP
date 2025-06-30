import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { loadUserData, saveUserData, setupRealtimeListener, isCloudEnabled, migrateFromOldStructure } from './utils/cloudStorage';
import { onAuthChange, logOut, signInWithUserPassword } from './firebase/authService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [userData, setUserData] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeUnsubscribe, setRealtimeUnsubscribe] = useState(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // User is signed in to Firebase
        console.log('Firebase user signed in:', user.customUsername || 'Anonymous');
        
        // First, try to migrate any old user-specific data
        await migrateFromOldStructure();
        
        // Set up real-time listener for shared data  
        const realtimeUnsub = await setupRealtimeListener('shared', (data) => {
          console.log('Real-time shared data update received');
          setUserData(data);
        }, user.customUsername);
        
        // Clean up previous listener if exists
        if (realtimeUnsubscribe) {
          realtimeUnsubscribe();
        }
        setRealtimeUnsubscribe(() => realtimeUnsub);
        
        // Load initial shared data
        await loadUserDataAsync();
      } else {
        // User signed out, clean up real-time listener
        if (realtimeUnsubscribe) {
          realtimeUnsubscribe();
          setRealtimeUnsubscribe(null);
        }
      }
      
      setIsLoading(false);
    });

    // Check if user is already logged in locally
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
      loadUserDataAsync();
    } else {
      setIsLoading(false);
    }

    return () => {
      unsubscribe();
      if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - this should only run once on mount

  const loadUserDataAsync = async () => {
    try {
      const data = await loadUserData();
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleLogin = async (user, password) => {
    try {
      console.log('App.js handleLogin called with user:', user, 'password provided:', !!password);
      
      // Use the simple password authentication with Firebase
      if (password) {
        console.log('Attempting Firebase authentication...');
        const result = await signInWithUserPassword(user, password);
        
        console.log('Firebase authentication result:', result);
        
        if (result.error) {
          console.error('Firebase authentication failed:', result.error);
          throw new Error(result.error);
        }
        
        console.log('Setting Firebase user:', result.user.uid);
        setFirebaseUser(result.user);
      }
      
      console.log('Setting current user and login state');
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('currentUser', user);
      
      // If user is authenticated with Firebase, the real-time listener will handle data loading
      // Otherwise, load from local storage
      if (!firebaseUser && !password) {
        console.log('Loading user data from local storage');
        await loadUserDataAsync();
      }
      
      console.log('Login completed successfully');
    } catch (error) {
      console.error('Login error in App.js:', error);
      throw error; // Re-throw to be caught by Login component
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    localStorage.removeItem('currentUser');
    setUserData(null);
    
    // Clean up real-time listener
    if (realtimeUnsubscribe) {
      realtimeUnsubscribe();
      setRealtimeUnsubscribe(null);
    }
    
    // Also sign out from Firebase if signed in
    if (firebaseUser) {
      await logOut();
    }
  };

  const updateUserData = async (newDataOrUpdater) => {
    console.log('App updateUserData called:');
    console.log('- currentUser:', currentUser);
    console.log('- input type:', typeof newDataOrUpdater);
    
    let newData;
    
    if (typeof newDataOrUpdater === 'function') {
      // Handle functional update - we need to get the current state first
      const currentData = userData;
      console.log('- currentData before update:', currentData);
      newData = newDataOrUpdater(currentData);
      console.log('- newData after functional update:', newData);
    } else {
      // Handle direct data update
      newData = newDataOrUpdater;
      console.log('- newData direct update:', newData);
    }
    
    // Only update local state if we don't have a real-time listener active
    // If we have Firebase real-time listener, it will update the state when cloud save completes
    if (!firebaseUser) {
      setUserData(newData);
    }
    
    // Save to cloud/local storage
    console.log('- saving data to cloud/local storage:', newData);
    await saveUserData(newData);
    console.log('- data saved successfully');
  };

  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard 
          currentUser={currentUser}
          userData={userData}
          firebaseUser={firebaseUser}
          onLogout={handleLogout}
          onUpdateData={updateUserData}
          isCloudSyncEnabled={isCloudEnabled()}
        />
      )}
    </div>
  );
}

export default App; 