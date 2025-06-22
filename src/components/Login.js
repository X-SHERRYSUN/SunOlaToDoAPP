import React, { useState } from 'react';

const Login = ({ onLogin, onShowCloudAuth }) => {
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');

  const CORRECT_PASSWORD = '20241227';
  const USERS = ['sun', 'ola'];

  const getErrorMessage = (errorKey) => {
    const messages = {
      'Please select a user': '請選擇使用者',
      'Incorrect password': '密碼錯誤'
    };
    return messages[errorKey] || errorKey;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (password !== CORRECT_PASSWORD) {
      setError('Incorrect password');
      return;
    }

    onLogin(selectedUser);
  };

  return (
    <div className="login-container">
      <h1>打卡紀錄</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>選擇使用者：</label>
          <div className="user-selection">
            {USERS.map(user => (
              <button
                key={user}
                type="button"
                className={`user-btn ${selectedUser === user ? 'active' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                {user.charAt(0).toUpperCase() + user.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">密碼：</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入密碼"
            required
          />
        </div>

        <button 
          type="submit" 
          className="login-btn"
          disabled={!selectedUser || !password}
        >
          登入
        </button>

        {error && <div className="error">{getErrorMessage(error)}</div>}
      </form>

      <div className="cloud-section">
        <div className="divider">
          <span>或</span>
        </div>
        <button 
          type="button" 
          className="cloud-btn"
          onClick={onShowCloudAuth}
        >
          <span>☁️</span>
          啟用雲端同步
        </button>
        <p className="cloud-info">
          使用雲端同步功能，資料將自動備份至雲端，可在多個裝置間同步
        </p>
      </div>
    </div>
  );
};

export default Login; 