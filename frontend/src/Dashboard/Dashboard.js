import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Logo from '../images/attendix-logo-white.png';
import Home from './Home';
import EmployeeDetails from './EmployeeDetails';
import Leave from './Leave';
import ActivityLogs from './ActivityLogs';
import AdminEmployees from './AdminEmployees';
import AdminLeaves from './AdminLeaves';
import AllEmployeeDetails from './AllEmployeeDetails';
import Notifications from './Notifications';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [employeeDetailFocusId, setEmployeeDetailFocusId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8081/api/notifications/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.log('Error fetching unread count:', err);
    }
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    setIsAdmin(userObj?.role?.toLowerCase() === 'admin');
    
    // Fetch unread notification count
    fetchUnreadCount();

    // Refresh when user returns to this tab (e.g. after leave rejected in another session)
    const onFocus = () => fetchUnreadCount();
    window.addEventListener("focus", onFocus);

    // Refresh notification count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [navigate, fetchUnreadCount]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNotifications]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleEmployeeDetailFocusHandled = useCallback(() => {
    setEmployeeDetailFocusId(null);
  }, []);

  const handleViewEmployeeDetailsFromTable = useCallback((userId) => {
    setEmployeeDetailFocusId(userId);
    setActiveView('all-employees');
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <Home />;
      case 'employee':
        return isAdmin ? (
          <AdminEmployees onViewEmployeeDetails={handleViewEmployeeDetailsFromTable} />
        ) : (
          <EmployeeDetails />
        );
      case 'all-employees':
        return (
          <AllEmployeeDetails
            focusUserId={employeeDetailFocusId}
            onFocusHandled={handleEmployeeDetailFocusHandled}
          />
        );
      case 'leave':
        return isAdmin ? <AdminLeaves onUpdate={fetchUnreadCount} /> : <Leave onUpdate={fetchUnreadCount} />;
      case 'activity':
        return <ActivityLogs />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <nav className="dashboard-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <img
              src={Logo}
              alt="Attendix"
              className="navbar-logo"
              width={440}
              height={96}
              decoding="sync"
            />
          </div>
          <div className="navbar-user">
            <span className="user-name">
              Welcome, {user?.name || user?.email || 'User'}
            </span>
            <div className="notification-bell-container" ref={notificationRef}>
              <button
                type="button"
                className="btn-notification"
                onClick={(e) => { e.stopPropagation(); setShowNotifications((prev) => !prev); }}
                title={unreadCount > 0 ? `${unreadCount} unread (leave requests & approvals)` : "Notifications"}
              >
                🔔
                <span className="notification-badge">
                  {unreadCount}
                </span>
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <Notifications 
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)} 
                    onUpdate={fetchUnreadCount}
                    isAdmin={isAdmin}
                    onNavigateToLeave={() => { setShowNotifications(false); setActiveView("leave"); }}
                  />
                </div>
              )}
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
              onClick={() => setActiveView('home')}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Home</span>
            </button>
            <button
              className={`nav-item ${activeView === 'employee' ? 'active' : ''}`}
              onClick={() => setActiveView('employee')}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">
                {isAdmin ? 'All Employees' : 'Employee Details'}
              </span>
            </button>
            {isAdmin && (
              <button
                className={`nav-item ${activeView === 'all-employees' ? 'active' : ''}`}
                onClick={() => setActiveView('all-employees')}
              >
                <span className="nav-icon">👥</span>
                <span className="nav-text">All Employee Details</span>
              </button>
            )}
            <button
              className={`nav-item ${activeView === 'leave' ? 'active' : ''}`}
              onClick={() => setActiveView('leave')}
            >
              <span className="nav-icon">📅</span>
              <span className="nav-text">
                {isAdmin ? 'Leave Approvals' : 'Leave'}
              </span>
            </button>
            <button
              className={`nav-item ${activeView === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveView('activity')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Activity Logs</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
