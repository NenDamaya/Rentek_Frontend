<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import { API_BASE } from './api.js'
  import LucideIcons from './LucideIcons.svelte'

  const dispatch = createEventDispatcher()

  export let currentChatId = null
  export let user = null
  export let refreshKey = 0
  export let isDesktop = false

  let chats = []
  let loading = false

  $: if (refreshKey >= 0) loadChats()

  onMount(loadChats)

  async function loadChats() {
    const token = localStorage.getItem('rentek_token')
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'rentek-app/1.0',
        },
      })
      const data = await res.json()
      chats = data.chats || []
    } catch {}
  }

  async function newChat() {
    const token = localStorage.getItem('rentek_token')
    if (!token) return
    loading = true
    try {
      const res = await fetch(`${API_BASE}/api/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'rentek-app/1.0',
        },
      })
      const chat = await res.json()
      chats = [{ ...chat, message_count: 0 }, ...chats]
      dispatch('select', chat.id)
    } catch {}
    loading = false
  }

  async function deleteChat(chatId) {
    const token = localStorage.getItem('rentek_token')
    if (!token) return
    try {
      await fetch(`${API_BASE}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'rentek-app/1.0',
        },
      })
      chats = chats.filter(c => c.id !== chatId)
      if (currentChatId === chatId) dispatch('select', null)
    } catch {}
  }

  function selectChat(id) {
    dispatch('select', id)
  }

  function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000) return 'Hoy'
    if (diff < 172800000) 'Ayer'
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }
</script>

<aside class="flex flex-col h-full w-72 md:w-64 bg-surface border-r border-border shadow-lg">
  <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
    <div class="flex items-center gap-2 min-w-0">
      {#if user?.picture}
        <img src={user.picture} alt="" class="w-7 h-7 rounded-full flex-shrink-0" />
      {:else}
        <span class="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
          <LucideIcons name="user" size={14} />
        </span>
      {/if}
      <span class="text-sm font-medium truncate">{user?.display_name || user?.username || 'Usuario'}</span>
    </div>
    {#if !isDesktop}
      <button class="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-text-muted" on:click={() => dispatch('close')}>
        <LucideIcons name="x" size={18} />
      </button>
    {/if}
  </div>

  <button class="mx-3 mt-3 mb-2 py-2.5 px-3 border border-dashed border-border rounded-lg bg-transparent text-text text-xs cursor-pointer flex items-center gap-2 transition-colors hover:bg-surface-2 disabled:opacity-50" on:click={newChat} disabled={loading}>
    <span class="text-base font-light">+</span> Nuevo chat
  </button>

  <div class="flex-1 overflow-y-auto px-2">
    {#each chats as chat (chat.id)}
      <button
        class="w-full text-left py-2.5 px-3 border-none rounded-lg bg-transparent text-text cursor-pointer mb-0.5 transition-colors hover:bg-surface-2 text-sm
          {chat.id === currentChatId ? 'bg-surface-2' : ''}"
        on:click={() => selectChat(chat.id)}
      >
        <div class="truncate">{chat.title}</div>
        <div class="flex justify-between items-center mt-1 text-[0.65rem] text-text-muted">
          <span>{formatDate(chat.updated_at)}</span>
          <button class="bg-none border-none text-text-muted cursor-pointer p-0.5 rounded opacity-60 hover:opacity-100 hover:text-error transition-all" on:click|stopPropagation={() => deleteChat(chat.id)} title="Eliminar">
            <LucideIcons name="trash-2" size={14} />
          </button>
        </div>
      </button>
    {/each}

    {#if chats.length === 0}
      <p class="text-center text-text-muted text-xs py-5">No hay chats aun</p>
    {/if}
  </div>
</aside>
