# Cross-Device Sync Troubleshooting Guide

## What was Fixed

The original issue was that your app was storing data locally on each device without properly syncing to Firebase Firestore. Here's what was implemented:

### 1. Real-time Data Synchronization
- Added real-time listeners that automatically sync data when changes occur on other devices
- Data now syncs in real-time without requiring page refresh

### 2. Enhanced Cloud Storage Logic
- Improved the sync mechanism to handle conflicts between local and cloud data
- Added proper migration of local data to cloud when signing in
- Better error handling and logging for debugging

### 3. User Interface Improvements
- Added cloud sync status indicators
- Manual sync button for troubleshooting
- Better feedback when sync operations succeed or fail

## How to Test the Fix

### Step 1: Setup Firebase Authentication
1. Make sure your Firebase environment variables are set in your Vercel deployment:
   ```
   REACT_APP_FIREBASE_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN
   REACT_APP_FIREBASE_PROJECT_ID
   REACT_APP_FIREBASE_STORAGE_BUCKET
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID
   REACT_APP_FIREBASE_APP_ID
   ```

2. Verify these variables are set in your Vercel dashboard under Settings > Environment Variables

### Step 2: Test Cross-Device Sync
1. **Device 1**: Login with your local account (sun/ola)
2. **Device 1**: Click "☁️ 啟用雲端同步" and authenticate with Firebase
3. **Device 1**: Add some todos and verify they appear
4. **Device 2**: Open the app and login with the same local account
5. **Device 2**: Authenticate with the same Firebase account
6. **Device 2**: You should see the todos from Device 1 appear automatically

### Step 3: Test Real-time Sync
1. Keep both devices open with the same account
2. On Device 1: Add a new todo
3. On Device 2: The new todo should appear within a few seconds without refreshing
4. On Device 2: Mark a todo as complete
5. On Device 1: The completion should appear automatically

## Troubleshooting Common Issues

### Issue 1: "Data not syncing between devices"
**Possible Causes:**
- Not authenticated with Firebase on both devices
- Network connectivity issues
- Firebase environment variables not set correctly

**Solutions:**
1. Check that both devices show "雲端同步中" status
2. Click the manual sync button (↻) to force sync
3. Check browser console for error messages
4. Verify Firebase environment variables in Vercel

### Issue 2: "Real-time sync not working"
**Possible Causes:**
- Firestore security rules blocking access
- Network connectivity issues
- Browser blocking real-time connections

**Solutions:**
1. Check browser console for WebSocket errors
2. Verify Firestore security rules allow authenticated users to read/write their own data
3. Try the manual sync button

### Issue 3: "Authentication not working"
**Possible Causes:**
- Firebase configuration errors
- Wrong environment variables
- CORS issues with Firebase Auth

**Solutions:**
1. Verify all Firebase environment variables are set correctly
2. Check Firebase console for authentication errors
3. Ensure your domain is added to Firebase Auth authorized domains

## Required Firestore Security Rules

Make sure your Firestore security rules allow authenticated users to access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Monitoring and Debugging

### Browser Console Logs
The app now provides detailed logging. Check the browser console for:
- "Loading data from cloud for user: [user-id]"
- "Real-time data update received"
- "Data saved to cloud successfully"

### Manual Sync Button
Use the manual sync button (↻) in the top right corner to:
- Force sync data from cloud
- Test if sync is working
- Troubleshoot sync issues

### Cloud Status Indicator
- **雲端同步中**: Connected and syncing
- **離線模式**: Not connected to Firebase or offline

## Additional Notes

1. **Data Migration**: When you first authenticate with Firebase, your local data will be migrated to the cloud automatically.

2. **Offline Support**: The app still works offline and will sync when you come back online.

3. **Conflict Resolution**: If data conflicts occur, the most recently updated data wins.

4. **Backup**: Local storage is still used as a backup, so you won't lose data even if cloud sync fails.

## Need Help?

If you're still experiencing issues:
1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Test the manual sync button
4. Check your network connectivity
5. Review the Firestore security rules

The app now provides much better logging and error messages to help diagnose sync issues.

## ⚠️ CRITICAL FIX: User Data Separation Issue (2024-12-27)

### Problem Discovered
A serious issue was found where user data was not properly separated between Sun and Ola accounts:

