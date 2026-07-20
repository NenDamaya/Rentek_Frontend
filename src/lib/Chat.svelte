<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import Message from './Message.svelte'
  import VoiceButton from './VoiceButton.svelte'
  import Sidebar from './Sidebar.svelte'
  import { chatCompletions, chatCompletionsStream, API_BASE } from './api.js'

  export let user = null
  const dispatch = createEventDispatcher()

  let messages = []
  let input = ''
  let loading = false
  let chatContainer
  let tools = []
  let conversationId = null
  let currentChatId = null
  let streaming = false
  let statusText = ''
  let loadStatus = ''
  let refreshKey = 0

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/tools`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'rentek-app/1.0',
        },
      })
      const data = await res.json()
      tools = data.tools || []
    } catch {
      console.warn('No se pudieron cargar tools, el backend usará defaults')
    }
    messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
  })

  async function selectChat(e) {
    const chatId = e.detail
    if (chatId === currentChatId) return
    currentChatId = chatId

    if (!chatId) {
      conversationId = null
      messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
      return
    }

    const token = localStorage.getItem('rentek_token')
    try {
      const res = await fetch(`${API_BASE}/api/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'rentek-app/1.0',
        },
      })
      const data = await res.json()
      conversationId = data.conversation_id || null
      if (data.messages && data.messages.length > 0) {
        messages = data.messages
      } else {
        messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
      }
    } catch {
      conversationId = null
      messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
    }
    scrollDown()
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    input = ''
    loading = true
    streaming = true

    if (!currentChatId) {
      const token = localStorage.getItem('rentek_token')
      if (token) {
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
          currentChatId = chat.id
          refreshKey++
          updateChatTitle(chat.id, text)
        } catch {}
      }
    } else {
      updateChatTitle(currentChatId, text)
    }

    messages = [...messages, { role: 'user', content: text }]
    scrollDown()

    try {
      let fullContent = ''
      let toolCallsFound = []
      let currentConversationId = conversationId

      for await (const event of chatCompletionsStream(messages, tools, currentConversationId, currentChatId)) {
        if (event.type === 'status') {
          loadStatus = event.status
          if (event.status === 'thinking') statusText = 'Pensando...'
          else if (event.status === 'searching') statusText = 'Buscando en base de conocimiento...'
          else if (event.status === 'executing') statusText = 'Ejecutando herramienta...'
        } else if (event.type === 'ttft') {
          statusText = `Primer token en ${event.ms}ms`
          loadStatus = 'streaming'
        } else if (event.type === 'token') {
          fullContent += event.content
          const last = messages[messages.length - 1]
          if (last && last.role === 'assistant') {
            messages = [...messages.slice(0, -1), {
              role: 'assistant',
              content: fullContent,
              streaming: true,
            }]
          } else {
            messages = [...messages, {
              role: 'assistant',
              content: fullContent,
              streaming: true,
            }]
          }
          scrollDown()
        } else if (event.type === 'tool_calls') {
          toolCallsFound = event.calls || []
          statusText = `Ejecutando: ${toolCallsFound.map(c => c.name).join(', ')}`
        } else if (event.type === 'done') {
          conversationId = event.conversation_id
        } else if (event.type === 'error') {
          fullContent = event.content || 'Error desconocido'
        }
      }

      const lastMsg = messages[messages.length - 1]
      if (lastMsg && lastMsg.role === 'assistant') {
        messages = [...messages.slice(0, -1), {
          role: 'assistant',
          content: fullContent,
          toolCalls: toolCallsFound,
          streaming: false,
        }]
      } else {
        messages = [...messages, {
          role: 'assistant',
          content: fullContent,
          toolCalls: toolCallsFound,
          streaming: false,
        }]
      }
      scrollDown()

    } catch (err) {
      messages = [...messages, { role: 'assistant', content: `❌ Error: ${err.message}` }]
      scrollDown()
    } finally {
      loading = false
      streaming = false
      statusText = ''
      loadStatus = ''
    }
  }

  async function updateChatTitle(chatId, firstMessage) {
    const token = localStorage.getItem('rentek_token')
    if (!token) return
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
    try {
      await fetch(`${API_BASE}/api/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'rentek-app/1.0',
        },
        body: JSON.stringify({ title }),
      })
    } catch {}
  }

  function handleVoice(event) {
    input = event.detail
    send()
  }

  function scrollDown() {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 50)
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }
</script>

<div class="app-layout">
  <Sidebar {user} {currentChatId} {refreshKey} on:select={selectChat} />

  <div class="chat">
    <header class="header">
      <h1>🏗️ Asesor de Maquinaria</h1>
      <div class="header-right">
        <div class="header-badges">
          <span class="badge">Function Calling</span>
          <span class="badge badge-green">Streaming</span>
          {#if user?.display_name || user?.username}
            <span class="badge badge-blue">👤 {user.display_name || user.username}</span>
          {/if}
        </div>
        <button class="logout-btn" on:click={() => dispatch('logout')} title="Cerrar sesión">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>

    <div class="messages" bind:this={chatContainer}>
      {#each messages as msg, i (i)}
        <Message role={msg.role} content={msg.content} toolCalls={msg.toolCalls} streaming={msg.streaming} />
      {/each}
      {#if loading && !streaming}
        <div class="typing">
          {#if loadStatus === 'thinking'}
            <span class="status-indicator thinking">
              <span class="pulse-ring" />
              <span class="status-emoji">🧠</span>
            </span>
          {:else if loadStatus === 'searching'}
            <span class="status-indicator searching">
              <span class="pulse-ring search-ring" />
              <span class="status-emoji">🔍</span>
            </span>
          {:else if loadStatus === 'executing'}
            <span class="status-indicator executing">
              <span class="pulse-ring exec-ring" />
              <span class="status-emoji">⚙️</span>
            </span>
          {:else}
            <span class="dot" /><span class="dot" /><span class="dot" />
          {/if}
        </div>
      {/if}
      {#if statusText}
        <div class="status-bar" class:thinking={loadStatus === 'thinking'} class:searching={loadStatus === 'searching'} class:executing={loadStatus === 'executing'}>
          {#if loadStatus === 'thinking'}
            <span class="status-icon">🧠</span>
          {:else if loadStatus === 'searching'}
            <span class="status-icon">🔍</span>
          {:else if loadStatus === 'executing'}
            <span class="status-icon">⚙️</span>
          {:else}
            <span class="status-icon">⚡</span>
          {/if}
          {statusText}
        </div>
      {/if}
    </div>

    <form class="input-bar" on:submit|preventDefault={send}>
      <VoiceButton on:transcript={handleVoice} disabled={loading} />
      <textarea
        bind:value={input}
        on:keydown={handleKeydown}
        placeholder="Pregunta sobre maquinaria pesada..."
        rows="1"
        disabled={loading}
      />
      <button type="submit" disabled={loading || !input.trim()}>
        {loading ? '...' : '➤'}
      </button>
    </form>
  </div>
</div>

<style>
  .app-layout {
    display: flex;
    height: 100vh;
    width: 100%;
  }
  .chat {
    display: flex;
    flex-direction: column;
    height: 100vh;
    flex: 1;
    min-width: 0;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .header h1 {
    font-size: 1em;
    font-weight: 600;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
  }
  .header-badges {
    display: flex;
    gap: 6px;
  }
  .badge {
    background: var(--primary);
    color: white;
    font-size: 0.65em;
    padding: 2px 8px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-green { background: #22c55e; }
  .badge-blue { background: #3b82f6; }
  .logout-btn {
    background: none;
    border: 1px solid var(--border, #444);
    color: var(--text-muted, #888);
    cursor: pointer;
    font-size: 0.75em;
    padding: 6px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s, color 0.15s;
  }
  .logout-btn:hover {
    background: #ef444420;
    color: #ef4444;
    border-color: #ef4444;
  }
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    scroll-behavior: smooth;
  }
  .messages::-webkit-scrollbar {
    width: 6px;
  }
  .messages::-webkit-scrollbar-thumb {
    background: var(--surface-2);
    border-radius: 3px;
  }
  .typing {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    margin-left: 44px;
  }
  .dot {
    width: 8px;
    height: 8px;
    background: var(--text-muted);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
  }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
  .status-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    margin-left: 44px;
    font-size: 0.8em;
    color: var(--text-muted);
    background: var(--surface-2);
    border-radius: 8px;
    width: fit-content;
    transition: all 0.3s ease;
  }
  .status-bar.thinking { border-left: 3px solid #a855f7; }
  .status-bar.searching { border-left: 3px solid #3b82f6; }
  .status-bar.executing { border-left: 3px solid #f59e0b; }
  .status-icon { font-size: 1em; }
  .status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 32px;
    height: 32px;
  }
  .status-emoji {
    font-size: 1.2em;
    z-index: 1;
    animation: float 2s ease-in-out infinite;
  }
  .pulse-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid #a855f7;
    animation: pulse-ring 1.5s ease-out infinite;
  }
  .search-ring { border-color: #3b82f6; }
  .exec-ring { border-color: #f59e0b; }
  @keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  .input-bar {
    display: flex;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    align-items: flex-end;
  }
  .input-bar textarea {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    padding: 10px 14px;
    font-size: 0.95em;
    font-family: inherit;
    resize: none;
    outline: none;
    line-height: 1.4;
    max-height: 120px;
  }
  .input-bar textarea:focus {
    border-color: var(--primary);
  }
  .input-bar textarea:disabled {
    opacity: 0.5;
  }
  .input-bar button[type="submit"] {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    background: var(--primary);
    color: white;
    font-size: 1.2em;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .input-bar button[type="submit"]:hover:not(:disabled) {
    background: var(--primary-hover);
  }
  .input-bar button[type="submit"]:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
