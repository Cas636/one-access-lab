import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function Callback() {
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('Procesando inicio de sesión...')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      const errorMessage = `Error de autenticación: ${error}`
      setMessage(errorMessage)
      console.error(errorMessage)
      return
    }

    if (!code) {
      setMessage('No se recibió ningún código de autorización.')
      return
    }

    setMessage(`Código de autorización recibido: ${code}`)
    console.log('Authorization Code recibido:', code)
    // TODO: Enviar el código a tu backend para intercambiarlo por tokens.
  }, [searchParams])

  return (
    <main className="login-container">
      <div className="login-card">
        <h2>Callback de FusionAuth</h2>
        <p>{message}</p>
      </div>
    </main>
  )
}

export default Callback
