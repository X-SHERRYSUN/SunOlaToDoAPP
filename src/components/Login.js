import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const CORRECT_PASSWORD = '20241227';
  const USERS = ['sun', 'ola'];

  const getErrorMessage = (errorKey) => {
    const messages = {
      'Please select a user': '請選擇使用者',
      'Incorrect password': '密碼錯誤',
      'Invalid user': '無效的使用者',
      'Authentication failed. Please try again.': '驗證失敗，請重試'
    };
    return messages[errorKey] || errorKey;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedUser) {
      setError('Please select a user');
      setLoading(false);
      return;
    }

    if (password !== CORRECT_PASSWORD) {
      setError('Incorrect password');
      setLoading(false);
      return;
    }

    try {
      // Pass both user and password to enable Firebase authentication
      await onLogin(selectedUser, password);
    } catch (error) {
      console.error('Login error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
                disabled={loading}
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
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="login-btn"
          disabled={!selectedUser || !password || loading}
        >
          {loading ? '登入中...' : '登入'}
        </button>

        {error && <div className="error">{getErrorMessage(error)}</div>}
      </form>

      <div className="cloud-info">
        <p>✅ 自動雲端同步功能已啟用</p>
        <p><small>您的資料將自動備份至Firebase雲端，可在多個裝置間同步</small></p>
      </div>
    </div>
  );
};

export default Login; 