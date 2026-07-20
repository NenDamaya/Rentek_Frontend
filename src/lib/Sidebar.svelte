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

<aside class="h-full flex flex-col" style="width: 260px; background: white; border-right: 1px solid #e5e7eb">
  <div class="flex items-center justify-between p-4 flex-shrink-0" style="border-bottom: 1px solid #f3f4f6">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style="background: linear-gradient(135deg, #f97316, #ea580c); color: white">
        <LucideIcons name="hardhat" size={18} />
      </div>
      <span class="text-sm font-bold" style="color: #111827">Rentek</span>
    </div>
    {#if !isDesktop}
      <button class="p-2 rounded-lg transition-colors" style="color: #6b7280"
        on:click={() => dispatch('close')}>
        <LucideIcons name="x" size={18} />
      </button>
    {/if}
  </div>

  <button class="flex items-center gap-2.5 w-[calc(100%-24px)] mx-3 mt-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-none"
    style="background: #f9fafb; color: #111827; border: 1px solid #e5e7eb"
    on:mouseenter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.background = '#fff7ed' }}
    on:mouseleave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb' }}
    on:click={newChat}>
    <LucideIcons name="search" size={16} />
    <span>Nueva consulta</span>
  </button>

  <div class="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
    {#if loadingChats}
      <div class="flex flex-col items-center justify-center py-8 gap-2">
        <span class="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" style="color: #d1d5db"></span>
        <span class="text-xs" style="color: #9ca3af">Cargando...</span>
      </div>
    {:else if chats.length === 0}
      <div class="flex flex-col items-center justify-center py-8 gap-2" style="color: #d1d5db">
        <LucideIcons name="bot" size={28} />
        <span class="text-xs">Sin conversaciones</span>
      </div>
    {:else}
      {#each chats as chat, i (chat.id)}
        <button class="relative group flex items-center gap-2.5 w-[calc(100%-8px)] px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border-none"
          style="background: {currentChatId === chat.id ? '#fff7ed' : 'transparent'}; color: {currentChatId === chat.id ? '#111827' : '#6b7280'}"
          on:mouseenter={e => { if (currentChatId !== chat.id) e.currentTarget.style.background = '#f9fafb' }}
          on:mouseleave={e => { if (currentChatId !== chat.id) e.currentTarget.style.background = 'transparent' }}
          on:click={() => selectChat(chat.id)}>

          {#if deleteConfirmId === chat.id}
            <div class="absolute inset-0 flex items-center justify-between px-3 rounded-xl z-10" style="background: #fef2f2; border: 1px solid #fecaca">
              <span class="text-[0.65rem] font-medium" style="color: #dc2626">Eliminar?</span>
              <div class="flex gap-1">
                <button class="px-2 py-1 rounded text-[0.6rem] font-medium transition-all cursor-pointer border-none"
                  style="background: #dc2626; color: white"
                  on:click={(e) => deleteChat(e, chat.id)}>Si</button>
                <button class="px-2 py-1 rounded text-[0.6rem] font-medium transition-all cursor-pointer border-none"
                  style="background: #f3f4f6; color: #6b7280"
                  on:click={(e) => { e.stopPropagation(); deleteConfirmId = null }}>No</button>
              </div>
            </div>
          {/if}

          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style="background: {currentChatId === chat.id ? '#fed7aa' : '#f3f4f6'}">
            <LucideIcons name="bot" size={14} />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate m-0" style="color: {currentChatId === chat.id ? '#111827' : '#374151'}">
              {chat.title || 'Nueva conversación'}
            </p>
            <p class="text-[0.6rem] m-0" style="color: #9ca3af">
              {getRelativeTime(chat.updated_at || chat.created_at)}
            </p>
          </div>

          {#if !deleteConfirmId}
            <button class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none"
              style="background: transparent; color: #dc2626"
              on:mouseenter={e => e.currentTarget.style.background = '#fef2f2'}
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
    <div class="flex items-center gap-2.5 p-3 flex-shrink-0" style="border-top: 1px solid #f3f4f6">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style="background: {user.avatar_url || user.picture ? 'transparent' : 'linear-gradient(135deg, #f97316, #ea580c)'}; overflow: hidden">
        {#if user.avatar_url || user.picture}
          <img src={user.avatar_url || user.picture} alt="" class="w-full h-full object-cover" />
        {:else}
          <span class="text-[0.6rem] font-bold text-white">{(user.display_name || user.username || 'U')[0]?.toUpperCase()}</span>
        {/if}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium truncate m-0" style="color: #111827">{user.display_name || user.username}</p>
        {#if user.email}
          <p class="text-[0.6rem] truncate m-0" style="color: #9ca3af">{user.email}</p>
        {/if}
      </div>
    </div>
  {/if}
</aside>
