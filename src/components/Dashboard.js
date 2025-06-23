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
import { forceSyncFromCloud } from '../utils/cloudStorage';

const Dashboard = ({ currentUser, userData, firebaseUser, onLogout, onUpdateData, onShowCloudAuth, isCloudSyncEnabled }) => {
  const [currentDate, setCurrentDate] = useState(getGMT8Date());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [monthlyStreak, setMonthlyStreak] = useState(0);
  const [currentView, setCurrentView] = useState('personal'); // 'personal', 'overview', or 'history'
  const [totalRewards, setTotalRewards] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleForceSync = async () => {
    if (!firebaseUser || !navigator.onLine) return;
    
    setIsSyncing(true);
    try {
      const result = await forceSyncFromCloud();
      if (result.error) {
        console.error('Force sync failed:', result.error);
        alert('同步失敗: ' + result.error);
      } else {
        console.log('Force sync successful');
        if (result.data) {
          onUpdateData(result.data);
        }
        alert('資料同步成功！');
      }
    } catch (error) {
      console.error('Force sync error:', error);
      alert('同步過程中發生錯誤');
    } finally {
      setIsSyncing(false);
    }
  };

  if (currentView === 'overview') {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <button className="logout-btn" onClick={onLogout}>
              登出
            </button>
            {!firebaseUser && (
              <button className="cloud-sync-btn" onClick={onShowCloudAuth}>
                ☁️ 啟用雲端同步
              </button>
            )}
            {firebaseUser && (
              <div className="cloud-status-container">
                <div className={`cloud-status ${isCloudSyncEnabled ? 'online' : 'offline'}`}>
                  <div className="cloud-indicator"></div>
                  <span className="cloud-text">
                    {isCloudSyncEnabled ? '雲端同步中' : '離線模式'}
                  </span>
                  <small className="cloud-email">
                    {firebaseUser.email || '訪客'}
                  </small>
                </div>
                {isCloudSyncEnabled && (
                  <button 
                    className={`manual-sync-btn ${isSyncing ? 'syncing' : ''}`}
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    title="手動同步資料"
                  >
                    {isSyncing ? '🔄' : '↻'}
                  </button>
                )}
              </div>
            )}
          </div>
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
          <div className="header-left">
            <button className="logout-btn" onClick={onLogout}>
              登出
            </button>
            {!firebaseUser && (
              <button className="cloud-sync-btn" onClick={onShowCloudAuth}>
                ☁️ 啟用雲端同步
              </button>
            )}
            {firebaseUser && (
              <div className="cloud-status-container">
                <div className={`cloud-status ${isCloudSyncEnabled ? 'online' : 'offline'}`}>
                  <div className="cloud-indicator"></div>
                  <span className="cloud-text">
                    {isCloudSyncEnabled ? '雲端同步中' : '離線模式'}
                  </span>
                  <small className="cloud-email">
                    {firebaseUser.email || '訪客'}
                  </small>
                </div>
                {isCloudSyncEnabled && (
                  <button 
                    className={`manual-sync-btn ${isSyncing ? 'syncing' : ''}`}
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    title="手動同步資料"
                  >
                    {isSyncing ? '🔄' : '↻'}
                  </button>
                )}
              </div>
            )}
          </div>
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
        <div className="header-left">
          <button className="logout-btn" onClick={onLogout}>
            登出
          </button>
          {!firebaseUser && (
            <button className="cloud-sync-btn" onClick={onShowCloudAuth}>
              ☁️ 啟用雲端同步
            </button>
          )}
          {firebaseUser && (
            <div className="cloud-status-container">
              <div className={`cloud-status ${isCloudSyncEnabled ? 'online' : 'offline'}`}>
                <div className="cloud-indicator"></div>
                <span className="cloud-text">
                  {isCloudSyncEnabled ? '雲端同步中' : '離線模式'}
                </span>
                <small className="cloud-email">
                  {firebaseUser.email || '訪客'}
                </small>
              </div>
              {isCloudSyncEnabled && (
                <button 
                  className={`manual-sync-btn ${isSyncing ? 'syncing' : ''}`}
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  title="手動同步資料"
                >
                  {isSyncing ? '🔄' : '↻'}
                </button>
              )}
            </div>
          )}
        </div>
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