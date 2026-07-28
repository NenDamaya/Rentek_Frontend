<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { API_BASE, login as apiLogin, register as apiRegister } from './api.js'
  import LucideIcons from './LucideIcons.svelte'

  const dispatch = createEventDispatcher()

  let mode = 'login'
  let error = ''

  let loginEmail = ''
  let loginPassword = ''
  let loginShowPw = false

  let regEmail = ''
  let regDisplayName = ''
  let regPassword = ''
  let regConfirmPassword = ''
  let regShowPw = false
  let regShowConfirmPw = false

  let loading = false

  $: pwMatch = regConfirmPassword.length > 0 && regPassword === regConfirmPassword
  $: pwMismatch = regConfirmPassword.length > 0 && regPassword !== regConfirmPassword

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

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function handleLogin() {
    error = ''
    if (!loginEmail || !loginPassword) {
      error = 'Todos los campos son obligatorios'
      return
    }
    if (!isValidEmail(loginEmail)) {
      error = 'Correo electrónico inválido'
      return
    }
    loading = true
    try {
      const data = await apiLogin(loginEmail, loginPassword)
      localStorage.setItem('rentek_token', data.token)
      localStorage.setItem('rentek_user', JSON.stringify(data.user))
      dispatch('login', data.user)
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  }

  async function handleRegister() {
    error = ''
    if (!regEmail || !regPassword || !regConfirmPassword) {
      error = 'Todos los campos son obligatorios'
      return
    }
    if (!isValidEmail(regEmail)) {
      error = 'Correo electrónico inválido'
      return
    }
    if (regPassword.length < 6) {
      error = 'La contraseña debe tener al menos 6 caracteres'
      return
    }
    if (regPassword !== regConfirmPassword) {
      error = 'Las contraseñas no coinciden'
      return
    }
    loading = true
    try {
      const data = await apiRegister(regEmail, regPassword, regDisplayName)
      localStorage.setItem('rentek_token', data.token)
      localStorage.setItem('rentek_user', JSON.stringify(data.user))
      dispatch('login', data.user)
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  }

  function handleKeydown(e, handler) {
    if (e.key === 'Enter') handler()
  }
</script>

<div class="flex items-center justify-center min-h-screen p-5 bg-bg">
  <div class="bg-surface rounded-2xl p-8 sm:p-10 w-full max-w-sm shadow-xl border border-border">
    <div class="text-center mb-6">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm bg-gradient-to-br from-accent to-accent-hover text-white">
        <img src="/rentek-white.png" alt="Rentek" class="w-12 h-12 object-contain" />
      </div>
      <h1 class="text-xl font-bold mb-1 text-text">Rentek</h1>
      <p class="text-sm m-0 text-text-faint">Asistente de Renta de Maquinaria Pesada</p>
    </div>

    <div class="flex rounded-xl bg-surface-hover p-1 mb-6 border border-border">
      <button
        class="flex-1 py-2 text-sm font-medium rounded-lg transition-all {mode === 'login' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm' : 'text-text-muted hover:text-text'}"
        on:click={() => { mode = 'login'; error = '' }}>
        Iniciar Sesión
      </button>
      <button
        class="flex-1 py-2 text-sm font-medium rounded-lg transition-all {mode === 'register' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm' : 'text-text-muted hover:text-text'}"
        on:click={() => { mode = 'register'; error = '' }}>
        Registrarse
      </button>
    </div>

    {#if error}
      <div class="px-3.5 py-2.5 rounded-lg text-sm mb-5 bg-red-light border border-red-border text-red">{error}</div>
    {/if}

    {#if mode === 'login'}
      <form on:submit|preventDefault={handleLogin} class="space-y-4">
        <div>
          <label for="login-email" class="block text-xs font-medium text-text-muted mb-1.5">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            bind:value={loginEmail}
            on:keydown={e => handleKeydown(e, handleLogin)}
            placeholder="correo@ejemplo.com"
            class="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all"
          />
        </div>
        <div>
          <label for="login-password" class="block text-xs font-medium text-text-muted mb-1.5">Contraseña</label>
          <div class="relative">
            {#if loginShowPw}
              <input id="login-password" type="text" bind:value={loginPassword}
                on:keydown={e => handleKeydown(e, handleLogin)} placeholder="Tu contraseña"
                class="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all" />
            {:else}
              <input id="login-password" type="password" bind:value={loginPassword}
                on:keydown={e => handleKeydown(e, handleLogin)} placeholder="Tu contraseña"
                class="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all" />
            {/if}
            <button type="button" on:click={() => loginShowPw = !loginShowPw}
              class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text bg-transparent border-none cursor-pointer"
              tabindex="-1"
            >
              <LucideIcons name={loginShowPw ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          class="w-full py-3 px-4 rounded-xl font-medium cursor-pointer flex items-center justify-center gap-2 transition-all border-none bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
        >
          {#if loading}
            <span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          {/if}
          Entrar
        </button>
      </form>
    {:else}
      <form on:submit|preventDefault={handleRegister} class="space-y-4">
        <div>
          <label for="reg-email" class="block text-xs font-medium text-text-muted mb-1.5">Correo electrónico</label>
          <input
            id="reg-email"
            type="email"
            bind:value={regEmail}
            on:keydown={e => handleKeydown(e, handleRegister)}
            placeholder="correo@ejemplo.com"
            class="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all"
          />
        </div>
        <div>
          <label for="reg-display-name" class="block text-xs font-medium text-text-muted mb-1.5">
            Nombre visible <span class="text-text-faint">(opcional)</span>
          </label>
          <input
            id="reg-display-name"
            type="text"
            bind:value={regDisplayName}
            on:keydown={e => handleKeydown(e, handleRegister)}
            placeholder="Cómo te llamas"
            class="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all"
          />
        </div>
        <div>
          <label for="reg-password" class="block text-xs font-medium text-text-muted mb-1.5">Contraseña</label>
          <div class="relative">
            {#if regShowPw}
              <input id="reg-password" type="text" bind:value={regPassword}
                on:keydown={e => handleKeydown(e, handleRegister)} placeholder="Mínimo 6 caracteres"
                class="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all" />
            {:else}
              <input id="reg-password" type="password" bind:value={regPassword}
                on:keydown={e => handleKeydown(e, handleRegister)} placeholder="Mínimo 6 caracteres"
                class="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all" />
            {/if}
            <button type="button" on:click={() => regShowPw = !regShowPw}
              class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text bg-transparent border-none cursor-pointer"
              tabindex="-1"
            >
              <LucideIcons name={regShowPw ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>
        </div>
        <div>
          <label for="reg-confirm-password" class="block text-xs font-medium text-text-muted mb-1.5">Confirmar contraseña</label>
          <div class="relative">
            {#if regShowConfirmPw}
              <input id="reg-confirm-password" type="text" bind:value={regConfirmPassword}
                on:keydown={e => handleKeydown(e, handleRegister)} placeholder="Repite la contraseña"
                class="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 {pwMatch ? 'ring-2 ring-green-500/40 border-green-500/60' : pwMismatch ? 'ring-2 ring-red-500/40 border-red-500/60' : ''} transition-all" />
            {:else}
              <input id="reg-confirm-password" type="password" bind:value={regConfirmPassword}
                on:keydown={e => handleKeydown(e, handleRegister)} placeholder="Repite la contraseña"
                class="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-bg border border-border text-text placeholder:text-text-faint text-sm focus:outline-none focus:ring-2 {pwMatch ? 'ring-2 ring-green-500/40 border-green-500/60' : pwMismatch ? 'ring-2 ring-red-500/40 border-red-500/60' : ''} transition-all" />
            {/if}
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              {#if pwMatch}
                <LucideIcons name="check" size={16} class="text-green-400" />
              {:else if pwMismatch}
                <LucideIcons name="x" size={16} class="text-red-400" />
              {/if}
            </div>
          </div>
          {#if pwMismatch}
            <p class="text-[11px] mt-1 text-red-400">Las contraseñas no coinciden</p>
          {/if}
        </div>
        <button
          type="submit"
          disabled={loading}
          class="w-full py-3 px-4 rounded-xl font-medium cursor-pointer flex items-center justify-center gap-2 transition-all border-none bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
        >
          {#if loading}
            <span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          {/if}
          Crear Cuenta
        </button>
      </form>
    {/if}

    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-border"></div>
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="px-3 bg-surface text-text-faint">O continúa con</span>
      </div>
    </div>

    <button class="w-full py-3.5 px-4 rounded-xl font-medium cursor-pointer flex items-center justify-center gap-2.5 transition-colors border-none bg-surface text-text-2 border border-text-disabled hover:bg-surface-alt"
      on:click={googleLogin}>
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continuar con Google
    </button>

    {#if mode === 'login'}
      <p class="text-center text-xs mt-4 m-0 text-text-faint">
        ¿No tienes cuenta? <button class="text-amber-400 hover:text-amber-300 bg-transparent border-none p-0 underline cursor-pointer font-medium" on:click={() => { mode = 'register'; error = '' }}>Regístrate aquí</button>
      </p>
    {:else}
      <p class="text-center text-xs mt-4 m-0 text-text-faint">
        ¿Ya tienes cuenta? <button class="text-amber-400 hover:text-amber-300 bg-transparent border-none p-0 underline cursor-pointer font-medium" on:click={() => { mode = 'login'; error = '' }}>Inicia sesión aquí</button>
      </p>
    {/if}
  </div>
</div>
