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
    if (!token) {
      loadingChats = false
      return
    }
    if (chats.length === 0) loadingChats = true
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

<aside class="h-full flex flex-col w-[260px] bg-surface border-r border-border">
  <div class="flex items-center justify-between p-4 shrink-0 border-b border-border-light">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-accent to-accent-hover text-white">
        <img src="/rentek-white.png" alt="Rentek" class="w-7 h-7 object-contain" />
      </div>
      <span class="text-sm font-bold text-text">Rentek</span>
    </div>
    {#if !isDesktop}
      <button class="p-2 rounded-lg transition-colors text-text-muted hover:bg-surface-alt"
        on:click={() => dispatch('close')}>
        <LucideIcons name="x" size={18} />
      </button>
    {/if}
  </div>

  <button class="flex items-center gap-2.5 w-[calc(100%-24px)] mx-3 mt-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-none bg-surface-alt text-text border border-border hover:border-accent hover:bg-accent-light"
    on:click={newChat}>
    <LucideIcons name="search" size={16} />
    <span>Nueva consulta</span>
  </button>

  <div class="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
    {#if loadingChats}
      <div class="flex flex-col items-center justify-center py-8 gap-2">
        <span class="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full text-text-disabled"></span>
        <span class="text-xs text-text-faint">Cargando...</span>
      </div>
    {:else if chats.length === 0}
      <div class="flex flex-col items-center justify-center py-8 gap-2 text-text-disabled">
        <LucideIcons name="bot" size={28} />
        <span class="text-xs">Sin conversaciones</span>
      </div>
    {:else}
      {#each chats as chat, i (chat.id)}
        <button class="relative group flex items-center gap-2.5 w-[calc(100%-8px)] px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border-none
          {currentChatId === chat.id
            ? 'bg-accent-light text-text'
            : 'bg-transparent text-text-muted hover:bg-surface-alt'}"
          on:click={() => selectChat(chat.id)}>

          {#if deleteConfirmId === chat.id}
            <div class="absolute inset-0 flex items-center justify-between px-3 py-1 rounded-xl z-20 bg-red-light border border-red-border shadow-md animate-fadeIn">
              {#if chat.has_solicitud}
                <div class="flex-1 min-w-0 pr-2">
                  <span class="text-[0.65rem] font-bold text-red block truncate">⚠️ ¡Atención! Cita vinculada</span>
                  <span class="text-[0.55rem] text-red leading-none block">Se cancelará tu cita registrada.</span>
                </div>
                <div class="flex gap-1 shrink-0">
                  <button class="px-2 py-1 rounded text-[0.6rem] font-bold transition-all cursor-pointer border-none bg-red text-white hover:bg-red-hover"
                    on:click={(e) => deleteChat(e, chat.id)} title="Cancelar cita y borrar chat">Sí, borrar</button>
                  <button class="px-2 py-1 rounded text-[0.6rem] font-medium transition-all cursor-pointer border-none bg-surface-hover text-text-muted"
                    on:click={(e) => { e.stopPropagation(); deleteConfirmId = null }}>No</button>
                </div>
              {:else}
                <span class="text-[0.65rem] font-medium text-red">¿Eliminar chat?</span>
                <div class="flex gap-1 shrink-0">
                  <button class="px-2 py-1 rounded text-[0.6rem] font-medium transition-all cursor-pointer border-none bg-red text-white"
                    on:click={(e) => deleteChat(e, chat.id)}>Sí</button>
                  <button class="px-2 py-1 rounded text-[0.6rem] font-medium transition-all cursor-pointer border-none bg-surface-hover text-text-muted"
                    on:click={(e) => { e.stopPropagation(); deleteConfirmId = null }}>No</button>
                </div>
              {/if}
            </div>
          {/if}

          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
            {currentChatId === chat.id ? 'bg-accent-border text-accent' : 'bg-surface-hover text-text-muted'}">
            {#if chat.has_solicitud}
              <LucideIcons name="calendar-check" size={15} class="text-accent" />
            {:else}
              <LucideIcons name="bot" size={14} />
            {/if}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1">
              <p class="text-xs font-medium truncate m-0 flex-1
                {currentChatId === chat.id ? 'text-text font-semibold' : 'text-text-2'}">
                {chat.title || 'Nueva conversación'}
              </p>
              {#if chat.has_solicitud}
                <span class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[0.55rem] font-bold bg-accent-light text-accent border border-accent-border shrink-0" title="Cita o Cotización registrada en este chat">
                  <LucideIcons name="check-circle-2" size={9} />
                  <span>Cita</span>
                </span>
              {/if}
            </div>
            <p class="text-[0.6rem] m-0 text-text-faint">
              {getRelativeTime(chat.updated_at || chat.created_at)}
            </p>
          </div>

          {#if !deleteConfirmId}
            <button class="p-1.5 rounded-lg md:opacity-0 md:group-hover:opacity-100 opacity-60 transition-all cursor-pointer border-none bg-transparent text-red hover:bg-red-light"
              on:click={(e) => confirmDelete(e, chat.id)} title="Eliminar chat">
              <LucideIcons name="trash-2" size={13} />
            </button>
          {/if}
        </button>
      {/each}
    {/if}
  </div>

  {#if user}
    <div class="flex items-center gap-2.5 p-3 shrink-0 border-t border-border-light">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden
        {user.avatar_url || user.picture ? '' : 'bg-gradient-to-br from-accent to-accent-hover'}">
        {#if user.avatar_url || user.picture}
          <img src={user.avatar_url || user.picture} alt="" class="w-full h-full object-cover" />
        {:else}
          <span class="text-[0.6rem] font-bold text-white">{(user.display_name || user.username || 'U')[0]?.toUpperCase()}</span>
        {/if}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium truncate m-0 text-text">{user.display_name || user.username}</p>
        {#if user.email}
          <p class="text-[0.6rem] truncate m-0 text-text-faint">{user.email}</p>
        {/if}
      </div>
      <button class="p-1.5 rounded-lg transition-all cursor-pointer border-none bg-transparent text-text-muted hover:bg-red-light hover:text-red shrink-0"
        on:click={() => dispatch('logout')} title="Cerrar sesión">
        <LucideIcons name="log-out" size={16} />
      </button>
    </div>
  {/if}
</aside>
