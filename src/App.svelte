<script>
  import { onMount } from 'svelte'
  import Login from './lib/Login.svelte'
  import Chat from './lib/Chat.svelte'

  let user = null
  let checked = false

  onMount(() => {
    const stored = localStorage.getItem('rentek_user')
    const token = localStorage.getItem('rentek_token')
    if (stored && token) {
      try {
        user = JSON.parse(stored)
      } catch {}
    }
    checked = true
  })

  function handleLogin(e) {
    user = e.detail
  }

  function handleLogout() {
    localStorage.removeItem('rentek_token')
    localStorage.removeItem('rentek_user')
    user = null
  }
</script>

{#if !checked}
  <div class="loading-screen">
    <span class="logo">🏗️</span>
    <p>Cargando...</p>
  </div>
{:else if user}
  <Chat {user} on:logout={handleLogout} />
{:else}
  <Login on:login={handleLogin} />
{/if}

<style>
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 12px;
    color: var(--text-muted, #888);
  }
  .logo {
    font-size: 3em;
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.95); }
  }
</style>
