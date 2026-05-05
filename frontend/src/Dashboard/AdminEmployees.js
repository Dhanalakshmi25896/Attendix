import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8081';

const emptyNewEmployee = () => ({
  name: '',
  email: '',
  password: '',
  password_confirm: '',
  role: 'employee',
  employee_code: '',
  position: '',
  department: '',
  phone_number: '',
  manager_id: '',
  joining_date: '',
  relieving_date: '',
});

export default function AdminEmployees({ onViewEmployeeDetails }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState(() => emptyNewEmployee());

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEmployees(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setShowAddForm(false);
    setEditingEmployee(employee.user_id);
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      role: employee.role_name || '',
      employee_code: employee.employee_code || '',
      position: employee.position || '',
      department: employee.department || '',
      phone_number: employee.phone_number || '',
      manager_id: employee.manager_id || '',
      joining_date: employee.joining_date ? employee.joining_date.split('T')[0] : '',
      relieving_date: employee.relieving_date ? employee.relieving_date.split('T')[0] : ''
    });
  };

  const handleCancel = () => {
    setEditingEmployee(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE}/api/employees/${editingEmployee}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setMessage('Employee updated successfully!');
      setEditingEmployee(null);
      setFormData({});
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage('Employee deleted successfully!');
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const handleNewEmployeeChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewEmployee(emptyNewEmployee());
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (newEmployee.password !== newEmployee.password_confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    if (newEmployee.password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: newEmployee.name.trim(),
        email: newEmployee.email.trim(),
        password: newEmployee.password,
        role: newEmployee.role,
        employee_code: newEmployee.employee_code.trim() || undefined,
        position: newEmployee.position.trim() || undefined,
        department: newEmployee.department.trim() || undefined,
        phone_number: newEmployee.phone_number.trim() || undefined,
        manager_id: newEmployee.manager_id ? Number(newEmployee.manager_id) : undefined,
        joining_date: newEmployee.joining_date || undefined,
        relieving_date: newEmployee.relieving_date || undefined,
      };

      await axios.post(`${API_BASE}/api/employees`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage('Employee created successfully!');
      setShowAddForm(false);
      setNewEmployee(emptyNewEmployee());
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  if (loading && employees.length === 0) {
    return <div className="loading-container">Loading employees...</div>;
  }

  return (
    <div className="admin-employees">
      <div className="admin-employees-header">
        <h2 className="section-title">All Employees</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingEmployee(null);
            setFormData({});
            setShowAddForm((v) => {
              setNewEmployee(emptyNewEmployee());
              return !v;
            });
          }}
        >
          {showAddForm ? 'Cancel' : 'Add employee'}
        </button>
      </div>

      {message && (
        <div className={`alert-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="admin-add-employee-card">
          <h3>New employee</h3>
          <p className="admin-add-employee-hint">
            Creates a login account and employee profile. They can sign in with this email and password.
          </p>
          <form onSubmit={handleCreateEmployee} className="edit-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="new-emp-name">Name</label>
                <input
                  id="new-emp-name"
                  type="text"
                  name="name"
                  value={newEmployee.name}
                  onChange={handleNewEmployeeChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-email">Email</label>
                <input
                  id="new-emp-email"
                  type="email"
                  name="email"
                  value={newEmployee.email}
                  onChange={handleNewEmployeeChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-password">Password</label>
                <input
                  id="new-emp-password"
                  type="password"
                  name="password"
                  value={newEmployee.password}
                  onChange={handleNewEmployeeChange}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-password2">Confirm password</label>
                <input
                  id="new-emp-password2"
                  type="password"
                  name="password_confirm"
                  value={newEmployee.password_confirm}
                  onChange={handleNewEmployeeChange}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-role">Role</label>
                <select
                  id="new-emp-role"
                  name="role"
                  value={newEmployee.role}
                  onChange={handleNewEmployeeChange}
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-code">Employee code</label>
                <input
                  id="new-emp-code"
                  type="text"
                  name="employee_code"
                  value={newEmployee.employee_code}
                  onChange={handleNewEmployeeChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-position">Position</label>
                <input
                  id="new-emp-position"
                  type="text"
                  name="position"
                  value={newEmployee.position}
                  onChange={handleNewEmployeeChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-dept">Department</label>
                <input
                  id="new-emp-dept"
                  type="text"
                  name="department"
                  value={newEmployee.department}
                  onChange={handleNewEmployeeChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-phone">Phone</label>
                <input
                  id="new-emp-phone"
                  type="text"
                  name="phone_number"
                  value={newEmployee.phone_number}
                  onChange={handleNewEmployeeChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-manager">Manager</label>
                <select
                  id="new-emp-manager"
                  name="manager_id"
                  value={newEmployee.manager_id}
                  onChange={handleNewEmployeeChange}
                >
                  <option value="">None</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.name}
                      {emp.employee_code ? ` (${emp.employee_code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-join">Joining date</label>
                <input
                  id="new-emp-join"
                  type="date"
                  name="joining_date"
                  value={newEmployee.joining_date}
                  onChange={handleNewEmployeeChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-emp-relieve">Relieving date</label>
                <input
                  id="new-emp-relieve"
                  type="date"
                  name="relieving_date"
                  value={newEmployee.relieving_date}
                  onChange={handleNewEmployeeChange}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create employee'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancelAdd}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {employees.length === 0 && !showAddForm ? (
        <div className="no-data">No employees found. Use &quot;Add employee&quot; to create one.</div>
      ) : employees.length === 0 ? null : (
        <div className="employees-table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Employee Code</th>
                <th>Position</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <React.Fragment key={employee.user_id}>
                  <tr>
                    <td>{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>
                      <span className={`role-badge role-${employee.role_name?.toLowerCase()}`}>
                        {employee.role_name}
                      </span>
                    </td>
                    <td>{employee.employee_code || '-'}</td>
                    <td>{employee.position || '-'}</td>
                    <td>{employee.department || '-'}</td>
                    <td>{employee.phone_number || '-'}</td>
                    <td>
                      <div className="action-buttons-inline">
                        <button
                          type="button"
                          className="btn-detail"
                          onClick={() => onViewEmployeeDetails?.(employee.user_id)}
                          title="View full employee record"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => handleEdit(employee)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDelete(employee.user_id, employee.name)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingEmployee === employee.user_id && (
                    <tr className="edit-row">
                      <td colSpan="8">
                        <form onSubmit={handleSubmit} className="edit-form">
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Name</label>
                              <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Email</label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Role</label>
                              <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                              >
                                <option value="employee">Employee</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Employee Code</label>
                              <input
                                type="text"
                                name="employee_code"
                                value={formData.employee_code}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="form-group">
                              <label>Position</label>
                              <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="form-group">
                              <label>Department</label>
                              <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="form-group">
                              <label>Phone Number</label>
                              <input
                                type="text"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="form-group">
                              <label>Joining Date</label>
                              <input
                                type="date"
                                name="joining_date"
                                value={formData.joining_date}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="form-group">
                              <label>Relieving Date</label>
                              <input
                                type="date"
                                name="relieving_date"
                                value={formData.relieving_date}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                          <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                              {loading ? 'Updating...' : 'Update'}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={handleCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
