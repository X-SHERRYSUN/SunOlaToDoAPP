import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { loadUserData, saveUserData } from './utils/storage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
      setUserData(loadUserData());
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', user);
    setUserData(loadUserData());
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    localStorage.removeItem('currentUser');
    setUserData(null);
  };

  const updateUserData = (newData) => {
    setUserData(newData);
    saveUserData(newData);
  };

  return (
    <div className="app">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard 
          currentUser={currentUser}
          userData={userData}
          onLogout={handleLogout}
          onUpdateData={updateUserData}
        />
      )}
    </div>
  );
}

export default App; 