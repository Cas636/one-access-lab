import './App.css'
import { login } from './services/auth.tsx'

function App() {
  return (
    <main className="login-container">
      <div className="login-card">
        <h1>oneVGames</h1>
        <p>
          Iniciar sesión con FusionAuth.
        </p>
        <button className="login-button" onClick={login}>
          Iniciar sesión
        </button>
      </div>
    </main>
  )
}

export default App
