import { Link } from "react-router-dom";
import { useFusionAuth } from "@fusionauth/react-sdk";
import { useUser } from "../context/UserContext";
import '../styles/Home.css';



export default function Header() {
    const { isLoggedIn, startLogin, startLogout } = useFusionAuth();
    const { user, loading, isAdmin } = useUser();

    return (
        <header className="titlebar">
            <div className="landingLogo">
                <span className="logoText">
                    ONE<span className="highlight">V</span>GAMES
                </span>
            </div>

            {isLoggedIn ? (
                <div className="headerRight">
                    <nav className="headerNav">
                        <Link to="/content"  className="button headerButton">Inicio</Link>
                        <Link to="/account" className="button headerButton">Mi cuenta</Link>
                        {isAdmin && (
                            <Link to="/admin" className="button headerButton">Admin</Link>
                        )}
                    </nav>
                    <span className="white">{loading ? "" : user?.email}</span>

                    <button
                        className="button headerButton"
                        onClick={() => startLogout()}
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <button
                    className="button headerButton"
                    onClick={() => startLogin()}
                >
                    Iniciar sesión
                </button>
            )}
        </header>
    );
}