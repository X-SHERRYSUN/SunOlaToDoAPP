import React from 'react';
import { 
  calculateStreak, 
  calculateCurrentMonthStreak,
  calculateRewardChances, 
  calculateCompletionRate, 
  formatDate, 
  getDetailedDate,
  getCurrentMonthProgress,
  getTotalRewards,
  getGMT8Date
} from '../utils/storage';

const Overview = ({ userData, currentUser }) => {
  const currentDate = getGMT8Date();
  const currentDateStr = formatDate(currentDate);
  const users = ['sun', 'ola'];

  const getUserData = (user) => {
    const currentStreak = calculateStreak(userData, user);
    const monthlyStreak = calculateCurrentMonthStreak(userData, user);
    const userRewards = calculateRewardChances(currentStreak);
    const totalRewards = getTotalRewards(userData, user);
    const monthProgress = getCurrentMonthProgress(userData, user);
    const todos = userData?.[user]?.todos?.[currentDateStr] || [];
    const completionRate = calculateCompletionRate(todos);

    return {
      currentStreak: currentStreak,
      monthlyStreak: monthlyStreak,
      rewards: userRewards,
      totalRewards: totalRewards,
      monthProgress: monthProgress,
      todos: todos,
      completionRate: completionRate
    };
  };

  return (
    <div className="overview">


      <div className="users-comparison">
        {users.map(user => {
          const data = getUserData(user);
          const isCurrentUser = user === currentUser;
          
          return (
            <div key={user} className={`user-card ${isCurrentUser ? 'current-user' : ''}`}>
              <div className="user-header">
                <h2>{user.charAt(0).toUpperCase() + user.slice(1)}</h2>
                {isCurrentUser && <span className="you-badge">您</span>}
              </div>
              
              <div className="user-stats">
                <div className="stat">
                  <div className="stat-number">{data.currentStreak}</div>
                  <div className="stat-label">當前連續</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{data.monthlyStreak}</div>
                  <div className="stat-label">本月最高</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{data.totalRewards}</div>
                  <div className="stat-label">累積獎勵</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{data.completionRate}%</div>
                  <div className="stat-label">今日進度</div>
                </div>
              </div>

              {data.monthProgress && (
                <div className="monthly-progress-mini">
                  <div className="progress-mini-item">
                    📅 本月 {data.monthProgress.currentDay}/{data.monthProgress.daysInMonth} 天
                  </div>
                  <div className="progress-mini-item">
                    🎯 可獲得 {data.monthProgress.potentialRewards} 個獎勵
                  </div>
                  {data.monthProgress.fullMonthComplete && (
                    <div className="perfect-month-indicator">
                      🏆 完美月份達成！
                    </div>
                  )}
                </div>
              )}

              <div className="user-todos">
                <h3>{getDetailedDate(currentDate).primary} 的任務</h3>
                {data.todos.length === 0 ? (
                  <div className="no-tasks">這天沒有任務</div>
                ) : (
                  <div className="todo-overview-list">
                    {data.todos.map(todo => {
                      // Hide private tasks from other users
                      if (todo.private && user !== currentUser) {
                        return (
                          <div key={todo.id} className="todo-overview-item private-hidden">
                            <span className="private-task-placeholder">🔒 私人任務</span>
                          </div>
                        );
                      }
                      
                      return (
                        <div 
                          key={todo.id} 
                          className={`todo-overview-item ${todo.done ? 'completed' : ''} ${todo.private ? 'private' : ''}`}
                        >
                          <span className={`todo-status ${todo.done ? 'done' : 'pending'}`}>
                            {todo.done ? '✅' : '⏳'}
                          </span>
                          <span className="todo-overview-text">
                            {todo.text}
                          </span>
                          {todo.private && isCurrentUser && (
                            <span className="private-indicator">🔒</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default Overview; 