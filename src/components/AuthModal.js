import React, { useState } from 'react';
import { signIn, signUp, signInAnonymous } from '../firebase/authService';
import { migrateToCloud } from '../utils/cloudStorage';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        setError(result.error);
      } else {
        // Migrate local data to cloud
        await migrateToCloud();
        onAuthSuccess(result.user);
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInAnonymous();
      if (result.error) {
        setError(result.error);
      } else {
        onAuthSuccess(result.user);
      }
    } catch (error) {
      setError('Anonymous sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setIsSignUp(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>{isSignUp ? '註冊帳號' : '登入帳號'}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="auth-modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>電子郵件</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="auth-btn primary"
              disabled={loading}
            >
              {loading ? '處理中...' : (isSignUp ? '註冊' : '登入')}
            </button>
          </form>

          <div className="auth-divider">或</div>

          <button 
            className="auth-btn secondary"
            onClick={handleAnonymousSignIn}
            disabled={loading}
          >
            {loading ? '處理中...' : '訪客模式'}
          </button>

          <div className="auth-switch">
            {isSignUp ? (
              <p>
                已有帳號？
                <button 
                  className="link-btn" 
                  onClick={() => setIsSignUp(false)}
                  disabled={loading}
                >
                  登入
                </button>
              </p>
            ) : (
              <p>
                還沒有帳號？
                <button 
                  className="link-btn" 
                  onClick={() => setIsSignUp(true)}
                  disabled={loading}
                >
                  註冊
                </button>
              </p>
            )}
          </div>

          <div className="auth-info">
            <p><strong>雲端同步功能：</strong></p>
            <ul>
              <li>✅ 多裝置同步資料</li>
              <li>✅ 自動備份</li>
              <li>✅ 離線模式支援</li>
            </ul>
            <p><small>選擇訪客模式將只在本地儲存資料</small></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 