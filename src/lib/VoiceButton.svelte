<script>
  import { createEventDispatcher } from 'svelte'

  export let disabled = false

  const dispatch = createEventDispatcher()

  let recording = false
  let recognition = null
  let supported = false

  if (typeof window !== 'undefined') {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      supported = true
      recognition = new SpeechRecognition()
      recognition.lang = 'es-MX'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        dispatch('transcript', transcript)
        recording = false
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        recording = false
      }

      recognition.onend = () => {
        recording = false
      }
    }
  }

  function toggleRecording() {
    if (!recognition) return

    if (recording) {
      recognition.stop()
      recording = false
    } else {
      recognition.start()
      recording = true
    }
  }
</script>

{#if supported}
  <button
    class="voice-btn"
    class:recording
    on:click={toggleRecording}
    disabled={disabled}
    title={recording ? 'Detener grabación' : 'Grabar voz'}
    type="button"
  >
    {#if recording}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>
    {:else}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
    {/if}
  </button>
{/if}

<style>
  .voice-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    background: var(--surface-2, #2a2a2a);
    color: var(--text, #fff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .voice-btn:hover:not(:disabled) {
    background: var(--surface-3, #3a3a3a);
  }

  .voice-btn.recording {
    background: #ef4444;
    animation: pulse 1.5s infinite;
  }

  .voice-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  }
</style>
