import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser, loginUser } from '../api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(username, email, password);
      // Автологін після реєстрації
      const data = await loginUser(email, password);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (error) {
      alert('Failed to register');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required/>
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
