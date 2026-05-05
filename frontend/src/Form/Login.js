import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.css';
import './Style.css';
import { useNavigate } from 'react-router-dom';
import validation from './Loginvalidation';
import Logo from '../images/attendix-logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [input, setInput] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput({
      ...input,
      [name]: value,
    });

    // Real-time validation
    setErrors(validation({ ...input, [name]: value }));
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!input.username || !input.password) {
      setMessage('Please enter both username and password');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post('http://localhost:8081/api/login', {
        username: input.username,
        password: input.password,
      });

      if (res.data.success && res.data.user && res.data.token) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('token', res.data.token);
        setMessage('Login successful! Redirecting...');
        navigate('/dashboard', { replace: true });
      } else {
        setMessage(res.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.log(err);
      setMessage(
        err.response?.data?.message || 
        'Error connecting to server. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 login-page">
      <div className="row h-100">
        <div className="col-md-8 d-none d-md-block bg-image"></div>
        <div className="col-md-4 d-flex justify-content-center align-items-center">
          <div className="bg-white p-5 w-100">
            <div className="text-center mb-4">
              <img
                src={Logo}
                alt="Attendix"
                className="brand-logo"
                width={320}
                height={100}
                decoding="sync"
              />
            </div>
            <h1 className="mb-4 text-center fw-bold">Login</h1>

            {message && (
              <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-danger'}`} role="alert">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your Username"
                  className={`form-control form-control-lg ${errors.username ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  value={input.username}
                  required
                />
                {errors.username && <div className="error-message">{errors.username}</div>}
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your Password"
                  className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  value={input.password}
                  required
                />
                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-success w-100 btn-lg"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
