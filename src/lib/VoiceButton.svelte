<script>
  import { createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'

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

      recognition.onerror = () => {
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
    {disabled}
    title={recording ? 'Detener grabación' : 'Grabar voz'}
    type="button"
  >
    {#if recording}
      <LucideIcons name="square" size={18} />
    {:else}
      <LucideIcons name="mic" size={18} />
    {/if}
  </button>
{/if}

<style>
  .voice-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .voice-btn:hover:not(:disabled) {
    background: var(--color-surface-2);
  }
  .voice-btn.recording {
    background: #ef4444;
    border-color: #ef4444;
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
