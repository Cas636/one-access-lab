import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFusionAuth } from '@fusionauth/react-sdk';
import { useUser } from "../context/UserContext";
import '../styles/Home.css';

export default function Account() {
  const navigate = useNavigate();
  const { isLoggedIn, isFetchingUserInfo } = useFusionAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoggedIn) { navigate("/"); return; }
    //getUserInfo();
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn || isFetchingUserInfo) return null;

  return (
<div className="profileCard">

    <h2 className="profileTitle">Perfil de Usuario</h2>

    <div className="infoCard">
        <span>Nombre</span>
        <strong>{user?.given_name} {user?.family_name}</strong>
    </div>

    <div className="infoCard">
        <span>Fecha de Nacimiento</span>
        <strong>{user?.birthDate}</strong>
    </div>

</div>
  );
}