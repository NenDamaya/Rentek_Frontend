<script>
  import { onMount } from 'svelte'
  import Login from './lib/Login.svelte'
  import Chat from './lib/Chat.svelte'
  import LucideIcons from './lib/LucideIcons.svelte'

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
  <div class="flex flex-col items-center justify-center h-screen gap-3 text-text-muted">
    <span class="text-primary animate-pulse"><LucideIcons name="hardhat" size={48} /></span>
    <p>Cargando...</p>
  </div>
{:else if user}
  <Chat {user} on:logout={handleLogout} />
{:else}
  <Login on:login={handleLogin} />
{/if}
