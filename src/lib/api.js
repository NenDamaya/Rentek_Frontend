export const API_BASE = import.meta.env.VITE_API_URL || 'https://washroom-raffle-unharmed.ngrok-free.dev'

const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  'User-Agent': 'rentek-app/1.0',
}

export async function chatCompletions(messages, tools, conversationId = null, userName = null) {
  const body = { messages, tools }
  if (conversationId) body.conversation_id = conversationId
  if (userName) body.user_name = userName

  const res = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function* chatCompletionsStream(messages, tools, conversationId = null, chatId = null, signal = null, userName = null) {
  const body = { messages, tools, stream: true }
  if (conversationId) body.conversation_id = conversationId
  if (chatId) body.chat_id = chatId
  if (userName) body.user_name = userName

  const res = await fetch(`${API_BASE}/v1/chat/completions/stream`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6)
        if (data === '[DONE]') return
        try {
          yield JSON.parse(data)
        } catch {}
      }
    }
  }
}

export async function getObservabilityLogs(limit = 50) {
  const res = await fetch(`${API_BASE}/api/observability?limit=${limit}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
