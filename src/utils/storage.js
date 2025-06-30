// Storage utility functions for managing user data

const STORAGE_KEY = 'checkin_record_data';

// Default data structure
const getDefaultData = () => ({
  sun: {
    streak: 0,
    rewardChances: 0,
    monthlyRewards: 0,
    todos: {},
    monthlyStreaks: {} // 儲存每個月的最高連續記錄
  },
  ola: {
    streak: 0,
    rewardChances: 0,
    monthlyRewards: 0,
    todos: {},
    monthlyStreaks: {} // 儲存每個月的最高連續記錄
  }
});

// Load user data from localStorage
export const loadUserData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const loadedData = data ? JSON.parse(data) : getDefaultData();
    
    // Ensure all users have the new properties (only process actual user objects)
    const userKeys = Object.keys(loadedData).filter(key => 
      typeof loadedData[key] === 'object' && 
      loadedData[key] !== null && 
      !Array.isArray(loadedData[key]) && 
      ['sun', 'ola'].includes(key)
    );
    
    userKeys.forEach(user => {
      if (!loadedData[user].monthlyRewards) {
        loadedData[user].monthlyRewards = 0;
      }
      if (!loadedData[user].monthlyStreaks) {
        loadedData[user].monthlyStreaks = {};
      }
    });
    
    return loadedData;
  } catch (error) {
    console.error('Error loading user data:', error);
    return getDefaultData();
  }
};

// Save user data to localStorage
export const saveUserData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

// Calculate completion rate for a given day
export const calculateCompletionRate = (todos) => {
  if (!todos || todos.length === 0) return 0;
  const completed = todos.filter(todo => todo.done).length;
  return Math.round((completed / todos.length) * 100);
};

