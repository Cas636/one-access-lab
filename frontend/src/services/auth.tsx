const FUSIONAUTH_BASE_URL = 'http://localhost:9011'
const REDIRECT_PATH = '/callback'

export function login() {
  const redirectUri = `${window.location.origin}${REDIRECT_PATH}`
  const authorizeUrl = new URL('/oauth2/authorize', FUSIONAUTH_BASE_URL)

  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', import.meta.env.VITE_CLIENT_ID)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('scope', 'openid offline_access')
  authorizeUrl.searchParams.set('state', crypto.randomUUID?.() ?? `${Date.now()}`)

  window.location.assign(authorizeUrl.toString())
}
