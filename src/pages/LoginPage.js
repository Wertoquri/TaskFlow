import React, { useState } from 'react';
import Auth from '../components/auth.js';
import { useI18n } from '../context/I18nContext.jsx';

const LoginPage = () => {
  const [token, setToken] = useState(null);
  const { t } = useI18n();

  return (
    <div>
      <h2>{t('loginTitle')}</h2>
      <Auth setToken={setToken} />
    </div>
  );
};

export default LoginPage;