1. **Data Leakage**: When switching between user accounts on the same device, users could see each other's tasks
2. **Inconsistent Authentication**: Each login created a new random Firebase anonymous user ID, making data association unreliable
3. **Shared Document Storage**: All data was stored in a single shared Firestore document, causing privacy violations

### Root Cause
- The authentication system used `signInAnonymously()` which creates a new random user ID each time
- User identity was only stored in localStorage, not tied to consistent Firebase authentication
- Firestore used a shared document ID (`shared-reward-streaks`) for both users

### Fixes Implemented

#### 1. Consistent User Authentication
- **Before**: Random anonymous Firebase user IDs
- **After**: Deterministic user IDs based on username (`user-streak-app-sun`, `user-streak-app-ola`)
- **Code**: Updated `src/firebase/authService.js` with `getUserId()` function

#### 2. Separated Data Storage  
- **Before**: Single shared Firestore document
- **After**: Separate documents for each user in `users` collection
- **Code**: Completely rewrote `src/firebase/firestoreService.js`

#### 3. Data Format Conversion
- **Before**: Shared data structure with both users in one object
- **After**: Individual user data structures with conversion utilities
- **Code**: Added conversion functions in `src/utils/cloudStorage.js`

#### 4. Overview Page Fix
- **Before**: Used potentially contaminated local data  
- **After**: Explicitly loads both users' data from separate sources
- **Code**: Added `loadOverviewData()` and `getBothUsersData()` functions

### Security Improvements
- Each user now has their own isolated Firestore document
- Consistent user IDs prevent data cross-contamination
- Proper authentication state management prevents session bleeding

### Migration Strategy
- Existing data will be automatically migrated to the new structure
- Old shared documents will be preserved but not actively used
- Users will need to log out and log back in to get consistent user IDs

### Testing Required
1. **Cross-device testing**: Verify Ola's tasks on her phone are only visible to Ola
2. **Account switching**: Ensure no data leakage when switching users on same device  
3. **Sync verification**: Confirm real-time sync works with separated data
4. **Overview page**: Verify "瞧瞧妳的" page shows correct data for both users

## Previous Troubleshooting Information

### Firebase Configuration Status
✅ Firebase is properly configured
✅ Firestore rules allow authenticated read/write access  
✅ Authentication is working with custom username system

### Data Storage Structure (Updated)
Each user now has their own document in the `users` collection:
- Sun: `/users/user-streak-app-sun`
- Ola: `/users/user-streak-app-ola`

### Common Issues

#### Real-time Sync Not Working
**Symptoms:** Changes made on one device don't appear on another device
**Possible Causes:**
1. User not logged in to Firebase
2. Offline mode
3. Network connectivity issues
4. Firebase listener not properly set up

**Solutions:**
1. Check authentication status in console
2. Verify internet connection
3. Restart the app
4. Check browser console for error messages

#### Data Not Saving to Cloud
**Symptoms:** Data saves locally but doesn't sync to Firestore
**Possible Causes:**
1. Authentication expired
2. Firestore rules blocking writes
3. Network issues

**Solutions:**
1. Log out and log back in
2. Check browser developer tools for network errors
3. Verify Firestore rules allow write access

#### Offline Mode Issues
**Symptoms:** App not working without internet connection
**Current Status:** 
- ✅ Local storage works offline
- ✅ Data syncs when connection restored
- ✅ Graceful fallback to localStorage

#### Performance Issues
**Symptoms:** Slow loading or sync delays
**Optimizations:**
- Real-time listeners for immediate updates
- Local storage caching
- Batch operations for better performance

### Debug Commands

#### Check Current User Authentication
```javascript
// In browser console
console.log('Current user:', getCurrentUser());
console.log('Current username:', getCurrentUsername());
console.log('Current user ID:', getCurrentUserId());
```

#### Force Cloud Sync
```javascript
// In browser console  
forceSyncFromCloud().then(result => console.log('Sync result:', result));
```

#### Check Data Structure
```javascript
// In browser console
loadUserData().then(data => console.log('Current user data:', data));
loadOverviewData().then(data => console.log('Overview data:', data));
```

### Contact Information
If issues persist after trying these solutions, collect the following information:
1. Browser console errors
2. Steps to reproduce the issue  
3. Device and browser information
4. Whether the issue occurs on multiple devices

---
**Last Updated:** 2024-12-27
**Critical Update:** User data separation implemented 