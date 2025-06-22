import React, { useState, useEffect } from 'react';
import TodoList from './TodoList';
import Overview from './Overview';
import MonthlyHistory from './MonthlyHistory';
import Calendar from './Calendar';
import { 
  calculateStreak, 
  calculateCurrentMonthStreak,
  formatDate, 
  getTotalRewards,
  processMonthlySettlement,
  getGMT8Date
} from '../utils/storage';

const Dashboard = ({ currentUser, userData, onLogout, onUpdateData }) => {
  const [currentDate, setCurrentDate] = useState(getGMT8Date());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [monthlyStreak, setMonthlyStreak] = useState(0);
  const [currentView, setCurrentView] = useState('personal'); // 'personal', 'overview', or 'history'

  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    if (userData && currentUser) {
      const userCurrentStreak = calculateStreak(userData, currentUser);
      const userMonthlyStreak = calculateCurrentMonthStreak(userData, currentUser);
      const total = getTotalRewards(userData, currentUser);
      
      setCurrentStreak(userCurrentStreak);
      setMonthlyStreak(userMonthlyStreak);
      setTotalRewards(total);
    }
  }, [userData, currentUser]);

  // Check if it's the last day of month and process settlement
  useEffect(() => {
    if (userData && currentUser) {
      const today = getGMT8Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // If tomorrow is a new month, process settlement
      if (tomorrow.getMonth() !== today.getMonth()) {
        const settledData = processMonthlySettlement(userData);
        onUpdateData(settledData);
      }
    }
  }, [userData, currentUser, onUpdateData]);



  const handleDateSelect = (date) => {
    setCurrentDate(date);
  };

  const isToday = formatDate(currentDate) === formatDate(getGMT8Date());
  const isFuture = currentDate > getGMT8Date();

  const updateTodos = (dateStr, todos) => {
    const newUserData = {
      ...userData,
      [currentUser]: {
        ...userData[currentUser],
        todos: {
          ...userData[currentUser].todos,
          [dateStr]: todos
        }
      }
    };
    onUpdateData(newUserData);
  };

  const currentDateStr = formatDate(currentDate);
  const currentTodos = userData?.[currentUser]?.todos?.[currentDateStr] || [];



  if (currentView === 'overview') {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <button className="logout-btn" onClick={onLogout}>
            登出
          </button>
          <div className="view-nav">
            <button 
              className={`view-btn ${currentView === 'personal' ? 'active' : ''}`}
              onClick={() => setCurrentView('personal')}
            >
              我的打卡
            </button>
            <button 
              className={`view-btn ${currentView === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentView('overview')}
            >
              瞧瞧妳的
            </button>
            <button 
              className={`view-btn ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentView('history')}
            >
              歷史記錄
            </button>
          </div>
        </div>
        <Overview userData={userData} currentUser={currentUser} />
      </div>
    );
  }

  if (currentView === 'history') {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <button className="logout-btn" onClick={onLogout}>
            登出
          </button>
          <div className="view-nav">
            <button 
              className={`view-btn ${currentView === 'personal' ? 'active' : ''}`}
              onClick={() => setCurrentView('personal')}
            >
              我的打卡
            </button>
            <button 
              className={`view-btn ${currentView === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentView('overview')}
            >
              瞧瞧妳的
            </button>
            <button 
              className={`view-btn ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentView('history')}
            >
              歷史記錄
            </button>
          </div>
        </div>
        <MonthlyHistory userData={userData} currentUser={currentUser} />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="logout-btn" onClick={onLogout}>
          登出
        </button>
        <div className="view-nav">
          <button 
            className={`view-btn ${currentView === 'personal' ? 'active' : ''}`}
            onClick={() => setCurrentView('personal')}
          >
            我的打卡
          </button>
                      <button 
              className={`view-btn ${currentView === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentView('overview')}
            >
              瞧瞧妳的
            </button>
                        <button 
              className={`view-btn ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentView('history')}
            >
              歷史記錄
            </button>
          </div>
          <h1>Sun&Ola打卡紀錄</h1>
        
        <div className="streak-info">
          <div>
            <div className="streak-number">{currentStreak}</div>
            <div className="streak-label">當前連續天數</div>
          </div>
          <div>
            <div className="streak-number">{monthlyStreak}</div>
            <div className="streak-label">本月最高連續</div>
          </div>
          <div className="rewards">
            <div className="rewards-number">{totalRewards}</div>
            <div className="rewards-label">累積獎勵</div>
          </div>
        </div>



        {/* Streak Calendar View */}
        <div className="calendar-section">
          <Calendar 
            userData={userData} 
            currentUser={currentUser} 
            selectedDate={currentDate}
            onDateSelect={handleDateSelect}
          />
        </div>
      </div>

      <TodoList
        todos={currentTodos}
        onUpdateTodos={(todos) => updateTodos(currentDateStr, todos)}
        isToday={isToday}
        isFuture={isFuture}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Dashboard; 