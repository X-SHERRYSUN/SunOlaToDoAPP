// Firebase Authentication Service
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './config';

// Simple password authentication for Sun/Ola users
export const signInWithUserPassword = async (username, password) => {
  const CORRECT_PASSWORD = process.env.REACT_APP_AUTH_PASSWORD || '20241227';
  const VALID_USERS = ['sun', 'ola'];

  try {
    console.log('Attempting login for username:', username);
    
    // Validate user and password
    if (!VALID_USERS.includes(username.toLowerCase())) {
      console.error('Invalid user:', username);
      return { user: null, error: 'Invalid user' };
    }

    if (password !== CORRECT_PASSWORD) {
      console.error('Incorrect password provided');
      return { user: null, error: 'Incorrect password' };
    }

    console.log('Password and username validated, attempting Firebase anonymous auth...');

    // Use anonymous authentication to get a Firebase user
    const userCredential = await signInAnonymously(auth);
    
    console.log('Firebase anonymous authentication successful:', userCredential.user.uid);
    
    // Store username in localStorage for persistence
    localStorage.setItem('customUsername', username.toLowerCase());
    
    // Add custom properties to identify the user
    const customUser = {
      ...userCredential.user,
      customUsername: username.toLowerCase(),
      displayName: username.charAt(0).toUpperCase() + username.slice(1)
    };

    console.log('Login successful for user:', username);
    return { user: customUser, error: null };
  } catch (error) {
    console.error('Firebase authentication error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return { user: null, error: error.message };
  }
};

// Get current custom username
export const getCurrentUsername = () => {
  // Try to get from localStorage first
  const storedUsername = localStorage.getItem('customUsername');
  if (storedUsername) {
    return storedUsername;
  }
  
  // Fallback to user object (though this won't persist across sessions)
  const user = auth.currentUser;
  return user?.customUsername || null;
};

// Sign up with email and password
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign in anonymously (for guest users)
export const signInAnonymous = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign out
export const logOut = async () => {
  try {
    // Clear custom username from localStorage
    localStorage.removeItem('customUsername');
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Listen to authentication state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // If user exists and we have a stored username, add it to the user object
      const storedUsername = localStorage.getItem('customUsername');
      if (storedUsername) {
        user.customUsername = storedUsername;
        user.displayName = storedUsername.charAt(0).toUpperCase() + storedUsername.slice(1);
      }
    }
    callback(user);
  });
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
}; 