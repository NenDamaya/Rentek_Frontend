<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import { API_BASE } from './api.js'

  const dispatch = createEventDispatcher()

  export let currentChatId = null
  export let user = null
  export let refreshKey = 0

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
      if (currentChatId === chatId) {
        dispatch('select', null)
      }
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
    if (diff < 172800000) return 'Ayer'
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    {#if user?.picture}
      <img src={user.picture} alt="" class="avatar-img" />
    {:else}
      <span class="user-avatar">👤</span>
    {/if}
    <span class="user-name">{user?.display_name || user?.username || 'Usuario'}</span>
  </div>

  <button class="new-chat-btn" on:click={newChat} disabled={loading}>
    <span>+</span> Nuevo chat
  </button>

  <div class="chat-list">
    {#each chats as chat (chat.id)}
      <button
        class="chat-item"
        class:active={chat.id === currentChatId}
        on:click={() => selectChat(chat.id)}
      >
        <div class="chat-title">{chat.title}</div>
        <div class="chat-meta">
          <span>{formatDate(chat.updated_at)}</span>
          <button class="delete-btn" on:click|stopPropagation={() => deleteChat(chat.id)} title="Eliminar">✕</button>
        </div>
      </button>
    {/each}

    {#if chats.length === 0}
      <p class="empty">No hay chats aún</p>
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    width: 260px;
    background: var(--surface, #1a1a1a);
    border-right: 1px solid var(--border, #333);
    display: flex;
    flex-direction: column;
    height: 100vh;
    flex-shrink: 0;
  }
  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-bottom: 1px solid var(--border, #333);
  }
  .avatar-img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }
  .user-name {
    font-size: 0.9em;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .new-chat-btn {
    margin: 12px;
    padding: 10px 14px;
    border: 1px dashed var(--border, #444);
    border-radius: 8px;
    background: transparent;
    color: var(--text, #fff);
    font-size: 0.85em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;
  }
  .new-chat-btn:hover:not(:disabled) {
    background: var(--surface-2, #2a2a2a);
  }
  .new-chat-btn:disabled {
    opacity: 0.5;
  }
  .new-chat-btn span {
    font-size: 1.2em;
    font-weight: 300;
  }
  .chat-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;
  }
  .chat-list::-webkit-scrollbar {
    width: 4px;
  }
  .chat-list::-webkit-scrollbar-thumb {
    background: var(--surface-2, #333);
    border-radius: 2px;
  }
  .chat-item {
    width: 100%;
    text-align: left;
    padding: 10px 12px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text, #fff);
    cursor: pointer;
    margin-bottom: 2px;
    transition: background 0.15s;
  }
  .chat-item:hover {
    background: var(--surface-2, #2a2a2a);
  }
  .chat-item.active {
    background: var(--surface-3, #333);
  }
  .chat-title {
    font-size: 0.85em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chat-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    font-size: 0.7em;
    color: var(--text-muted, #666);
  }
  .delete-btn {
    background: none;
    border: none;
    color: var(--text-muted, #666);
    cursor: pointer;
    font-size: 0.9em;
    padding: 2px 4px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .chat-item:hover .delete-btn {
    opacity: 1;
  }
  .delete-btn:hover {
    background: #ef444420;
    color: #ef4444;
  }
  .empty {
    text-align: center;
    color: var(--text-muted, #666);
    font-size: 0.8em;
    padding: 20px;
  }
</style>
