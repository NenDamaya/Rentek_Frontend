<script>
  import { createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'
  import Chat from './Chat.svelte'

  export let isOpen = false
  export let user = null
  export let initialQuery = ''

  const dispatch = createEventDispatcher()

  function close() {
    dispatch('close')
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
    
    <!-- Backdrop -->
    <div class="fixed inset-0" on:click={close}></div>

    <!-- Slide drawer -->
    <div class="relative w-full max-w-2xl bg-surface border-l border-border h-full shadow-2xl flex flex-col z-10 animate-slide-in">
      
      <!-- Drawer Header -->
      <div class="p-4 border-b border-border flex items-center justify-between bg-surface/90">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <LucideIcons icon="sparkles" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-text flex items-center gap-2">
              Asesor Inteligente de Maquinaria
              <span class="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">RAG + Ollama</span>
            </h2>
            <p class="text-xs text-text-faint">Consulta requerimientos técnicos, normas de seguridad y recomendaciones</p>
          </div>
        </div>
        <button on:click={close} class="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover">
          <LucideIcons icon="x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Chat Embedded Body -->
      <div class="flex-1 overflow-hidden">
        <Chat {user} on:logout />
      </div>

    </div>

  </div>
{/if}

<style>
  @keyframes slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .animate-slide-in {
    animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
</style>
