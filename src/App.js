import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import { loadUserData, saveUserData, syncData, setupRealtimeListener, isCloudEnabled, migrateFromOldStructure } from './utils/cloudStorage';
import { onAuthChange, logOut } from './firebase/authService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [userData, setUserData] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [showCloudAuth, setShowCloudAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeUnsubscribe, setRealtimeUnsubscribe] = useState(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // User is signed in to Firebase
        console.log('Firebase user signed in:', user.email || 'Anonymous');
        
        // First, try to migrate any old user-specific data
        await migrateFromOldStructure();
        
        // Set up real-time listener for this user's data
        const realtimeUnsub = await setupRealtimeListener(user.uid, (data) => {
          console.log('Real-time data update received:', data);
          setUserData(data);
        });
        
        // Clean up previous listener if exists
        if (realtimeUnsubscribe) {
          realtimeUnsubscribe();
        }
        setRealtimeUnsubscribe(() => realtimeUnsub);
        
        // Load initial data
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
  }, []);

  const loadUserDataAsync = async () => {
    try {
      const data = await loadUserData();
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleLogin = async (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', user);
    
    // If user is authenticated with Firebase, the real-time listener will handle data loading
    // Otherwise, load from local storage
    if (!firebaseUser) {
      await loadUserDataAsync();
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

  const updateUserData = async (newData) => {
    // Optimistically update local state for better UX
    setUserData(newData);
    
    // Save to cloud/local storage
    await saveUserData(newData);
  };

  const handleCloudAuthSuccess = async (user) => {
    setFirebaseUser(user);
    setShowCloudAuth(false);
    
    // First, try to migrate any old user-specific data
    await migrateFromOldStructure();
    
    // Set up real-time listener for the newly authenticated user
    const realtimeUnsub = await setupRealtimeListener(user.uid, (data) => {
      console.log('Real-time data update received:', data);
      setUserData(data);
    });
    
    // Clean up previous listener if exists
    if (realtimeUnsubscribe) {
      realtimeUnsubscribe();
    }
    setRealtimeUnsubscribe(() => realtimeUnsub);
    
    // Sync data after authentication
    await syncData();
    await loadUserDataAsync();
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
        <Login onLogin={handleLogin} onShowCloudAuth={() => setShowCloudAuth(true)} />
      ) : (
        <Dashboard 
          currentUser={currentUser}
          userData={userData}
          firebaseUser={firebaseUser}
          onLogout={handleLogout}
          onUpdateData={updateUserData}
          onShowCloudAuth={() => setShowCloudAuth(true)}
          isCloudSyncEnabled={isCloudEnabled()}
        />
      )}
      
      <AuthModal 
        isOpen={showCloudAuth}
        onClose={() => setShowCloudAuth(false)}
        onAuthSuccess={handleCloudAuthSuccess}
      />
    </div>
  );
}

export default App; 