<script>
  import { onMount } from 'svelte'
  import Message from './Message.svelte'
  import VoiceButton from './VoiceButton.svelte'
  import { chatCompletions, chatCompletionsStream, API_BASE } from './api.js'

  let messages = []
  let input = ''
  let loading = false
  let chatContainer
  let tools = []
  let conversationId = null
  let streaming = false
  let statusText = ''

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/tools`)
      const data = await res.json()
      tools = data.tools || []
    } catch {
      console.warn('No se pudieron cargar tools, el backend usará defaults')
    }
    messages = [{ role: 'assistant', content: '¡Hola! Soy tu asesor de maquinaria pesada. ¿En qué puedo ayudarte?' }]
  })

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    input = ''
    loading = true
    streaming = true

    messages = [...messages, { role: 'user', content: text }]
    scrollDown()

    try {
      let fullContent = ''
      let toolCallsFound = []
      let currentConversationId = conversationId

      for await (const event of chatCompletionsStream(messages, tools, currentConversationId)) {
        if (event.type === 'ttft') {
          statusText = `Primer token en ${event.ms}ms`
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
    }
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

<div class="chat">
  <header class="header">
    <h1>🏗️ Asesor de Maquinaria</h1>
    <div class="header-badges">
      <span class="badge">Function Calling</span>
      <span class="badge badge-green">Streaming</span>
      {#if conversationId}
        <span class="badge badge-blue">Sesión activa</span>
      {/if}
    </div>
  </header>

  <div class="messages" bind:this={chatContainer}>
    {#each messages as msg, i (i)}
      <Message role={msg.role} content={msg.content} toolCalls={msg.toolCalls} streaming={msg.streaming} />
    {/each}
    {#if loading && !streaming}
      <div class="typing">
        <span class="dot" />
        <span class="dot" />
        <span class="dot" />
      </div>
    {/if}
    {#if statusText}
      <div class="status-bar">
        <span class="status-icon">⚡</span>
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

<style>
  .chat {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .header h1 {
    font-size: 1.1em;
    font-weight: 600;
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
  }
  .status-icon {
    font-size: 1em;
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
