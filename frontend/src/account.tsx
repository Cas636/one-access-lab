import { useNavigate } from 'react-router-dom';
import { useFusionAuth } from '@fusionauth/react-sdk';
import { useEffect, useState } from 'react';
import './home.css';

export default function Account() {
  const navigate = useNavigate();

  // use fusionauth SDK methods to handle authentication, logout, and user data fetching
  const { isLoggedIn, isFetchingUserInfo, startLogout } = useFusionAuth();
  const [newUserInfo, setNewUserInfo] = useState({ 'given_name': '', 'family_name': '', 'birthDate': '', 'email': ''  });

  // if user is not authenticated, redirect them back to the login page
  useEffect(() => { if (!isLoggedIn) navigate("/"); }, [isLoggedIn, navigate]);

  async function getUserInfo() {
    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/account/profile', {
        'method': 'GET',
        'credentials': 'include',
        'headers': {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Error al obtener la información del servidor');
      }
      const data = await response.json();
      setNewUserInfo(data);
    }catch (error) {
      console.error("Hubo un problema con la petición:", error);
    }
  }

  useEffect(() => {if (isLoggedIn) {getUserInfo();}}, [isLoggedIn]);
  if (!isLoggedIn || isFetchingUserInfo) return null;

  return (
    <div>
      <div className="titlebar">
        <span className='white'>{newUserInfo?.email}</span>
        <button className='button headerButton' onClick={() => startLogout()}>Logout</button>
      </div>
      <div className='centerContainer'>
        <div className="userInfoGrid">
          <div>Name:</div>
          <div>{newUserInfo?.given_name} {newUserInfo?.family_name}</div>
          <div>Birthdate:</div>
          <div>{newUserInfo?.birthDate}</div>
        </div>
        <br />
        <div>
          <button className="button" onClick={getUserInfo}>Show your info</button>
        </div>
      </div>
    </div>
  );
}