<script>
  import { createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'

  export let user = null
  export let cartItemsCount = 0
  export let activeTab = 'catalog' // 'catalog' | 'projects' | 'orders'
  export let isChatOpen = false

  const dispatch = createEventDispatcher()

  let userMenuOpen = false

  function toggleCart() {
    dispatch('toggleCart')
  }

  function toggleChat() {
    dispatch('toggleChat')
  }

  function setTab(tab) {
    activeTab = tab
    dispatch('navigate', tab)
  }

  function handleLogout() {
    dispatch('logout')
  }
</script>

<header class="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      
      <!-- Brand Logo -->
      <div class="flex items-center gap-3 cursor-pointer" on:click={() => setTab('catalog')}>
        <img src="/rentek-white.png" alt="Rentek Logo" class="w-9 h-9 object-contain transform hover:scale-105 transition-transform" />
        <div>
          <span class="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
            RENTEK
          </span>
          <span class="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            E-Commerce
          </span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="hidden md:flex items-center space-x-1">
        <button
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 {activeTab === 'catalog' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-text-muted hover:text-text hover:bg-surface-hover'}"
          on:click={() => setTab('catalog')}
        >
          <LucideIcons icon="grid" class="w-4 h-4" />
          Catálogo
        </button>
        <button
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 {activeTab === 'projects' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-text-muted hover:text-text hover:bg-surface-hover'}"
          on:click={() => setTab('projects')}
        >
          <LucideIcons icon="hard-hat" class="w-4 h-4" />
          Proyectos
        </button>
        <button
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 {activeTab === 'orders' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-text-muted hover:text-text hover:bg-surface-hover'}"
          on:click={() => setTab('orders')}
        >
          <LucideIcons icon="file-text" class="w-4 h-4" />
          Cotizaciones
        </button>
      </nav>

      <!-- Right Actions: Cart, AI Chat, User -->
      <div class="flex items-center gap-3">
        
        <!-- AI Advisor Toggle Button -->
        <button
          on:click={toggleChat}
          class="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm border {isChatOpen ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'}"
          title="Consultar al Asesor IA con RAG"
        >
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <LucideIcons icon="sparkles" class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Asesor IA</span>
        </button>

        <!-- Shopping Cart Button -->
        <button
          on:click={toggleCart}
          class="relative p-2 rounded-xl text-text-muted hover:text-amber-400 hover:bg-surface-hover transition-all flex items-center justify-center border border-border"
          aria-label="Carrito de renta"
        >
          <LucideIcons icon="shopping-cart" class="w-5 h-5" />
          {#if cartItemsCount > 0}
            <span class="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md animate-bounce">
              {cartItemsCount}
            </span>
          {/if}
        </button>

        <!-- User Menu -->
        <div class="relative">
          <button
            on:click={() => userMenuOpen = !userMenuOpen}
            class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-hover border border-border/50 text-left"
          >
            <div class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span class="hidden lg:inline text-xs font-medium text-text max-w-[120px] truncate">
              {user?.name || user?.email || 'Usuario'}
            </span>
            <LucideIcons icon="chevron-down" class="w-3.5 h-3.5 text-text-faint" />
          </button>

          {#if userMenuOpen}
            <!-- Dropdown backdrop -->
            <div class="fixed inset-0 z-10" on:click={() => userMenuOpen = false}></div>
            
            <div class="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-border shadow-2xl py-2 z-20">
              <div class="px-4 py-2 border-b border-border/60">
                <p class="text-xs font-medium text-text truncate">{user?.name || 'Cliente Rentek'}</p>
                <p class="text-[10px] text-text-muted truncate">{user?.email || 'cliente@rentek.com'}</p>
              </div>
              <button
                on:click={() => { userMenuOpen = false; setTab('orders'); }}
                class="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-text hover:bg-surface-hover flex items-center gap-2"
              >
                <LucideIcons icon="file-text" class="w-3.5 h-3.5" />
                Mis Cotizaciones
              </button>
              <button
                on:click={handleLogout}
                class="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
              >
                <LucideIcons icon="log-out" class="w-3.5 h-3.5" />
                Cerrar Sesión
              </button>
            </div>
          {/if}
        </div>

      </div>

    </div>
  </div>
</header>

<!-- Mobile Bottom Navigation Bar -->
<nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-lg border-t border-border flex items-center justify-around py-2 px-1 shadow-2xl">
  <button
    on:click={() => setTab('catalog')}
    class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all {activeTab === 'catalog' && !isChatOpen ? 'text-amber-400 font-bold' : 'text-text-muted'}"
  >
    <LucideIcons icon="grid" class="w-5 h-5" />
    <span class="text-[10px]">Catálogo</span>
  </button>

  <button
    on:click={() => setTab('projects')}
    class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all {activeTab === 'projects' && !isChatOpen ? 'text-amber-400 font-bold' : 'text-text-muted'}"
  >
    <LucideIcons icon="hard-hat" class="w-5 h-5" />
    <span class="text-[10px]">Proyectos</span>
  </button>

  <button
    on:click={() => setTab('orders')}
    class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all {activeTab === 'orders' && !isChatOpen ? 'text-amber-400 font-bold' : 'text-text-muted'}"
  >
    <LucideIcons icon="file-text" class="w-5 h-5" />
    <span class="text-[10px]">Cotizaciones</span>
  </button>

  <button
    on:click={toggleChat}
    class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all {isChatOpen ? 'text-indigo-400 font-bold' : 'text-indigo-300'}"
  >
    <LucideIcons icon="sparkles" class="w-5 h-5" />
    <span class="text-[10px]">Asesor IA</span>
  </button>
</nav>