// Get month key (YYYY-MM format) using GMT+8
export const getMonthKey = (date) => {
  const gmt8Date = getGMT8Date(date);
  const year = gmt8Date.getFullYear();
  const month = String(gmt8Date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Get all days in a month
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// Calculate current month streak for a user
export const calculateCurrentMonthStreak = (userData, user) => {
  const userTodos = userData[user]?.todos || {};
  const today = getGMT8Date();
  const currentMonthKey = getMonthKey(today);
  
  // Get all dates in current month that have todos
  const currentMonthDates = Object.keys(userTodos)
    .filter(date => date.startsWith(currentMonthKey))
    .sort((a, b) => new Date(a) - new Date(b));

  if (currentMonthDates.length === 0) return 0;

  let maxStreak = 0;
  let currentStreak = 0;
  
  // 檢查從月初到今天的每一天
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const todayDate = today.getDate();
  
  for (let day = 1; day <= todayDate; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const todos = userTodos[dateStr];
    
    if (todos && todos.length > 0) {
      const completionRate = calculateCompletionRate(todos);
      if (completionRate >= 80) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
};

// Calculate rewards based on monthly streak
export const calculateMonthlyRewards = (monthlyStreak, isFullMonthComplete = false) => {
  if (isFullMonthComplete) {
    return 15; // 整個月都連續打卡成功獲得15個獎勵
  }
  
  let rewards = 0;
  
  if (monthlyStreak >= 27) rewards = 10;
  else if (monthlyStreak >= 20) rewards = 7;
  else if (monthlyStreak >= 15) rewards = 5;
  else if (monthlyStreak >= 10) rewards = 3;
  else if (monthlyStreak >= 5) rewards = 1;
  
  return rewards;
};

// Check if user completed full month
export const isFullMonthComplete = (userData, user, year, month) => {
  const userTodos = userData[user]?.todos || {};
  const daysInMonth = getDaysInMonth(year, month);
  const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthKey}-${day.toString().padStart(2, '0')}`;
    const todos = userTodos[dateStr];
    
    if (!todos || todos.length === 0) return false;
    
    const completionRate = calculateCompletionRate(todos);
    if (completionRate < 80) return false;
  }
  
  return true;
};

// Process monthly settlement (call this at the end of each month)
export const processMonthlySettlement = (userData) => {
  const today = getGMT8Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthKey = getMonthKey(today);
  
  const updatedData = { ...userData };
  
  // Only process actual user objects, not metadata keys
  const userKeys = Object.keys(updatedData).filter(key => 
    typeof updatedData[key] === 'object' && 
    updatedData[key] !== null && 
    !Array.isArray(updatedData[key]) && 
    ['sun', 'ola'].includes(key)
  );
  
  userKeys.forEach(user => {
    const monthlyStreak = calculateCurrentMonthStreak(updatedData, user);
    const fullMonthComplete = isFullMonthComplete(updatedData, user, year, month);
    const monthlyRewards = calculateMonthlyRewards(monthlyStreak, fullMonthComplete);
    
    // 更新該用戶的月度紀錄
    if (!updatedData[user].monthlyStreaks) {
      updatedData[user].monthlyStreaks = {};
    }
    
    updatedData[user].monthlyStreaks[monthKey] = {
      streak: monthlyStreak,
      rewards: monthlyRewards,
      fullMonthComplete,
      settledAt: getGMT8Date().toISOString()
    };
    
    // 累積總獎勵
    updatedData[user].monthlyRewards = (updatedData[user].monthlyRewards || 0) + monthlyRewards;
    
    // 重置當前streak為新月份準備
    updatedData[user].streak = 0;
  });
  
  return updatedData;
};

// Calculate total accumulated rewards
export const getTotalRewards = (userData, user) => {
  const monthlyStreaks = userData[user]?.monthlyStreaks || {};
  
  // 計算所有已完成月份的獎勵總和
  const totalFromMonths = Object.values(monthlyStreaks)
    .reduce((sum, month) => sum + (month.rewards || 0), 0);
  
  // 計算當前月的潛在獎勵
  const currentMonthStreak = calculateCurrentMonthStreak(userData, user);
  const today = getGMT8Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const fullMonthComplete = isFullMonthComplete(userData, user, year, month);
  const currentMonthPotentialRewards = calculateMonthlyRewards(currentMonthStreak, fullMonthComplete);
  
  // 只使用計算出來的值，不使用可能損壞的舊 monthlyRewards 欄位
  return totalFromMonths + currentMonthPotentialRewards;
};

// Get current month progress
export const getCurrentMonthProgress = (userData, user) => {
  const currentStreak = calculateCurrentMonthStreak(userData, user);
  const today = getGMT8Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const fullMonthComplete = isFullMonthComplete(userData, user, year, month);
  const daysInMonth = getDaysInMonth(year, month);
  
  // Debug logging
  console.log('getCurrentMonthProgress debug:', {
    year,
    month,
    daysInMonth,
    currentDay: today.getDate()
  });
  
  return {
    currentStreak,
    potentialRewards: calculateMonthlyRewards(currentStreak, fullMonthComplete),
    fullMonthComplete,
    daysInMonth,
    currentDay: today.getDate()
  };
};

// Calculate current consecutive streak (from last break to today)
export const calculateCurrentStreak = (userData, user) => {
  const userTodos = userData[user]?.todos || {};
  const today = getGMT8Date();
  const todayStr = formatDate(today);
  
  // Get all dates that have todos, sorted from newest to oldest
  const allDates = Object.keys(userTodos)
    .sort((a, b) => new Date(b) - new Date(a));

  if (allDates.length === 0) return 0;

  let currentStreak = 0;
  let checkDate = new Date(today);
  
  // Start from today and go backwards day by day
  while (true) {
    const checkDateStr = formatDate(checkDate);
    const todos = userTodos[checkDateStr];
    const isToday = checkDateStr === todayStr;
    
    // If no todos for this date
    if (!todos || todos.length === 0) {
      // If this is today, skip it (don't break the streak yet, give user time to complete)
      if (isToday) {
        // Move to yesterday and continue
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      // If this is a past day, break the streak
      break;
    }
    
    // If completion rate is too low
    const completionRate = calculateCompletionRate(todos);
    if (completionRate < 80) {
      // If this is today, skip it (don't break the streak yet, give user time to complete)
      if (isToday) {
        // Move to yesterday and continue
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      // If this is a past day, break the streak
      break;
    }
    
    // This day counts towards the streak
    currentStreak++;
    
    // Move to the previous day
    checkDate.setDate(checkDate.getDate() - 1);
    
    // Safety check to prevent infinite loops (don't go back more than 365 days)
    if (currentStreak > 365) {
      break;
    }
  }
  
  return currentStreak;
};

// Legacy function - updated to use current streak instead of monthly streak
export const calculateStreak = (userData, user) => {
  return calculateCurrentStreak(userData, user);
};

// Legacy function - updated to use monthly rewards
export const calculateRewardChances = (streak) => {
  return calculateMonthlyRewards(streak);
};

// Get current date in GMT+8 timezone
export const getGMT8Date = (date = new Date()) => {
  // Convert to GMT+8 (UTC+8)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (8 * 3600000));
};

// Format date to YYYY-MM-DD using GMT+8 timezone
export const formatDate = (date) => {
  const gmt8Date = getGMT8Date(date);
  const year = gmt8Date.getFullYear();
  const month = String(gmt8Date.getMonth() + 1).padStart(2, '0');
  const day = String(gmt8Date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get detailed date string for display (includes specific date)
export const getDetailedDate = (date) => {
  const today = getGMT8Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const gmt8Date = getGMT8Date(date);
  const dateStr = formatDate(date);
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(yesterday);
  const tomorrowStr = formatDate(tomorrow);
  
  // Format for Traditional Chinese
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  const weekday = weekdays[gmt8Date.getDay()];
  const month = months[gmt8Date.getMonth()];
  const day = gmt8Date.getDate();
  const year = gmt8Date.getFullYear();
  
  const detailedDateStr = `${year}年${month}${day}日 (${weekday})`;
  
  if (dateStr === todayStr) {
    return {
      primary: '今天',
      secondary: detailedDateStr
    };
  }
  if (dateStr === yesterdayStr) {
    return {
      primary: '昨天',
      secondary: detailedDateStr
    };
  }
  if (dateStr === tomorrowStr) {
    return {
      primary: '明天',
      secondary: detailedDateStr
    };
  }
  
  return {
    primary: `${weekday} ${month}${day}日`,
    secondary: `${year}年${month}${day}日 (${weekday})`
  };
};

// Get date string for display
export const getDisplayDate = (date) => {
  const today = getGMT8Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateStr = formatDate(date);
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(yesterday);
  const tomorrowStr = formatDate(tomorrow);
  
  if (dateStr === todayStr) return '今天';
  if (dateStr === yesterdayStr) return '昨天';
  if (dateStr === tomorrowStr) return '明天';
  
  // Format for Traditional Chinese
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  const gmt8Date = getGMT8Date(date);
  const weekday = weekdays[gmt8Date.getDay()];
  const month = months[gmt8Date.getMonth()];
  const day = gmt8Date.getDate();
  
  return `${weekday} ${month}${day}日`;
};

// Debug and reset corrupted reward data
export const resetCorruptedRewards = (userData) => {
  const updatedData = { ...userData };
  
  // Reset corrupted monthlyRewards fields for all users
  ['sun', 'ola'].forEach(user => {
    if (updatedData[user]) {
      console.log(`Before reset - ${user} monthlyRewards:`, updatedData[user].monthlyRewards);
      console.log(`Before reset - ${user} monthlyStreaks:`, updatedData[user].monthlyStreaks);
      
      // Remove the potentially corrupted monthlyRewards field
      delete updatedData[user].monthlyRewards;
      
      // Clean up any invalid entries in monthlyStreaks
      if (updatedData[user].monthlyStreaks) {
        const validMonthlyStreaks = {};
        Object.entries(updatedData[user].monthlyStreaks).forEach(([monthKey, monthData]) => {
          if (monthData && typeof monthData === 'object' && monthData.rewards !== undefined) {
            validMonthlyStreaks[monthKey] = monthData;
          }
        });
        updatedData[user].monthlyStreaks = validMonthlyStreaks;
      }
      
      console.log(`After reset - ${user} total rewards:`, getTotalRewards(updatedData, user));
    }
  });
  
  return updatedData;
}; 