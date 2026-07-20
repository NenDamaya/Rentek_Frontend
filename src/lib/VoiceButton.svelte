<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'
  import { API_BASE } from './api.js'

  export let disabled = false
  const dispatch = createEventDispatcher()

  let isRecording = false
  let speechSupported = false
  let mediaRecorderSupported = false
  let secureContext = false
  let recognition = null
  let audioChunks = []
  let mediaStream = null
  let mediaRecorder = null
  let errorMsg = ''

  onMount(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    speechSupported = !!SpeechRecognition
    mediaRecorderSupported = !!window.MediaRecorder
    secureContext = window.isSecureContext
  })

  onDestroy(() => {
    if (recognition) recognition.abort()
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop())
  })

  function showError(msg) {
    errorMsg = msg
    setTimeout(() => { errorMsg = '' }, 4000)
  }

  async function toggle() {
    if (disabled) return
    if (isRecording) { stop(); return }
    errorMsg = ''

    if (speechSupported) {
      startWebSpeech()
    } else if (mediaRecorderSupported && secureContext) {
      await startMediaRecorder()
    } else if (mediaRecorderSupported && !secureContext) {
      showError('Micrófono requiere HTTPS')
    } else {
      showError('Voz no soportada en este navegador')
    }
  }

  function startWebSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => { isRecording = true }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      dispatch('transcript', transcript)
    }

    recognition.onerror = (event) => {
      isRecording = false
      if (event.error === 'not-allowed') {
        showError('Permiso de micrófono denegado')
      } else if (event.error === 'no-speech') {
        showError('No se detectó voz')
      } else if (event.error !== 'aborted') {
        showError(`Error de voz: ${event.error}`)
      }
    }

    recognition.onend = () => { isRecording = false }

    try {
      recognition.start()
    } catch (err) {
      isRecording = false
      showError('No se pudo iniciar el micrófono')
    }
  }

  async function startMediaRecorder() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunks = []

      mediaRecorder = new MediaRecorder(mediaStream, { mimeType: getSupportedMimeType() })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        isRecording = false
        mediaStream.getTracks().forEach(t => t.stop())
        mediaStream = null

        if (audioChunks.length === 0) return
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType })
        await sendAudioForTranscription(blob)
      }

      mediaRecorder.start()
      isRecording = true

      setTimeout(() => {
        if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 15000)
    } catch (err) {
      isRecording = false
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showError('Permiso de micrófono denegado')
      } else if (err.name === 'NotFoundError') {
        showError('No se encontró micrófono')
      } else {
        showError('Error al acceder al micrófono')
      }
    }
  }

  function getSupportedMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t
    }
    return 'audio/webm'
  }

  async function sendAudioForTranscription(blob) {
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      const token = localStorage.getItem('rentek_token')
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.text) dispatch('transcript', data.text)
      } else {
        showError('Error al transcribir audio')
      }
    } catch (err) {
      showError('Error de conexión al transcribir')
    }
  }

  function stop() {
    if (recognition) { recognition.abort(); recognition = null }
    if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop() }
    else { isRecording = false }
  }
</script>

<div class="relative">
  <button
    class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer border-none transition-all
      {isRecording
        ? 'bg-red text-white shadow-[0_0_16px_rgba(220,38,38,0.3)]'
        : disabled
          ? 'bg-surface-hover text-text-disabled'
          : 'bg-surface-alt text-text-muted border border-border hover:border-accent hover:text-accent'}"
    on:click={toggle}
    disabled={disabled}
    title={isRecording ? 'Detener' : speechSupported ? 'Hablar (Web Speech)' : mediaRecorderSupported ? 'Hablar (Grabar audio)' : 'Sin soporte de voz'}>
    {#if isRecording}
      <LucideIcons name="square" size={18} />
    {:else}
      <LucideIcons name="mic" size={18} />
    {/if}
  </button>

  {#if errorMsg}
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-red text-white shadow-lg z-50">
      {errorMsg}
    </div>
  {/if}
</div>
