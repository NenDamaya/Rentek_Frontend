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
    } catch {}
    messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
  })

  function toggleSidebar() { sidebarOpen = !sidebarOpen }
  function closeSidebar() { sidebarOpen = false }

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
        headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
      })
      const data = await res.json()
      conversationId = data.conversation_id || null
      messages = data.messages?.length > 0
        ? data.messages.filter(m => m.role === 'user' || m.role === 'assistant')
        : [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
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
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
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

      for await (const event of chatCompletionsStream(messages, tools, conversationId, currentChatId)) {
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
          if (last?.role === 'assistant') {
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
      if (lastMsg?.role === 'assistant') {
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
        body: JSON.stringify({ title }),
      })
    } catch {}
  }

  function handleVoice(event) { input = event.detail; send() }

  function scrollDown() {
    setTimeout(() => { if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight }, 50)
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }
</script>

<div class="flex h-screen w-full" style="background: #0c1222">
  {#if sidebarOpen && !isDesktop}
    <div class="fixed inset-0 z-40 md:hidden" style="background: rgba(0,0,0,0.6)" on:click={closeSidebar} role="presentation"></div>
  {/if}

  <div class="fixed md:relative z-50 h-full transition-transform duration-200 ease-in-out
    {sidebarOpen || isDesktop ? 'translate-x-0' : '-translate-x-full'}">
    <Sidebar {user} {currentChatId} {refreshKey} on:select={handleSelectChat} on:close={closeSidebar} {isDesktop} />
  </div>

  <div class="flex flex-col h-screen flex-1 min-w-0">
    <header class="flex items-center gap-3 px-4 py-3 flex-shrink-0" style="background: #111a2e; border-bottom: 1px solid #1e2d4a">
      <button class="md:hidden p-2 rounded-lg transition-colors" style="color: #94a3b8" on:click={toggleSidebar}
        on:mouseenter={e => e.target.style.background = '#1e2d4a'} on:mouseleave={e => e.target.style.background = 'transparent'}>
        <LucideIcons name="menu" size={20} />
      </button>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #3b82f6, #2563eb)">
          <LucideIcons name="hardhat" size={18} />
        </div>
        <div>
          <h1 class="text-sm font-semibold" style="color: #e2e8f0">Asesor de Maquinaria</h1>
          <p class="text-[0.6rem] hidden sm:block" style="color: #64748b">Renta de equipo pesado</p>
        </div>
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <div class="hidden md:flex items-center gap-1.5">
          <span class="text-[0.6rem] px-2 py-0.5 rounded-full font-medium" style="background: rgba(59,130,246,0.15); color: #60a5fa">AI</span>
          <span class="text-[0.6rem] px-2 py-0.5 rounded-full font-medium" style="background: rgba(34,197,94,0.15); color: #4ade80">Live</span>
        </div>
        {#if user?.display_name || user?.username}
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background: #1a2540">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold" style="background: #3b82f6; color: white">
              {(user.display_name || user.username)[0]?.toUpperCase()}
            </div>
            <span class="text-xs font-medium" style="color: #cbd5e1">{user.display_name || user.username}</span>
          </div>
        {/if}
        <button class="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all" style="color: #94a3b8; background: #1a2540"
          on:mouseenter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
          on:mouseleave={e => { e.currentTarget.style.background = '#1a2540'; e.currentTarget.style.color = '#94a3b8' }}
          on:click={() => dispatch('logout')} title="Cerrar sesion">
          <LucideIcons name="log-out" size={14} />
          <span class="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto scroll-smooth" style="background: #0c1222" bind:this={chatContainer}>
      <div class="max-w-3xl mx-auto px-4 py-6">
        {#each messages as msg, i (i)}
          <Message role={msg.role} content={msg.content} toolCalls={msg.toolCalls} streaming={msg.streaming} />
        {/each}
        {#if loading}
          <div class="flex items-center gap-3 py-4 ml-11">
            {#if loadStatus === 'thinking'}
              <div class="relative flex items-center justify-center w-9 h-9">
                <span class="absolute inset-0 rounded-full animate-ping" style="border: 2px solid #a855f7; opacity: 0.4"></span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background: rgba(168,85,247,0.15)">
                  <LucideIcons name="brain" size={18} />
                </div>
              </div>
              <span class="text-sm" style="color: #a855f7">Pensando...</span>
            {:else if loadStatus === 'searching'}
              <div class="relative flex items-center justify-center w-9 h-9">
                <span class="absolute inset-0 rounded-full animate-ping" style="border: 2px solid #3b82f6; opacity: 0.4"></span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background: rgba(59,130,246,0.15)">
                  <LucideIcons name="search" size={18} />
                </div>
              </div>
              <span class="text-sm" style="color: #3b82f6">Buscando...</span>
            {:else if loadStatus === 'executing'}
              <div class="relative flex items-center justify-center w-9 h-9">
                <span class="absolute inset-0 rounded-full animate-ping" style="border: 2px solid #f59e0b; opacity: 0.4"></span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background: rgba(245,158,11,0.15)">
                  <LucideIcons name="cog" size={18} />
                </div>
              </div>
              <span class="text-sm" style="color: #f59e0b">Ejecutando...</span>
            {:else}
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full animate-bounce" style="background: #64748b; animation-delay:0s"></span>
                <span class="w-2 h-2 rounded-full animate-bounce" style="background: #64748b; animation-delay:0.15s"></span>
                <span class="w-2 h-2 rounded-full animate-bounce" style="background: #64748b; animation-delay:0.3s"></span>
              </div>
            {/if}
          </div>
        {/if}
        {#if statusText && loadStatus !== 'thinking' && loadStatus !== 'searching' && loadStatus !== 'executing'}
          <div class="flex items-center gap-2 ml-11 px-3 py-2 text-xs rounded-lg w-fit mb-3"
            style="background: #1a2540; color: #94a3b8; border-left: 3px solid #3b82f6">
            <LucideIcons name="zap" size={12} />
            {statusText}
          </div>
        {/if}
      </div>
    </div>

    <div class="flex-shrink-0" style="background: #111a2e; border-top: 1px solid #1e2d4a">
      <form class="max-w-3xl mx-auto flex gap-3 px-4 py-3 items-end" on:submit|preventDefault={send}>
        <VoiceButton on:transcript={handleVoice} disabled={loading} />
        <div class="flex-1 relative">
          <textarea
            bind:value={input}
            on:keydown={handleKeydown}
            placeholder="Escribe tu pregunta..."
            rows="1"
            disabled={loading}
            class="w-full resize-none outline-none text-sm leading-relaxed max-h-[120px] min-h-[44px] transition-colors"
            style="background: #1a2540; border: 1px solid #2a3a5c; border-radius: 12px; color: #e2e8f0; padding: 11px 16px; font-family: inherit"
            on:focus={e => e.target.style.borderColor = '#3b82f6'}
            on:blur={e => e.target.style.borderColor = '#2a3a5c'}
          ></textarea>
        </div>
        <button type="submit" disabled={loading || !input.trim()}
          class="w-[44px] h-[44px] rounded-full border-none cursor-pointer flex-shrink-0 flex items-center justify-center transition-all text-white"
          style="background: {(loading || !input.trim()) ? '#1e2d4a' : '#3b82f6'}; color: {(loading || !input.trim()) ? '#475569' : 'white'}">
          {#if loading}
            <span class="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></span>
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>
