import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './home.tsx';
import Account from './account';
import { FusionAuthProvider } from '@fusionauth/react-sdk';
import type { FusionAuthProviderConfig } from '@fusionauth/react-sdk';

const fusionAuthProviderConfig: FusionAuthProviderConfig = { 
  redirectUri: import.meta.env.VITE_REDIRECT_URI, 
  postLogoutRedirectUri: import.meta.env.VITE_REDIRECT_URI_POST_LOGOUT,
  shouldAutoRefresh: true,
  shouldAutoFetchUserInfo: false,
  scope: 'openid email profile offline_access',
  clientId: import.meta.env.VITE_CLIENT_ID,
  serverUrl: import.meta.env.VITE_FUSIONAUTH_URL,
  onRedirect: () => { console.log('Login successful'); }
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/account" element={<Account />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
  
ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <FusionAuthProvider {...fusionAuthProviderConfig}>
        <App />
      </FusionAuthProvider>
    </BrowserRouter>
  </StrictMode>
);