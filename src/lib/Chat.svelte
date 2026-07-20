<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import Message from './Message.svelte'
  import VoiceButton from './VoiceButton.svelte'
  import Sidebar from './Sidebar.svelte'
  import LucideIcons from './LucideIcons.svelte'
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
  let sidebarOpen = false

  $: isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768

  onMount(async () => {
    isDesktop = window.innerWidth >= 768
    window.addEventListener('resize', () => {
      isDesktop = window.innerWidth >= 768
      if (isDesktop) sidebarOpen = false
    })

    try {
      const res = await fetch(`${API_BASE}/v1/tools`, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
      })
      const data = await res.json()
      tools = data.tools || []
    } catch {
      console.warn('No se pudieron cargar tools')
    }
    messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
  })

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen
  }

  function closeSidebar() {
    sidebarOpen = false
  }

  function handleSelectChat(e) {
    selectChat(e)
    if (!isDesktop) sidebarOpen = false
  }

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
        messages = data.messages.filter(m => m.role === 'user' || m.role === 'assistant')
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
            messages = [...messages.slice(0, -1), { role: 'assistant', content: fullContent, streaming: true }]
          } else {
            messages = [...messages, { role: 'assistant', content: fullContent, streaming: true }]
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
        messages = [...messages.slice(0, -1), { role: 'assistant', content: fullContent, streaming: false }]
      } else {
        messages = [...messages, { role: 'assistant', content: fullContent, streaming: false }]
      }
      scrollDown()
    } catch (err) {
      messages = [...messages, { role: 'assistant', content: `Error: ${err.message}` }]
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
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight
    }, 50)
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }
</script>

<div class="flex h-screen w-full bg-bg">
  {#if sidebarOpen && !isDesktop}
    <div class="fixed inset-0 bg-black/50 z-40 md:hidden" on:click={closeSidebar} role="presentation"></div>
  {/if}

  <div class="fixed md:relative z-50 h-full transition-transform duration-200 ease-in-out
    {sidebarOpen || isDesktop ? 'translate-x-0' : '-translate-x-full'}">
    <Sidebar {user} {currentChatId} {refreshKey} on:select={handleSelectChat} on:close={closeSidebar} {isDesktop} />
  </div>

  <div class="flex flex-col h-screen flex-1 min-w-0">
    <header class="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 shadow-sm bg-bg">
      <button class="md:hidden p-1.5 rounded-lg hover:bg-surface-2 transition-colors" on:click={toggleSidebar}>
        <LucideIcons name="menu" size={20} />
      </button>
      <h1 class="text-sm md:text-base font-semibold flex items-center gap-2">
        <LucideIcons name="hardhat" size={20} />
        <span class="hidden sm:inline">Asesor de Maquinaria</span>
      </h1>
      <div class="flex items-center gap-2 ml-auto">
        <div class="hidden sm:flex gap-1.5">
          <span class="text-[0.6rem] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Function Calling</span>
          <span class="text-[0.6rem] uppercase tracking-wider bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">Streaming</span>
          {#if user?.display_name || user?.username}
            <span class="text-[0.6rem] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <LucideIcons name="user" size={10} /> {user.display_name || user.username}
            </span>
          {/if}
        </div>
        <button class="flex items-center gap-1.5 text-xs text-text-muted border border-border px-2.5 py-1.5 rounded-lg hover:bg-error/10 hover:text-error hover:border-error transition-colors" on:click={() => dispatch('logout')} title="Cerrar sesión">
          <LucideIcons name="log-out" size={14} />
          <span class="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 md:p-5 scroll-smooth" bind:this={chatContainer}>
      {#each messages as msg, i (i)}
        <Message role={msg.role} content={msg.content} toolCalls={msg.toolCalls} streaming={msg.streaming} />
      {/each}
      {#if loading}
        <div class="flex gap-1 py-3 ml-11">
          {#if loadStatus === 'thinking'}
            <span class="relative flex items-center justify-center w-8 h-8">
              <span class="absolute w-full h-full rounded-full border-2 border-purple-500 animate-ping opacity-60"></span>
              <LucideIcons name="brain" size={20} />
            </span>
          {:else if loadStatus === 'searching'}
            <span class="relative flex items-center justify-center w-8 h-8">
              <span class="absolute w-full h-full rounded-full border-2 border-blue-500 animate-ping opacity-60"></span>
              <LucideIcons name="search" size={20} />
            </span>
          {:else if loadStatus === 'executing'}
            <span class="relative flex items-center justify-center w-8 h-8">
              <span class="absolute w-full h-full rounded-full border-2 border-amber-500 animate-ping opacity-60"></span>
              <LucideIcons name="cog" size={20} />
            </span>
          {:else}
            <span class="w-2 h-2 bg-text-muted rounded-full animate-bounce" style="animation-delay:0s"></span>
            <span class="w-2 h-2 bg-text-muted rounded-full animate-bounce" style="animation-delay:0.2s"></span>
            <span class="w-2 h-2 bg-text-muted rounded-full animate-bounce" style="animation-delay:0.4s"></span>
          {/if}
        </div>
      {/if}
      {#if statusText}
        <div class="flex items-center gap-1.5 ml-11 px-3 py-2 text-xs text-text-muted bg-surface-2 rounded-lg w-fit mb-2
          {loadStatus === 'thinking' ? 'border-l-3 border-purple-500' : ''}
          {loadStatus === 'searching' ? 'border-l-3 border-blue-500' : ''}
          {loadStatus === 'executing' ? 'border-l-3 border-amber-500' : ''}">
          {#if loadStatus === 'thinking'}
            <LucideIcons name="brain" size={14} />
          {:else if loadStatus === 'searching'}
            <LucideIcons name="search" size={14} />
          {:else if loadStatus === 'executing'}
            <LucideIcons name="cog" size={14} />
          {:else}
            <LucideIcons name="zap" size={14} />
          {/if}
          {statusText}
        </div>
      {/if}
    </div>

    <form class="flex gap-2 p-3 border-t border-border flex-shrink-0 items-end bg-bg shadow-[0_-2px_10px_rgba(0,0,0,0.1)]" on:submit|preventDefault={send}>
      <VoiceButton on:transcript={handleVoice} disabled={loading} />
      <textarea
        bind:value={input}
        on:keydown={handleKeydown}
        placeholder="Pregunta sobre maquinaria pesada..."
        rows="1"
        disabled={loading}
        class="flex-1 bg-surface border border-border rounded-xl text-text px-3 py-2.5 text-sm font-[inherit] resize-none outline-none leading-relaxed max-h-[120px] min-h-[44px] focus:border-primary disabled:opacity-50 transition-colors"
      ></textarea>
      <button type="submit" disabled={loading || !input.trim()}
        class="w-[44px] h-[44px] rounded-full border-none bg-primary text-white text-lg cursor-pointer flex-shrink-0 flex items-center justify-center hover:bg-primary-hover disabled:opacity-40 disabled:cursor-default transition-colors">
        {loading ? '...' : '\u27A4'}
      </button>
    </form>
  </div>
</div>
