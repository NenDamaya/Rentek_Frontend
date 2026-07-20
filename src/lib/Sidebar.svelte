<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'
  import { API_BASE } from './api.js'

  export let user = null
  export let currentChatId = null
  export let refreshKey = 0
  export let isDesktop = false
  const dispatch = createEventDispatcher()

  let chats = []
  let loadingChats = true
  let deleteConfirmId = null

  $: refreshKey, loadChats()

  onMount(loadChats)

  async function loadChats() {
    const token = localStorage.getItem('rentek_token')
    if (!token) return
    loadingChats = true
    try {
      const res = await fetch(`${API_BASE}/api/chats`, {
        headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
      })
      if (res.ok) {
        const data = await res.json()
        chats = data.chats || []
      }
    } catch {}
    loadingChats = false
  }

  function selectChat(chatId) {
    dispatch('select', chatId)
    deleteConfirmId = null
  }

  function newChat() {
    selectChat(null)
    if (!isDesktop) dispatch('close')
  }

  function confirmDelete(e, chatId) {
    e.stopPropagation()
    deleteConfirmId = deleteConfirmId === chatId ? null : chatId
  }

  async function deleteChat(e, chatId) {
    e.stopPropagation()
    const token = localStorage.getItem('rentek_token')
    if (!token) return
    try {
      await fetch(`${API_BASE}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
      })
      if (currentChatId === chatId) {
        selectChat(null)
      }
      await loadChats()
    } catch {}
    deleteConfirmId = null
  }

  function getRelativeTime(date) {
    const now = new Date()
    const d = new Date(date)
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    return `${diffDays}d`
  }
</script>

<aside class="h-full flex flex-col" style="width: 260px; background: #0f172a; border-right: 1px solid #1e2d4a">
  <div class="flex items-center justify-between p-4 flex-shrink-0" style="border-bottom: 1px solid #1e2d4a">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
        style="background: linear-gradient(135deg, #2563eb, #3b82f6)">
        <LucideIcons name="hardhat" size={16} />
      </div>
      <span class="text-sm font-semibold" style="color: #e2e8f0">Rentek</span>
    </div>
    {#if !isDesktop}
      <button class="p-2 rounded-lg transition-colors" style="color: #94a3b8"
        on:mouseenter={e => e.target.style.background = '#1e2d4a'} on:mouseleave={e => e.target.style.background = 'transparent'}
        on:click={() => dispatch('close')}>
        <LucideIcons name="x" size={18} />
      </button>
    {/if}
  </div>

  <button class="flex items-center gap-2.5 w-[calc(100%-24px)] mx-3 mt-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-none"
    style="background: #1a2540; color: #e2e8f0; border: 1px solid #2a3a5c"
    on:mouseenter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#1e2d4a' }}
    on:mouseleave={e => { e.currentTarget.style.borderColor = '#2a3a5c'; e.currentTarget.style.background = '#1a2540' }}
    on:click={newChat}>
    <LucideIcons name="search" size={16} />
    <span>Nueva consulta</span>
  </button>

  <div class="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
    {#if loadingChats}
      <div class="flex flex-col items-center justify-center py-8 gap-2">
        <span class="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" style="color: #475569"></span>
        <span class="text-xs" style="color: #475569">Cargando...</span>
      </div>
    {:else if chats.length === 0}
      <div class="flex flex-col items-center justify-center py-8 gap-2">
        <LucideIcons name="bot" size={28} />
        <span class="text-xs" style="color: #475569">Sin conversaciones</span>
      </div>
    {:else}
      {#each chats as chat, i (chat.id)}
        <button class="relative group flex items-center gap-2.5 w-[calc(100%-8px)] px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border-none"
          style="background: {currentChatId === chat.id ? '#1e2d4a' : 'transparent'}; color: {currentChatId === chat.id ? '#e2e8f0' : '#94a3b8'}"
          on:mouseenter={e => { if (currentChatId !== chat.id) e.currentTarget.style.background = '#1a2540' }}
          on:mouseleave={e => { if (currentChatId !== chat.id) e.currentTarget.style.background = 'transparent' }}
          on:click={() => selectChat(chat.id)}>

          {#if deleteConfirmId === chat.id}
            <div class="absolute inset-0 flex items-center justify-between px-3 rounded-xl z-10" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3)">
              <span class="text-[0.65rem] font-medium" style="color: #f87171">Eliminar?</span>
              <div class="flex gap-1">
                <button class="px-2 py-1 rounded text-[0.6rem] font-medium transition-all cursor-pointer border-none"
                  style="background: #ef4444; color: white"
                  on:click={(e) => deleteChat(e, chat.id)}>Si</button>
                <button class="px-2 py-1 rounded text-[0.6rem] font-medium transition-all cursor-pointer border-none"
                  style="background: #1e2d4a; color: #94a3b8"
                  on:click={(e) => { e.stopPropagation(); deleteConfirmId = null }}>No</button>
              </div>
            </div>
          {/if}

          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style="background: {currentChatId === chat.id ? 'rgba(59,130,246,0.2)' : '#1a2540'}">
            <LucideIcons name="bot" size={14} />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate m-0" style="color: {currentChatId === chat.id ? '#e2e8f0' : '#cbd5e1'}">
              {chat.title || 'Nueva conversación'}
            </p>
            <p class="text-[0.6rem] m-0" style="color: #475569">
              {getRelativeTime(chat.updated_at || chat.created_at)}
            </p>
          </div>

          {#if !deleteConfirmId}
            <button class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none"
              style="background: transparent; color: #f87171"
              on:mouseenter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              on:mouseleave={e => e.currentTarget.style.background = 'transparent'}
              on:click={(e) => confirmDelete(e, chat.id)} title="Eliminar chat">
              <LucideIcons name="trash-2" size={13} />
            </button>
          {/if}
        </button>
      {/each}
    {/if}
  </div>

  {#if user}
    <div class="flex items-center gap-2.5 p-3 flex-shrink-0" style="border-top: 1px solid #1e2d4a">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style="background: {user.avatar_url ? 'transparent' : 'linear-gradient(135deg, #2563eb, #3b82f6)'}; overflow: hidden">
        {#if user.avatar_url}
          <img src={user.avatar_url} alt="" class="w-full h-full object-cover" />
        {:else}
          <span class="text-[0.6rem] font-bold text-white">{(user.display_name || user.username || 'U')[0]?.toUpperCase()}</span>
        {/if}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium truncate m-0" style="color: #e2e8f0">{user.display_name || user.username}</p>
        <p class="text-[0.6rem] truncate m-0" style="color: #64748b">{user.email}</p>
      </div>
    </div>
  {/if}
</aside>
