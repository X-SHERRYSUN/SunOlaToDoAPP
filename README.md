# 打卡紀錄 (Check-in Record)

A React web app for tracking daily to-do lists and maintaining streak records for two users (Sun and Ola). **The app interface is now fully translated to Traditional Chinese (繁體中文).**

## 🚀 Features

- **Dual User System**: Support for two users (Sun & Ola) with separate data tracking
- **Secure Login**: Password-protected access (`20241227`)
- **Daily Task Management**: Add, edit, and track daily to-do lists
- **Private Tasks**: Mark tasks as private (visible only to the user)
- **Streak Tracking**: Automatic calculation of consecutive days with ≥80% task completion
- **Reward System**: 
  - Every 5-day streak = 2 reward chances
  - Every 10-day streak = 2 additional reward chances (cumulative)
- **Date Navigation**: Navigate between past, present, and future days
- **Local Storage**: All data persists locally in the browser
- **Mobile-Friendly**: Responsive design optimized for mobile devices

## 🛠️ Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:3000`

## 📱 Usage

### Login
1. Select your user (Sun or Ola)
2. Enter password: `20241227`
3. Click Login

### Dashboard Features
- **Streak Counter**: Shows current consecutive days with ≥80% completion
- **Reward Chances**: Displays earned reward opportunities
- **Date Navigation**: Use arrow buttons to navigate between days
- **Today's Tasks**: View and manage current day's to-do list

### Task Management
- **Add Tasks**: Type in the input field and click "Add" or press Enter
- **Mark Private**: Check the "Make this task private" box before adding
- **Complete Tasks**: Click checkboxes to mark tasks as done
- **Delete Tasks**: Use the delete button to remove tasks
- **Completion Rate**: Shows percentage of completed tasks

### Streak System
- **80% Rule**: Days with ≥80% task completion count toward streak
- **Consecutive Days**: Only consecutive days maintain the streak
- **Automatic Calculation**: Streak updates automatically when tasks are completed

### Reward System
- **5-Day Milestone**: Every 5 consecutive days = 2 reward chances
- **10-Day Milestone**: Every 10 consecutive days = 2 additional reward chances
- **Cumulative**: Rewards stack up as streaks continue

## 💾 Data Structure

```json
{
  "sun": {
    "streak": 7,
    "rewardChances": 4,
    "todos": {
      "2025-01-15": [
        {
          "id": 1642234567890,
          "text": "Study Spanish",
          "done": true,
          "private": true
        }
      ]
    }
  },
  "ola": {
    "streak": 3,
    "rewardChances": 0,
    "todos": {
      "2025-01-15": [
        {
          "id": 1642234567891,
          "text": "Workout",
          "done": false,
          "private": false
        }
      ]
    }
  }
}
```

## 🎨 Design Principles

- **Clean & Minimal**: Simple interface focused on functionality
- **Mobile-First**: Optimized for smartphone usage
- **User-Friendly**: Intuitive navigation and clear visual feedback
- **Accessibility**: Proper labels and contrast ratios
- **Performance**: Lightweight and fast loading

## 🔧 Technical Stack

- **React 18**: Modern React with hooks
- **Local Storage**: Browser-based data persistence
- **CSS3**: Custom responsive styling
- **Date Management**: Native JavaScript Date objects

## 📝 Future Enhancements

- Firebase integration for cross-device sync
- Task categories and tags
- Statistics and analytics
- Export functionality
- Push notifications
- Dark mode support

## 🐛 Troubleshooting

**Issue**: Data not persisting
- **Solution**: Check if browser localStorage is enabled

**Issue**: Login not working
- **Solution**: Ensure password is exactly `20241227`

**Issue**: App not loading
- **Solution**: Run `npm install` and `npm start`

## 📞 Support

For issues or questions, please check the browser console for error messages and ensure all dependencies are properly installed.

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/X-SHERRYSUN/reward-streaks-app.git
cd reward-streaks-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore Database
3. Copy the Firebase configuration from your project settings
4. Create a `.env` file in the root directory
5. Copy the contents from `.env.example` and fill in your Firebase credentials

### 4. Run the application
```bash
npm start
```

The app will open at `http://localhost:3000`

## Environment Variables

All Firebase configuration is handled through environment variables for security. See `.env.example` for required variables.

## Technologies Used

- React 18
- Firebase (Authentication, Firestore, Analytics)
- CSS3 for styling
- Local storage for offline functionality

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is for personal use. 