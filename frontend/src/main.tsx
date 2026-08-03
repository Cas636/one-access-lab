import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './Home';
import Account from './account';
import { FusionAuthProvider } from '@fusionauth/react-sdk';
import type { FusionAuthProviderConfig } from '@fusionauth/react-sdk';

const fusionAuthProviderConfig: FusionAuthProviderConfig = { 
  redirectUri: 'http://localhost:5173', 
  postLogoutRedirectUri: 'http://localhost:5173',
  shouldAutoRefresh: true,
  shouldAutoFetchUserInfo: true,
  scope: 'openid email profile offline_access',
  clientId: '94ef0899-0429-40b6-864f-4b2cb00a595a',
  serverUrl: 'http://localhost:9011',
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