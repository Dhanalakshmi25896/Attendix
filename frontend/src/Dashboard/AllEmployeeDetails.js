import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AllEmployeeDetails({ focusUserId, onFocusHandled }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  useEffect(() => {
    if (!focusUserId || employees.length === 0) return undefined;
    const el = document.getElementById(`employee-detail-card-${focusUserId}`);
    let timeoutId;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('employee-card--highlight');
      timeoutId = setTimeout(() => {
        el.classList.remove('employee-card--highlight');
        onFocusHandled?.();
      }, 2400);
    } else {
      onFocusHandled?.();
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [focusUserId, employees, onFocusHandled]);

  const fetchAllEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8081/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEmployees(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8081/api/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage('Employee deleted successfully!');
      fetchAllEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  if (loading && employees.length === 0) {
    return <div className="loading-container">Loading all employee details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="all-employee-details">
      <h2 className="section-title">All Employee Details</h2>
      
      {message && (
        <div className={`alert-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      {employees.length === 0 ? (
        <div className="no-data">No employees found</div>
      ) : (
        <div className="employees-grid">
          {employees.map((employee) => (
            <div
              key={employee.user_id || employee.employee_id}
              id={employee.user_id ? `employee-detail-card-${employee.user_id}` : undefined}
              className="employee-card"
            >
              <div className="employee-card-header">
                <h3>{employee.name || 'N/A'}</h3>
                <div className="employee-card-header-right">
                  <span className={`role-badge role-${employee.role_name?.toLowerCase() || 'employee'}`}>
                    {employee.role_name || 'Employee'}
                  </span>
                  <button
                    className="btn-delete-card"
                    onClick={() => handleDelete(employee.user_id, employee.name)}
                    disabled={loading}
                    title="Delete employee"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="employee-card-body">
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{employee.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Employee Code:</span>
                    <span className="detail-value">{employee.employee_code || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Position:</span>
                    <span className="detail-value">{employee.position || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{employee.department || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone Number:</span>
                    <span className="detail-value">{employee.phone_number || 'N/A'}</span>
                  </div>
                  {employee.manager_name && (
                    <div className="detail-item">
                      <span className="detail-label">Manager:</span>
                      <span className="detail-value">{employee.manager_name}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Joining Date:</span>
                    <span className="detail-value">
                      {employee.joining_date 
                        ? new Date(employee.joining_date).toLocaleDateString('en-US')
                        : 'N/A'}
                    </span>
                  </div>
                  {employee.relieving_date && (
                    <div className="detail-item">
                      <span className="detail-label">Relieving Date:</span>
                      <span className="detail-value">
                        {new Date(employee.relieving_date).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
