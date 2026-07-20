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
  let abortController = null
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
    abortController = new AbortController()

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

      const userName = user?.display_name || user?.username || null
      for await (const event of chatCompletionsStream(messages, tools, conversationId, currentChatId, abortController.signal, userName)) {
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
      abortController = null
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

  function handleVoiceInterim(event) {
    if (event.detail) {
      input = event.detail
    }
  }

  function scrollDown() {
    setTimeout(() => { if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight }, 50)
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function stopStream() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }
</script>

<div class="flex h-screen w-full bg-bg">
  {#if sidebarOpen && !isDesktop}
    <div class="fixed inset-0 z-40 bg-black/50 md:hidden" on:click={closeSidebar} role="presentation"></div>
  {/if}

  <div class="fixed md:relative z-50 h-full transition-transform duration-200 ease-in-out
    {sidebarOpen || isDesktop ? 'translate-x-0' : '-translate-x-full'}">
    <Sidebar {user} {currentChatId} {refreshKey} on:select={handleSelectChat} on:close={closeSidebar} {isDesktop} />
  </div>

  <div class="flex flex-col h-screen flex-1 min-w-0">
    <header class="flex items-center gap-3 px-4 py-3 shrink-0 bg-surface border-b border-border">
      <button class="md:hidden p-2 rounded-lg transition-colors text-text-muted hover:bg-surface-alt" on:click={toggleSidebar}>
        <LucideIcons name="menu" size={20} />
      </button>
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-accent to-accent-hover text-white">
          <img src="/rentek-white.png" alt="Rentek" class="w-7 h-7 object-contain" />
        </div>
        <div>
          <h1 class="text-sm font-bold text-text m-0">Asesor de Maquinaria</h1>
          <p class="text-[0.65rem] text-text-faint m-0">Renta de equipo pesado</p>
        </div>
      </div>
      <div class="flex items-center gap-2 ml-auto">
        {#if user?.display_name || user?.username}
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-alt border border-border">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold bg-accent text-white">
              {(user.display_name || user.username)[0]?.toUpperCase()}
            </div>
            <span class="text-xs font-medium hidden sm:inline text-text-2">{user.display_name || user.username}</span>
          </div>
        {/if}
        <button class="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all cursor-pointer border-none bg-surface-alt text-text-muted border border-border hover:bg-red-light hover:border-red-border hover:text-red"
          on:click={() => dispatch('logout')} title="Cerrar sesion">
          <LucideIcons name="log-out" size={14} />
          <span class="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto scroll-smooth bg-bg" bind:this={chatContainer}>
      <div class="max-w-3xl mx-auto px-4 py-6">
        {#each messages as msg, i (i)}
          <Message role={msg.role} content={msg.content} toolCalls={msg.toolCalls} streaming={msg.streaming} />
        {/each}
        {#if loading}
          <div class="flex items-center gap-3 py-4 ml-11">
            {#if loadStatus === 'thinking'}
              <div class="relative flex items-center justify-center w-9 h-9">
                <span class="absolute inset-0 rounded-full animate-ping border-2 border-accent opacity-30"></span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center bg-accent-light border border-accent-border">
                  <LucideIcons name="brain" size={18} />
                </div>
              </div>
              <span class="text-sm font-medium text-accent">Pensando...</span>
            {:else if loadStatus === 'searching'}
              <div class="relative flex items-center justify-center w-9 h-9">
                <span class="absolute inset-0 rounded-full animate-ping border-2 border-blue opacity-30"></span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center bg-blue-light border border-blue-border">
                  <LucideIcons name="search" size={18} />
                </div>
              </div>
              <span class="text-sm font-medium text-blue">Buscando...</span>
            {:else if loadStatus === 'executing'}
              <div class="relative flex items-center justify-center w-9 h-9">
                <span class="absolute inset-0 rounded-full animate-ping border-2 border-amber opacity-30"></span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center bg-amber-light border border-amber-border">
                  <LucideIcons name="cog" size={18} />
                </div>
              </div>
              <span class="text-sm font-medium text-amber">Ejecutando...</span>
            {:else}
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full animate-bounce bg-text-disabled" style="animation-delay:0s"></span>
                <span class="w-2 h-2 rounded-full animate-bounce bg-text-disabled" style="animation-delay:0.15s"></span>
                <span class="w-2 h-2 rounded-full animate-bounce bg-text-disabled" style="animation-delay:0.3s"></span>
              </div>
            {/if}
          </div>
        {/if}
        {#if statusText && loadStatus !== 'thinking' && loadStatus !== 'searching' && loadStatus !== 'executing'}
          <div class="flex items-center gap-2 ml-11 px-3 py-2 text-xs rounded-lg w-fit mb-3 bg-blue-light text-blue border-l-3 border-blue">
            <LucideIcons name="zap" size={12} />
            {statusText}
          </div>
        {/if}
      </div>
    </div>

    <div class="shrink-0 bg-surface border-t border-border">
      <form class="max-w-3xl mx-auto flex gap-3 px-4 py-3 items-end" on:submit|preventDefault={send}>
        <VoiceButton on:transcript={handleVoice} on:interim={handleVoiceInterim} disabled={loading} />
        <div class="flex-1 relative">
          <textarea
            bind:value={input}
            on:keydown={handleKeydown}
            placeholder="Escribe tu pregunta..."
            rows="1"
            disabled={loading}
            class="w-full resize-none outline-none text-sm leading-relaxed max-h-[120px] min-h-[44px] transition-colors bg-surface-alt border border-text-disabled rounded-xl text-text py-[11px] px-4 font-[inherit] focus:border-accent"
          ></textarea>
        </div>
        {#if loading}
          <button type="button" on:click={stopStream}
            class="w-[44px] h-[44px] rounded-full border-none cursor-pointer shrink-0 flex items-center justify-center transition-all shadow-sm bg-red text-white hover:bg-red/90"
            title="Detener generación">
            <LucideIcons name="square" size={18} />
          </button>
        {:else}
          <button type="submit" disabled={!input.trim()}
            class="w-[44px] h-[44px] rounded-full border-none cursor-pointer shrink-0 flex items-center justify-center transition-all shadow-sm
              {!input.trim()
                ? 'bg-text-disabled text-text-faint'
                : 'bg-accent text-white'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        {/if}
      </form>
    </div>
  </div>
</div>
