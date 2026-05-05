import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [attendance, setAttendance] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '',
    checkOut: '',
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Fetch attendance history
    fetchAttendanceHistory();

    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8081/api/activitylogs/activity/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.data) {
        // Map backend response to frontend format
        const mappedData = res.data.map(record => ({
          date: record.date,
          checkIn: record.login_time || '',
          checkOut: record.logout_time || '',
          status: record.logout_time ? 'present' : 'pending',
          working_hours: record.working_hours || ''
        }));
        setAttendanceHistory(mappedData);
      }
    } catch (err) {
      console.log('Error fetching attendance:', err);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const checkInTime = new Date().toLocaleTimeString();
      
      const res = await axios.post('http://localhost:8081/api/activitylogs/activity/login', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 201 || res.data) {
        setMessage('Check-in successful!');
        setAttendance({ ...attendance, checkIn: checkInTime });
        fetchAttendanceHistory();
      } else {
        setMessage(res.data?.message || 'Check-in failed');
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message || 
        'Error checking in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const checkOutTime = new Date().toLocaleTimeString();
      
      const res = await axios.post('http://localhost:8081/api/activitylogs/activity/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 200 || res.data) {
        setMessage('Check-out successful!');
        setAttendance({ ...attendance, checkOut: checkOutTime });
        fetchAttendanceHistory();
      } else {
        setMessage(res.data?.message || 'Check-out failed');
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message || 
        'Error checking out. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

 // For backend dates: "dd/mm/yyyy"
const formatBackendDate = (dateString) => {
  if (!dateString) return '-';

  const [day, month, year] = dateString.split('/');
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// For JS Date objects (currentTime)
const formatJSDate = (dateObj) => {
  if (!(dateObj instanceof Date)) return '-';

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};


  const getTodayAttendance = () => {
  const today = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

  return attendanceHistory.find(
    record => record.date === today
  );
};

  const todayRecord = getTodayAttendance();

  return (
    <div className="home-content">
      {/* Main Dashboard */}
      <div className="dashboard-main">
        {/* Time Display */}
        <div className="time-card">
          <div className="time-display">
            <div className="current-time">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="current-date">
             {formatJSDate(currentTime)}
            </div>
          </div>
        </div>

        {/* Attendance Actions */}
        <div className="attendance-actions">
          {message && (
            <div className={`alert-message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="action-buttons">
            <button
              className="btn-action btn-checkin"
              onClick={handleCheckIn}
              disabled={loading || todayRecord?.checkIn}
            >
              <span className="btn-icon">✓</span>
              <span className="btn-text">
                {todayRecord?.checkIn ? `Checked In: ${todayRecord.checkIn}` : 'Check In'}
              </span>
            </button>

            <button
              className="btn-action btn-checkout"
              onClick={handleCheckOut}
              disabled={loading || !todayRecord?.checkIn || todayRecord?.checkOut}
            >
              <span className="btn-icon">✗</span>
              <span className="btn-text">
                {todayRecord?.checkOut ? `Checked Out: ${todayRecord.checkOut}` : 'Check Out'}
              </span>
            </button>
          </div>

          {todayRecord && (
            <div className="today-summary">
              <h3>Today's Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Date:</span>
                  <span className="summary-value">{formatBackendDate(todayRecord.date)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Check In:</span>
                  <span className="summary-value">{todayRecord.checkIn || 'Not checked in'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Check Out:</span>
                  <span className="summary-value">{todayRecord.checkOut || 'Not checked out'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Status:</span>
                  <span className={`summary-value status-${todayRecord.status || 'pending'}`}>
                    {todayRecord.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="attendance-history">
        <h2 className="section-title">Attendance History</h2>
        <div className="history-table-container">
          {attendanceHistory.length === 0 ? (
            <div className="no-data">No attendance records found</div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record, index) => {
                  const today = new Date().toLocaleDateString('en-GB');
                  const recordDate = typeof record.date === 'string' ? record.date : new Date(record.date).toLocaleDateString('en-GB');
                  const isToday = recordDate === today;
                  return (
                    <tr key={index} className={isToday ? 'today-row' : ''}>
                      <td>{formatBackendDate(record.date)}</td>
                      <td>{record.checkIn || '-'}</td>
                      <td>{record.checkOut || '-'}</td>
                      <td>
                        <span className={`status-badge status-${record.status || 'pending'}`}>
                          {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {record.working_hours || (record.checkIn && record.checkOut
                          ? calculateHours(record.checkIn, record.checkOut)
                          : '-')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateHours(checkIn, checkOut) {
  const [inHour, inMin] = checkIn.split(':').map(Number);
  const [outHour, outMin] = checkOut.split(':').map(Number);
  const inMinutes = inHour * 60 + inMin;
  const outMinutes = outHour * 60 + outMin;
  const diffMinutes = outMinutes - inMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
}
