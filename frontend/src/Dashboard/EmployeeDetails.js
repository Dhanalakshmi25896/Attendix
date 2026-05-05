import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EmployeeDetails() {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  const fetchEmployeeDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8081/api/employees/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEmployeeData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8081/api/employees/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSearchResults(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search employees');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value.trim()) {
      setSearchResults([]);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleBackToMyDetails = () => {
    setSelectedEmployee(null);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (loading) {
    return <div className="loading-container">Loading employee details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  const displayData = selectedEmployee || employeeData;

  return (
    <div className="employee-details">
      <div className="employee-details-header">
        <h2 className="section-title">
          {selectedEmployee ? 'Employee Details' : 'My Employee Details'}
        </h2>
        {!selectedEmployee && (
          <button
            className="btn-search-employees"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? 'Hide Search' : '🔍 Search Employees'}
          </button>
        )}
        {selectedEmployee && (
          <button
            className="btn-back"
            onClick={handleBackToMyDetails}
          >
            ← Back to My Details
          </button>
        )}
      </div>

      {showSearch && !selectedEmployee && (
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, email, employee code, position, or department..."
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
            <button type="submit" className="btn-search" disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results ({searchResults.length})</h3>
              <div className="search-results-list">
                {searchResults.map((employee) => (
                  <div
                    key={employee.user_id}
                    className="search-result-item"
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    <div className="search-result-header">
                      <strong>{employee.name}</strong>
                      <span className={`role-badge role-${employee.role_name?.toLowerCase() || 'employee'}`}>
                        {employee.role_name || 'Employee'}
                      </span>
                    </div>
                    <div className="search-result-details">
                      <span>{employee.email}</span>
                      {employee.department && <span>• {employee.department}</span>}
                      {employee.position && <span>• {employee.position}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searchLoading && (
            <div className="no-search-results">No employees found matching your search.</div>
          )}
        </div>
      )}

      <div className="details-card">
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{displayData?.name || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{displayData?.email || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Role:</span>
            <span className="detail-value">{displayData?.role || displayData?.role_name || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Employee Code:</span>
            <span className="detail-value">{displayData?.employee_code || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Position:</span>
            <span className="detail-value">{displayData?.position || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Department:</span>
            <span className="detail-value">{displayData?.department || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone Number:</span>
            <span className="detail-value">{displayData?.phone_number || 'N/A'}</span>
          </div>
          {displayData?.manager_name && (
            <div className="detail-item">
              <span className="detail-label">Manager:</span>
              <span className="detail-value">{displayData.manager_name}</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Joining Date:</span>
            <span className="detail-value">
              {displayData?.joining_date 
                ? new Date(displayData.joining_date).toLocaleDateString('en-US')
                : 'N/A'}
            </span>
          </div>
          {displayData?.relieving_date && (
            <div className="detail-item">
              <span className="detail-label">Relieving Date:</span>
              <span className="detail-value">
                {new Date(displayData.relieving_date).toLocaleDateString('en-US')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
