<script>
  import { createEventDispatcher } from 'svelte'
  import { API_BASE } from './api.js'

  const dispatch = createEventDispatcher()

  let mode = 'login'
  let username = ''
  let password = ''
  let displayName = ''
  let error = ''
  let loading = false

  async function submit() {
    error = ''
    loading = true
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body = mode === 'login'
      ? { username, password }
      : { username, password, display_name: displayName }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'rentek-app/1.0',
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        error = data.detail || 'Error al autenticar'
        return
      }
      localStorage.setItem('rentek_token', data.token)
      localStorage.setItem('rentek_user', JSON.stringify(data.user))
      dispatch('login', data.user)
    } catch (e) {
      error = 'Error de conexión con el servidor'
    } finally {
      loading = false
    }
  }
</script>

<div class="login-wrapper">
  <div class="login-card">
    <div class="login-header">
      <span class="logo">🏗️</span>
      <h1>Rentek</h1>
      <p>Asistente de Renta de Maquinaria Pesada</p>
    </div>

    <form on:submit|preventDefault={submit}>
      <div class="tabs">
        <button type="button" class:active={mode === 'login'} on:click={() => { mode = 'login'; error = '' }}>Iniciar Sesión</button>
        <button type="button" class:active={mode === 'register'} on:click={() => { mode = 'register'; error = '' }}>Registrarse</button>
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      {#if mode === 'register'}
        <label>
          Nombre
          <input type="text" bind:value={displayName} placeholder="Tu nombre" />
        </label>
      {/if}

      <label>
        Usuario
        <input type="text" bind:value={username} placeholder="admin" required />
      </label>

      <label>
        Contraseña
        <input type="password" bind:value={password} placeholder="••••••" required />
      </label>

      {#if mode === 'login'}
        <p class="hint">Usuario por defecto: admin / admin123</p>
      {/if}

      <button type="submit" class="submit-btn" disabled={loading || !username || !password}>
        {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear Cuenta'}
      </button>
    </form>
  </div>
</div>

<style>
  .login-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg, #0f0f0f);
    padding: 20px;
  }
  .login-card {
    background: var(--surface, #1a1a1a);
    border: 1px solid var(--border, #333);
    border-radius: 16px;
    padding: 40px 32px;
    width: 100%;
    max-width: 380px;
  }
  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }
  .logo {
    font-size: 2.5em;
    display: block;
    margin-bottom: 8px;
  }
  .login-header h1 {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0 0 4px;
  }
  .login-header p {
    color: var(--text-muted, #888);
    font-size: 0.85em;
    margin: 0;
  }
  .tabs {
    display: flex;
    gap: 4px;
    background: var(--surface-2, #2a2a2a);
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 20px;
  }
  .tabs button {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted, #888);
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tabs button.active {
    background: var(--primary, #6366f1);
    color: white;
    font-weight: 600;
  }
  .error {
    background: #ef444420;
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.85em;
    margin-bottom: 16px;
  }
  label {
    display: block;
    margin-bottom: 14px;
    font-size: 0.85em;
    color: var(--text-muted, #888);
  }
  label input {
    display: block;
    width: 100%;
    margin-top: 6px;
    padding: 10px 14px;
    background: var(--surface-2, #2a2a2a);
    border: 1px solid var(--border, #333);
    border-radius: 8px;
    color: var(--text, #fff);
    font-size: 0.95em;
    outline: none;
    box-sizing: border-box;
  }
  label input:focus {
    border-color: var(--primary, #6366f1);
  }
  .hint {
    font-size: 0.75em;
    color: var(--text-muted, #666);
    margin: -8px 0 16px;
  }
  .submit-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: var(--primary, #6366f1);
    color: white;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: 8px;
  }
  .submit-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  .submit-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
