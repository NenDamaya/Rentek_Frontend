<script>
  import { createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'
  import Chat from './Chat.svelte'

  export let isOpen = false
  export let user = null
  export let initialQuery = ''

  const dispatch = createEventDispatcher()

  let chatRef = null
  let contextPercent = 0

  function close() {
    dispatch('close')
  }

  function handleToggleSidebar() {
    if (chatRef) chatRef.toggleSidebar()
  }

  function handleNewChat() {
    if (chatRef) chatRef.newChat()
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
    
    <!-- Backdrop -->
    <div class="fixed inset-0" on:click={close} on:keydown={(e) => e.key === 'Escape' && close()} role="button" tabindex="0" aria-label="Cerrar chat"></div>

    <!-- Slide drawer -->
    <div class="relative w-full sm:max-w-2xl bg-surface border-l border-border h-full shadow-2xl flex flex-col z-10 animate-slide-in">
      
      <!-- Unified Drawer Header -->
      <div class="p-3 sm:p-4 border-b border-border flex items-center justify-between bg-surface/95 shrink-0 gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <LucideIcons icon="sparkles" class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <h2 class="text-sm font-bold text-text truncate flex items-center gap-1.5">
              Asesor IA
              <span class="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">RAG</span>
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            on:click={handleToggleSidebar}
            class="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all bg-surface-alt hover:bg-surface-hover text-text border border-border flex items-center gap-1 shadow-xs"
            title="Ver historial de conversaciones"
          >
            <LucideIcons name="menu" size={14} />
            <span class="hidden xs:inline">Chats</span>
          </button>

          <button
            on:click={handleNewChat}
            class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shadow-xs"
            title="Nueva consulta"
          >
            <LucideIcons name="plus" size={14} />
            <span class="hidden xs:inline">Nuevo</span>
          </button>

          <div class="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-surface-alt border border-border text-xs shadow-xs"
               title="Uso de ventana de contexto: {contextPercent}%">
            <LucideIcons name="brain" size={14} class="shrink-0 text-indigo-400" />
            <span class="font-mono text-xs font-bold {contextPercent > 75 ? 'text-red' : contextPercent > 50 ? 'text-amber' : 'text-indigo-400'}">
              {contextPercent}%
            </span>
          </div>

          <button on:click={close} class="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-hover border border-border/50 transition-colors">
            <LucideIcons icon="x" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Chat Embedded Body -->
      <div class="flex-1 overflow-hidden min-h-0">
        <Chat bind:this={chatRef} bind:contextPercent={contextPercent} {user} isDrawer={true} on:logout />
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
