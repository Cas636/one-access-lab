import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import PublicLayout from "./layouts/PublicLayout";
import PrivateLayout from "./layouts/PrivateLayout";

import Home from "./pages/Home";
import Account from "./pages/Account";
import Content from "./pages/Content";
import Watch from "./pages/Watch";
import Admin from "./pages/Admin";

import './styles/Home.css';
import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css';
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
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route element={<PrivateLayout />}>      
        <Route path="/content" element={<Content />} />
        <Route path="/content/:id" element={<Watch />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
  
ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <FusionAuthProvider {...fusionAuthProviderConfig}>
        <UserProvider>
          <App />
        </UserProvider>
      </FusionAuthProvider>
    </BrowserRouter>
  </StrictMode>
);