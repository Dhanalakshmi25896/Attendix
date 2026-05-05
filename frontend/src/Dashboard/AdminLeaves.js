import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8081';

export default function AdminLeaves({ onUpdate }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/leaves/leaves`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setLeaves(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    await updateLeaveStatus(leaveId, 'approved');
  };

  const handleReject = async (leaveId) => {
    await updateLeaveStatus(leaveId, 'rejected');
  };

  const updateLeaveStatus = async (leaveId, status) => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE}/api/leaves/leave/${leaveId}`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setMessage(`Leave ${status} successfully!`);
      setTimeout(() => {
        setMessage('');
      }, 3000);
      fetchLeaves();
      // Trigger notification count update in parent
      if (onUpdate) {
        setTimeout(() => onUpdate(), 1000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || `Failed to ${status} leave`);
    } finally {
      setLoading(false);
    }
  };

  const voiceUrl = (path) =>
    path ? `${API_BASE}${path.startsWith('/') ? path : `/${path}`}` : null;

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  if (loading && leaves.length === 0) {
    return <div className="loading-container">Loading leave applications...</div>;
  }

  return (
    <div className="admin-leaves">
      <h2 className="section-title">Leave Approvals</h2>
      
      {message && (
        <div className={`alert-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {leaves.length === 0 ? (
        <div className="no-data">No leave applications found</div>
      ) : (
        <div className="leaves-table-container">
          <table className="leaves-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Total Days</th>
                <th>Leave Type</th>
                <th>Reason</th>
                <th>Voice</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.leave_id}>
                  <td>{leave.employee_name}</td>
                  <td>{new Date(leave.start_date).toLocaleDateString('en-US')}</td>
                  <td>{new Date(leave.end_date).toLocaleDateString('en-US')}</td>
                  <td>{leave.total_days} days</td>
                  <td>{leave.leave_type}</td>
                  <td className="leave-table-reason">
                    {leave.reason?.trim()
                      ? leave.reason
                      : leave.voice_note_path
                        ? '(Voice note only)'
                        : '—'}
                  </td>
                  <td>
                    {voiceUrl(leave.voice_note_path) ? (
                      <audio
                        controls
                        src={voiceUrl(leave.voice_note_path)}
                        className="leave-table-audio"
                        preload="metadata"
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(leave.status)}`}>
                      {leave.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {leave.status === 'pending' ? (
                      <div className="action-buttons-inline">
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(leave.leave_id)}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleReject(leave.leave_id)}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="action-completed">
                        {leave.approved_at 
                          ? `Processed on ${new Date(leave.approved_at).toLocaleDateString('en-US')}`
                          : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
