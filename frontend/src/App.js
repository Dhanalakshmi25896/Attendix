import { Signup } from "./Form/Signup";
import Login from './Form/Login';
import Dashboard from './Dashboard/Dashboard';
import { Routes, Route, Navigate } from "react-router-dom";

function ProtectedDashboard() {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <Dashboard />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
