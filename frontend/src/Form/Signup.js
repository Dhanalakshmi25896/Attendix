import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import validation from "./Signupvalidation";
import Logo from "../images/attendix-logo.png";
export function Signup() {
  const [input, setInput] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
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

    // Run validation before submitting
    const validationErrors = validation(input);
    setErrors(validationErrors);

    // Check if there are any errors
    if (Object.values(validationErrors).some((err) => err !== "")) {
      return;
    }

    if (!agree) {
      setMessage("Please accept Terms & Conditions");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post("http://localhost:8081/api/signup", {
        name: input.name,
        email: input.email,
        password: input.password,
      });

      setMessage(res.data.message || 'Signup successful!');

      // Reset form
      setInput({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setAgree(false);
      setErrors({});
    } catch (err) {
      console.log(err);
      setMessage(
        err.response?.data?.message || 
        'Error submitting form. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid signup-container vh-100 d-flex p-0">
     
      <div className="col-md-8 d-none d-md-block signup-image"></div>
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
          <h3 className="text-center mb-3">Sign Up</h3>
          
          {message && (
            <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-danger'}`} role="alert">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
           
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                placeholder="Enter your full name"
                onChange={handleChange}
                value={input.name}
                required
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>

          
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email"
                onChange={handleChange}
                value={input.email}
                required
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

          
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Enter password"
                onChange={handleChange}
                value={input.password}
                required
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={`form-control form-control-lg ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Re-enter password"
                onChange={handleChange}
                value={input.confirmPassword}
                required
              />
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword}</div>
              )}
            </div>

        
            <div className="mb-3 p-1">
              <input
                type="checkbox"
                className="form-check-input ml-0"
                id="terms"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <label className="form-check-label ms-2 pl-4" htmlFor="terms">
                I agree to the Terms of Service & Privacy Policy
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 btn-lg"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign up'}
            </button>

            <p className="text-center mt-3" style={{ fontSize: "20px" }}>
              Already have an account?{" "}
              <Link to="/" className="text-primary">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
