import { useNavigate } from 'react-router-dom';
import { useFusionAuth } from '@fusionauth/react-sdk';
import { useEffect } from 'react';

export default function Home() {
  const navigate = useNavigate();

  const { isLoggedIn, startLogin } = useFusionAuth();

  useEffect(() => {
    // Si ya está autenticado, limpiar la sesión y redirigir al componente account
    if (isLoggedIn) {
      sessionStorage.removeItem('justLoggedIn');
      navigate("/account");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div>
      <div className="titlebar">
        {!isLoggedIn && (
          <button
            className='button'
            onClick={() => {
              sessionStorage.setItem('justLoggedIn', 'true');
              startLogin();
            }}
          >
            Login
          </button>
        )}
      </div>
      <div className='centerContainer'>
        <div>Log in to request your information</div>
      </div>
    </div>
  );
}