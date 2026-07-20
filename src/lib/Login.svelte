<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { API_BASE } from './api.js'
  import LucideIcons from './LucideIcons.svelte'

  const dispatch = createEventDispatcher()
  let error = ''

  onMount(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthUser = params.get('oauth_user')
    if (oauthUser) {
      try {
        const userData = JSON.parse(atob(oauthUser))
        if (userData.error) {
          error = userData.error
        } else {
          localStorage.setItem('rentek_token', userData.token)
          localStorage.setItem('rentek_user', JSON.stringify(userData))
          dispatch('login', userData)
        }
        window.history.replaceState({}, '', window.location.pathname)
      } catch {
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  })

  function googleLogin() {
    window.location.href = `${API_BASE}/auth/google/login`
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-bg p-5">
  <div class="bg-surface border border-border rounded-2xl p-8 sm:p-10 w-full max-w-sm shadow-xl">
    <div class="text-center mb-8">
      <span class="block mb-2 text-primary"><LucideIcons name="hardhat" size={40} /></span>
      <h1 class="text-xl font-bold mb-1">Rentek</h1>
      <p class="text-text-muted text-sm m-0">Asistente de Renta de Maquinaria Pesada</p>
    </div>

    {#if error}
      <div class="bg-error/10 border border-error text-error px-3.5 py-2.5 rounded-lg text-sm mb-5">{error}</div>
    {/if}

    <button class="w-full py-3.5 px-4 border border-border rounded-xl bg-surface-2 text-text font-medium cursor-pointer flex items-center justify-center gap-2.5 transition-colors hover:bg-surface-2/80" on:click={googleLogin}>
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continuar con Google
    </button>

    <p class="text-center text-xs text-text-muted mt-4">Serás redirigido a Google para autenticarte</p>
  </div>
</div>
