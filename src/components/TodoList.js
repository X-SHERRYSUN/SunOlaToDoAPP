import React, { useState } from 'react';
import { calculateCompletionRate } from '../utils/storage';

const TodoList = ({ todos, onUpdateTodos, isToday, isFuture, currentUser }) => {
  const [newTask, setNewTask] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const addTask = () => {
    if (!newTask.trim()) return;

    const newTodo = {
      id: Date.now() + Math.random(),
      text: newTask.trim(),
      done: false,
      private: isPrivate
    };

    onUpdateTodos([...todos, newTodo]);
    setNewTask('');
    setIsPrivate(false);
  };

  const toggleTask = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );
    onUpdateTodos(updatedTodos);
  };

  const deleteTask = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    onUpdateTodos(updatedTodos);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const completionRate = calculateCompletionRate(todos);
  const canEdit = isToday || isFuture; // Can edit today and future dates, but not past dates

  return (
    <div className="todo-section">
      <div className="todo-date-header">
        <h3>{isToday ? '今天的任務' : isFuture ? '未來的任務' : '過去的任務'}</h3>
        {!canEdit && <span className="readonly-hint">📖 只能查看，無法編輯</span>}
      </div>
      
      {canEdit && (
        <div className="add-todo">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="新增任務..."
          />
          <button onClick={addTask} className="add-btn">
            新增
          </button>
        </div>
      )}

      {canEdit && (
        <div className="private-toggle">
          <input
            type="checkbox"
            id="private-toggle"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          <label htmlFor="private-toggle">設為私人任務</label>
        </div>
      )}

      {todos.length === 0 ? (
        <div className="empty-state">
          <h3>尚無任務</h3>
          <p>
            {!canEdit 
              ? "這是過去的日期，無法編輯任務" 
              : "新增您的第一個任務開始使用！"
            }
          </p>
        </div>
      ) : (
        <>
          <div className="todo-list">
            {todos.map(todo => (
              <div 
                key={todo.id} 
                className={`todo-item ${todo.done ? 'completed' : ''} ${todo.private ? 'private' : ''}`}
              >
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={todo.done}
                  onChange={() => toggleTask(todo.id)}
                  disabled={!canEdit}
                />
                <span className={`todo-text ${todo.done ? 'completed' : ''}`}>
                  {todo.text}
                </span>
                {todo.private && (
                  <span className="private-badge">私人</span>
                )}
                {canEdit && (
                  <button 
                    onClick={() => deleteTask(todo.id)}
                    className="delete-btn"
                  >
                    刪除
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="completion-rate">
            <div className="rate">{completionRate}%</div>
            <div className="label">
              {completionRate >= 80 
                ? "🎉 太棒了！值得連續紀錄！" 
                : `還需完成 ${80 - completionRate}% 以維持連續紀錄`
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TodoList; 