import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ActivityLogs() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8081/api/activitylogs/activity/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setActivityLogs(res.data || []);
    } catch (err) {
      console.log('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <div className="activity-logs-content">
      <h2 className="section-title">Activity Logs</h2>
      {loading ? (
        <div className="loading-container">Loading activity logs...</div>
      ) : activityLogs.length === 0 ? (
        <div className="no-data">No activity logs found</div>
      ) : (
        <div className="activity-logs-table-container">
          <table className="activity-logs-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Login Time</th>
                <th>Logout Time</th>
                <th>Working Hours</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
  {activityLogs.map((log, index) => (
    <tr key={index}>
      <td>{log.date ?? "-"}</td>
      <td>{log.login_time ?? "-"}</td>
      <td>{log.logout_time ?? "-"}</td>
      <td>{log.working_hours ?? "-"}</td>
      <td>{log.ip_address ?? "-"}</td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
