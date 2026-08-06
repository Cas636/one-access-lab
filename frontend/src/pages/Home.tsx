import { useNavigate } from 'react-router-dom';
import { useFusionAuth } from '@fusionauth/react-sdk';
import { useEffect } from 'react';
import '../styles/Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, startLogin } = useFusionAuth();
  

  useEffect(() => {
    // Si ya está autenticado, limpiar la sesión y redirigir al componente content
    if (isLoggedIn) {
      sessionStorage.removeItem('justLoggedIn');
      navigate("/content");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="landingWrapper">
      <div className="landingPage">
        <div className="centerContainer">
          <div className="formLanding">

            <div className="landingTitle">
              <span>¡Todo el streaming de videojuegos en un sólo lugar!</span>
            </div>

            <div className="landingSubtitle">
              <span>Las mejores gameplays, torneos en vivo, game-trailers y eSports.</span>
            </div>

            <div className="buttonContainer">
              <button
                className="button landingRegisterBtn"
                type="button"
                id="btn_register_ld"
                onClick={() => {
                  sessionStorage.setItem('justLoggedIn', 'true');
                  startLogin();
                }}
              >
                REGÍSTRATE O INICIA SESIÓN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}