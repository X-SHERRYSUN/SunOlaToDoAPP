import React from 'react';

const MonthlyHistory = ({ userData, currentUser }) => {
  const monthlyStreaks = userData?.[currentUser]?.monthlyStreaks || {};
  const monthKeys = Object.keys(monthlyStreaks).sort((a, b) => new Date(b) - new Date(a));

  const formatMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return `${year}年 ${monthNames[parseInt(month) - 1]}`;
  };

  const getStreakIcon = (streak) => {
    if (streak >= 27) return '👑';
    if (streak >= 20) return '🥇';
    if (streak >= 15) return '🥈';
    if (streak >= 10) return '🥉';
    if (streak >= 5) return '🏅';
    return '📅';
  };

  const getRewardBadge = (rewards, fullMonthComplete) => {
    if (fullMonthComplete) {
      return (
        <span className="reward-badge perfect-month">
          🏆 完美月份 ({rewards}個獎勵)
        </span>
      );
    }
    
    if (rewards > 0) {
      return (
        <span className="reward-badge has-rewards">
          🎁 {rewards}個獎勵
        </span>
      );
    }
    
    return (
      <span className="reward-badge no-rewards">
        💼 無獎勵
      </span>
    );
  };

  if (monthKeys.length === 0) {
    return (
      <div className="monthly-history">
        <h3>📊 月度歷史記錄</h3>
        <div className="no-history">
          <p>尚無月度記錄</p>
          <p className="help-text">完成本月打卡後將顯示歷史記錄</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monthly-history">
      <h3>📊 月度歷史記錄</h3>
      <div className="history-list">
        {monthKeys.map(monthKey => {
          const record = monthlyStreaks[monthKey];
          return (
            <div key={monthKey} className="history-item">
              <div className="month-header">
                <span className="month-icon">{getStreakIcon(record.streak)}</span>
                <span className="month-name">{formatMonthDisplay(monthKey)}</span>
                {getRewardBadge(record.rewards, record.fullMonthComplete)}
              </div>
              
              <div className="month-stats">
                <div className="stat-item">
                  <span className="stat-label">最高連續：</span>
                  <span className="stat-value">{record.streak} 天</span>
                </div>
                
                {record.fullMonthComplete && (
                  <div className="perfect-indicator">
                    ✨ 整個月都成功打卡！
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="history-summary">
        <h4>📈 總計統計</h4>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-label">總月份數：</span>
            <span className="summary-value">{monthKeys.length} 個月</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">完美月份：</span>
            <span className="summary-value">
              {monthKeys.filter(key => monthlyStreaks[key].fullMonthComplete).length} 個月
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">總獲得獎勵：</span>
            <span className="summary-value">
              {monthKeys.reduce((sum, key) => sum + monthlyStreaks[key].rewards, 0)} 個
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">平均連續天數：</span>
            <span className="summary-value">
              {monthKeys.length > 0 
                ? Math.round(monthKeys.reduce((sum, key) => sum + monthlyStreaks[key].streak, 0) / monthKeys.length)
                : 0
              } 天
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyHistory; 