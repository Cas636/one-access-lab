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
    <div>
      <div className="centerContainer">
        <div className="userInfoGrid">
          <div>Name:</div>
          <div>{user?.given_name} {user?.family_name}</div>
          <div>Birthdate:</div>
          <div>{user?.birthDate}</div>
        </div>
      </div>
    </div>
  );
}