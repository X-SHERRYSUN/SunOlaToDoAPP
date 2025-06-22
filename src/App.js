import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import { loadUserData, saveUserData, syncData } from './utils/cloudStorage';
import { onAuthChange, getCurrentUser, logOut } from './firebase/authService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [userData, setUserData] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [showCloudAuth, setShowCloudAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // User is signed in to Firebase
        console.log('Firebase user signed in:', user.email || 'Anonymous');
        await syncData(); // Sync data when user signs in
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

    return () => unsubscribe();
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
    await loadUserDataAsync();
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    localStorage.removeItem('currentUser');
    setUserData(null);
    
    // Also sign out from Firebase if signed in
    if (firebaseUser) {
      await logOut();
    }
  };

  const updateUserData = async (newData) => {
    setUserData(newData);
    await saveUserData(newData);
  };

  const handleCloudAuthSuccess = async (user) => {
    setFirebaseUser(user);
    setShowCloudAuth(false);
    await syncData();
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