// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import Auth from '../Сomponents/Auth';

const LoginPage = () => {
  const [token, setToken] = useState(null);

  return (
    <div>
      <h2>Login</h2>
      <Auth setToken={setToken} />
    </div>
  );
};

export default LoginPage;
