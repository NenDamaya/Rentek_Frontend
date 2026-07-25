<script>
  import { onMount } from 'svelte'
  import Login from './lib/Login.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Catalog from './lib/Catalog.svelte'
  import ProjectsView from './lib/ProjectsView.svelte'
  import QuotesView from './lib/QuotesView.svelte'
  import CartDrawer from './lib/CartDrawer.svelte'
  import ChatDrawer from './lib/ChatDrawer.svelte'
  import LucideIcons from './lib/LucideIcons.svelte'

  let user = null
  let checked = false

  let activeTab = 'catalog' // 'catalog' | 'projects' | 'orders'
  let isCartOpen = false
  let isChatOpen = false
  let cart = []

  onMount(() => {
    const stored = localStorage.getItem('rentek_user')
    const token = localStorage.getItem('rentek_token')
    if (stored && token) {
      try {
        user = JSON.parse(stored)
      } catch {}
    }

    try {
      const storedCart = localStorage.getItem('rentek_cart')
      if (storedCart) cart = JSON.parse(storedCart)
    } catch {}

    checked = true
  })

  function saveCart(newCart) {
    cart = newCart
    try {
      localStorage.setItem('rentek_cart', JSON.stringify(cart))
    } catch {}
  }

  function handleAddToCart(e) {
    const cartItem = e.detail
    saveCart([...cart, cartItem])
    isCartOpen = true
  }

  function handleRemoveFromCart(e) {
    const idx = e.detail
    saveCart(cart.filter((_, i) => i !== idx))
  }

  function handleClearCart() {
    saveCart([])
  }

  let initialChatQuery = ''

  function handleConsultAI(e) {
    const item = e.detail?.item || e.detail
    if (item && item.nombre) {
      initialChatQuery = `Hola, necesito asesoría sobre la máquina "${item.nombre}" (${item.categoria || 'Maquinaria'}). ¿Podrías darme sus especificaciones técnicas clave y recomendarme si es adecuada para mi obra?`
    } else if (typeof e.detail === 'string') {
      initialChatQuery = e.detail
    } else {
      initialChatQuery = ''
    }
    isChatOpen = true
  }

  function handleLogin(e) {
    user = e.detail
  }

  function handleLogout() {
    localStorage.removeItem('rentek_token')
    localStorage.removeItem('rentek_user')
    user = null
  }
</script>

{#if !checked}
  <div class="flex flex-col items-center justify-center h-screen gap-3 bg-bg text-text-faint">
    <span class="animate-pulse"><img src="/rentek-white.png" alt="Rentek" class="w-[72px] h-[72px] object-contain [filter:brightness(0)_saturate(100%)_invert(73%)_sepia(85%)_saturate(1200%)_hue-rotate(355deg)]" /></span>
    <span class="font-black text-2xl text-amber-500 tracking-wider">RENTEK</span>
    <p class="text-xs text-text-muted">Cargando E-Commerce...</p>
  </div>
{:else if user}
  <div class="min-h-screen bg-bg text-text flex flex-col font-sans">
    <Navbar
      {user}
      cartItemsCount={cart.length}
      {activeTab}
      {isChatOpen}
      on:navigate={(e) => activeTab = e.detail}
      on:toggleCart={() => isCartOpen = !isCartOpen}
      on:toggleChat={() => isChatOpen = !isChatOpen}
      on:logout={handleLogout}
    />

    <main class="flex-1 pb-16 md:pb-0">
      {#if activeTab === 'catalog'}
        <Catalog
          on:addToCart={handleAddToCart}
          on:consultAI={handleConsultAI}
          on:toggleChat={() => isChatOpen = true}
        />
      {:else if activeTab === 'projects'}
        <ProjectsView
          on:consultAI={handleConsultAI}
        />
      {:else if activeTab === 'orders'}
        <QuotesView />
      {/if}
    </main>

    <CartDrawer
      {cart}
      {user}
      isOpen={isCartOpen}
      on:close={() => isCartOpen = false}
      on:removeFromCart={handleRemoveFromCart}
      on:clearCart={handleClearCart}
      on:orderCreated={() => {
        saveCart([])
        activeTab = 'orders'
      }}
    />

    <ChatDrawer
      isOpen={isChatOpen}
      {user}
      initialQuery={initialChatQuery}
      on:close={() => isChatOpen = false}
      on:logout={handleLogout}
    />
  </div>
{:else}
  <Login on:login={handleLogin} />
{/if}

