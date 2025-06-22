import React, { useState } from 'react';
import { calculateCompletionRate, formatDate, getGMT8Date } from '../utils/storage';

const Calendar = ({ userData, currentUser, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(getGMT8Date());
  
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };
  
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get what day of week the month starts (0=Sunday, 1=Monday, etc.)
    // Convert to our format (0=Monday, 1=Tuesday, etc.)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };
  
  const getDayStatus = (day) => {
    if (!day) return 'empty';
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = formatDate(new Date(year, month, day));
    const today = formatDate(getGMT8Date());
    const selectedDateStr = selectedDate ? formatDate(selectedDate) : null;
    
    // Check if it's selected
    if (dateStr === selectedDateStr) return 'selected';
    
    // Check if it's today
    if (dateStr === today) return 'today';
    
    // Check if it's in the future
    if (new Date(dateStr) > getGMT8Date()) return 'future';
    
    // Check if user has todos for this day
    const todos = userData?.[currentUser]?.todos?.[dateStr] || [];
    
    if (todos.length === 0) return 'no-task';
    
    const completionRate = calculateCompletionRate(todos);
    
    if (completionRate >= 80) return 'success';
    return 'incomplete';
  };
  
  const getDayClass = (status) => {
    switch (status) {
      case 'selected': return 'calendar-day selected';
      case 'success': return 'calendar-day success';
      case 'today': return 'calendar-day today';
      case 'incomplete': return 'calendar-day incomplete';
      case 'no-task': return 'calendar-day no-task';
      case 'future': return 'calendar-day future';
      default: return 'calendar-day empty';
    }
  };

  const handleDayClick = (day) => {
    if (!day || !onDateSelect) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const newDate = new Date(year, month, day);
    onDateSelect(newDate);
  };
  
  const days = getDaysInMonth();
  
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}>
          ←
        </button>
        <h3 className="calendar-title">
          {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
        </h3>
        <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}>
          →
        </button>
      </div>
      
      <div className="calendar-grid">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const status = getDayStatus(day);
          return (
            <div
              key={index}
              className={getDayClass(status)}
              onClick={() => handleDayClick(day)}
              style={{ cursor: day ? 'pointer' : 'default' }}
            >
              {day || ''}
            </div>
          );
        })}
      </div>
      
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot success"></div>
          <span>成功打卡 (≥80%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot incomplete"></div>
          <span>未完成 (&lt;80%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot today"></div>
          <span>今天</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot selected"></div>
          <span>已選擇</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot no-task"></div>
          <span>無任務</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 