<script>
  import { onMount, createEventDispatcher, tick } from 'svelte'
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
  let textareaEl
  let tools = []
  let conversationId = null
  let currentChatId = null
  let streaming = false
  let statusText = ''
  let abortController = null
  let loadStatus = ''
  let refreshKey = 0
  let sidebarOpen = false
  let userScrolledUp = false
  let chatStatus = null
  let userBlocked = false
  let contextTokens = 0
  let maxContext = 8192
  let wasCompacted = false

  $: contextPercent = Math.min(100, Math.round((contextTokens / maxContext) * 100))
  $: isHighContext = contextPercent >= 75

  $: {
    if (messages && messages.length > 0) {
      const text = messages.map(m => m.content || '').join(' ')
      const estimated = Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.3)
      if (!contextTokens || estimated > contextTokens) {
        contextTokens = estimated
      }
    } else {
      contextTokens = 0
    }
  }

  $: showScrollBtn = !streaming && userScrolledUp

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

  function saveLocalMessages(chatId, msgs) {
    if (!chatId || chatId === 'undefined' || !msgs) return
    try {
      localStorage.setItem(`rentek_msgs_${chatId}`, JSON.stringify(msgs))
    } catch {}
  }

  function getLocalMessages(chatId) {
    if (!chatId || chatId === 'undefined') return null
    try {
      const raw = localStorage.getItem(`rentek_msgs_${chatId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  async function selectChat(e) {
    const chatId = (e && typeof e === 'object' && 'detail' in e) ? e.detail : e
    if (chatId === currentChatId && chatId !== null) return
    currentChatId = chatId
    contextTokens = 0
    wasCompacted = false
    if (!chatId || chatId === 'undefined') {
      currentChatId = null
      chatStatus = null
      conversationId = null
      messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
      return
    }

    const localMsgs = getLocalMessages(chatId)
    if (localMsgs && localMsgs.length > 0) {
      messages = localMsgs
    } else {
      messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
    }

    const token = localStorage.getItem('rentek_token')
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/chats/${chatId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
        })
        if (res.ok) {
          const data = await res.json()
          chatStatus = data.chat_status || null
          conversationId = data.conversation_id || null
          if (data.messages && data.messages.length > 0) {
            messages = data.messages.filter(m => m.role === 'user' || m.role === 'assistant')
            saveLocalMessages(chatId, messages)
          }
        }
      } catch {}
    }
    scrollDown(true)
  }

  function handleEditMessage(e, index) {
    if (loading) return
    const textToEdit = e.detail?.content || ''
    messages = messages.slice(0, index)
    input = textToEdit
  }

  function adjustTextareaHeight() {
    if (!textareaEl) return
    textareaEl.style.height = 'auto'
    const newHeight = Math.min(textareaEl.scrollHeight, 180)
    textareaEl.style.height = `${newHeight}px`
  }

  $: if (input !== undefined) {
    if (typeof window !== 'undefined') {
      setTimeout(adjustTextareaHeight, 0)
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    input = ''
    if (textareaEl) textareaEl.style.height = 'auto'
    loading = true
    streaming = true
    abortController = new AbortController()

    if (!currentChatId) {
      currentChatId = crypto.randomUUID()
      const newChatObj = { id: currentChatId, title: text.slice(0, 35) + (text.length > 35 ? '...' : ''), created_at: new Date().toISOString(), has_solicitud: false }
      try {
        const raw = localStorage.getItem('rentek_local_chats')
        const list = raw ? JSON.parse(raw) : []
        localStorage.setItem('rentek_local_chats', JSON.stringify([newChatObj, ...list]))
      } catch {}
      refreshKey++

      const token = localStorage.getItem('rentek_token')
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/api/chats`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
            body: JSON.stringify({ id: currentChatId }),
          })
          if (res.status === 403) {
            userBlocked = true
            loading = false
            streaming = false
            return
          }
          if (res.ok) {
            updateChatTitle(currentChatId, text)
          }
        } catch {}
      }
    } else {
      updateChatTitle(currentChatId, text)
    }

    messages = [...messages, { role: 'user', content: text }]
    scrollDown(true)

    try {
      let fullContent = ''
      let toolCallsFound = []
      let responseTokens = 0

      const token = localStorage.getItem('rentek_token')
      const userName = user?.display_name || user?.username || null
      const userEmail = user?.email || null
      for await (const event of chatCompletionsStream(messages, tools, conversationId, currentChatId, abortController.signal, userName, userEmail, token)) {
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
          if (event.tokens) responseTokens = event.tokens
          if (event.context_tokens) contextTokens = event.context_tokens
          if (event.max_context) maxContext = event.max_context
          if (event.was_compacted) {
            messages = [...messages, { role: 'system', content: '✨ Memoria sintetizada: Se condensó el historial anterior para mantener las respuestas rápidas. Todas tus restricciones (terreno, pasillo y equipos) permanecen a salvo.' }]
          }
        } else if (event.type === 'error') {
          fullContent = event.content || 'Error desconocido'
        }
      }

      if (fullContent === 'Por seguridad, este chat fue cerrado.') {
        chatStatus = 'closed_security'
      }

      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'assistant') {
        messages = [...messages.slice(0, -1), { role: 'assistant', content: fullContent, streaming: false, tokens: responseTokens }]
      } else {
        messages = [...messages, { role: 'assistant', content: fullContent, streaming: false, tokens: responseTokens }]
      }
      scrollDown(true)
    } catch (err) {
      messages = [...messages, { role: 'assistant', content: `Error: ${err.message}` }]
      scrollDown(true)
    } finally {
      loading = false
      streaming = false
      statusText = ''
      loadStatus = ''
      abortController = null
      saveLocalMessages(currentChatId, messages)
      tick().then(() => textareaEl?.focus())
    }
  }

  async function updateChatTitle(chatId, firstMessage) {
    if (!chatId || chatId === 'undefined') return
    const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '')
    try {
      const raw = localStorage.getItem('rentek_local_chats')
      if (raw) {
        const list = JSON.parse(raw)
        const idx = list.findIndex(c => c.id === chatId)
        if (idx !== -1) {
          list[idx].title = title
          localStorage.setItem('rentek_local_chats', JSON.stringify(list))
        }
      }
    } catch {}

    const token = localStorage.getItem('rentek_token')
    if (!token) {
      refreshKey++
      return
    }
    try {
      await fetch(`${API_BASE}/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'rentek-app/1.0' },
        body: JSON.stringify({ title }),
      })
      refreshKey++
    } catch {}
  }

  function handleVoice(event) { input = event.detail; send() }

  function handleVoiceInterim(event) {
    if (event.detail) {
      input = event.detail
    }
  }

  async function scrollDown(force = false) {
    if (!chatContainer) return
    await tick()
    if (force) {
      chatContainer.scrollTop = chatContainer.scrollHeight
      return
    }
    const threshold = 150
    const atBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < threshold
    if (atBottom) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }

  function handleScroll() {
    if (!chatContainer) return
    const threshold = 150
    userScrolledUp = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight > threshold
  }

  function scrollToBottom() {
    if (!chatContainer) return
    chatContainer.scrollTop = chatContainer.scrollHeight
    userScrolledUp = false
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
    <Sidebar {user} {currentChatId} {refreshKey} on:select={handleSelectChat} on:close={closeSidebar} on:logout={() => dispatch('logout')} {isDesktop} />
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
        {#if messages && messages.length > 1}
          <div class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-surface-alt border border-border text-xs shadow-xs"
               title="Uso de Memoria/Contexto: {contextTokens.toLocaleString()} de {maxContext.toLocaleString()} tokens">
            <div class="flex items-center gap-1 sm:gap-1.5 text-text-muted font-medium">
              <LucideIcons name="brain" size={14} class="shrink-0" />
              <span class="font-bold text-text-2 hidden xs:inline">Contexto:</span>
              <span class="font-mono text-xs font-semibold {contextPercent > 75 ? 'text-red font-bold' : contextPercent > 50 ? 'text-amber font-bold' : 'text-accent'}">
                {contextPercent}%
              </span>
            </div>
            <div class="w-10 xs:w-14 sm:w-20 h-2 rounded-full bg-border overflow-hidden relative shrink-0">
              <div class="h-full transition-all duration-500 rounded-full {contextPercent > 75 ? 'bg-red' : contextPercent > 50 ? 'bg-amber' : 'bg-accent'}"
                   style="width: {contextPercent}%"></div>
            </div>
          </div>
        {/if}
      </div>
    </header>

    {#if isHighContext}
      <div class="bg-amber-light border-b border-amber-border px-4 py-2 flex items-center justify-between text-xs text-amber font-medium shrink-0 animate-fadeIn">
        <div class="flex items-center gap-2">
          <LucideIcons name="alert-triangle" size={14} />
          <span>Este chat ha alcanzado el <strong>{contextPercent}%</strong> de la ventana de contexto. Para proyectos nuevos, te sugerimos iniciar un <strong>Nuevo Chat</strong> para mantener la precisión.</span>
        </div>
        <button class="px-2.5 py-1 rounded bg-amber text-white text-[0.7rem] font-bold hover:bg-amber-hover transition-colors border-none cursor-pointer shrink-0 ml-2"
                on:click={() => selectChat({ detail: null })}>
          + Nuevo Chat
        </button>
      </div>
    {/if}

    <div class="flex-1 overflow-y-auto scroll-smooth bg-bg" bind:this={chatContainer} on:scroll={handleScroll}>
      <div class="max-w-3xl mx-auto px-4 py-6">
        {#each messages as msg, i (i)}
          <Message role={msg.role} content={msg.content} toolCalls={msg.toolCalls} streaming={msg.streaming} tokens={msg.tokens} on:edit={(e) => handleEditMessage(e, i)} />
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

    {#if showScrollBtn}
      <button on:click={scrollToBottom}
        class="fixed bottom-28 right-7 w-10 h-10 rounded-full border-none shadow-lg cursor-pointer flex items-center justify-center z-50 bg-accent text-white hover:bg-accent-hover transition-all"
        title="Ir al final">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    {/if}

    {#if userBlocked}
      <div class="shrink-0 bg-surface border-t border-border">
        <div class="max-w-3xl mx-auto px-4 py-4 text-center">
          <div class="flex items-center justify-center gap-2 text-red font-medium text-sm">
            <LucideIcons name="ban" size={16} />
            <span>Tu cuenta ha sido bloqueada por medidas de seguridad.</span>
          </div>
        </div>
      </div>
    {:else if chatStatus === 'closed_security'}
      <div class="shrink-0 bg-surface border-t border-border">
        <div class="max-w-3xl mx-auto px-4 py-4 text-center">
          <div class="flex items-center justify-center gap-2 text-amber font-medium text-sm">
            <LucideIcons name="lock" size={16} />
            <span>Por seguridad, este chat fue cerrado.</span>
          </div>
        </div>
      </div>
    {:else}
    <div class="shrink-0 bg-bg pb-4 pt-2 px-4">
      <form class="max-w-3xl mx-auto bg-surface border border-border rounded-2xl p-2 shadow-sm focus-within:border-accent focus-within:shadow-md transition-all" on:submit|preventDefault={send}>
        <div class="flex items-end gap-2">
          <VoiceButton on:transcript={handleVoice} on:interim={handleVoiceInterim} disabled={loading} />
          <textarea
            bind:this={textareaEl}
            bind:value={input}
            on:input={adjustTextareaHeight}
            on:keydown={handleKeydown}
            placeholder="Escribe tu pregunta..."
            rows="1"
            disabled={loading}
            class="flex-1 resize-none outline-none text-sm leading-relaxed max-h-[180px] min-h-[38px] bg-transparent border-none text-text py-2 px-2 font-[inherit] overflow-y-auto"
          ></textarea>
          {#if loading}
            <button type="button" on:click={stopStream}
              class="w-[38px] h-[38px] rounded-xl border-none cursor-pointer shrink-0 flex items-center justify-center transition-all shadow-sm bg-red text-white hover:bg-red/90 mb-0.5"
              title="Detener generación">
              <LucideIcons name="square" size={16} />
            </button>
          {:else}
            <button type="submit" disabled={!input.trim()}
              class="w-[38px] h-[38px] rounded-xl border-none cursor-pointer shrink-0 flex items-center justify-center transition-all shadow-sm mb-0.5
                {!input.trim()
                  ? 'bg-surface-alt text-text-disabled'
                  : 'bg-accent text-white hover:bg-accent-hover'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          {/if}
        </div>
      </form>
    </div>
    {/if}
  </div>
</div>
