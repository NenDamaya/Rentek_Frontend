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

  function handleConsultAI(e) {
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
    <span class="animate-pulse text-accent"><img src="/rentek-white.png" alt="Rentek" class="w-[72px] h-[72px] object-contain" /></span>
    <p>Cargando Rentek E-Commerce...</p>
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
      on:close={() => isChatOpen = false}
      on:logout={handleLogout}
    />
  </div>
{:else}
  <Login on:login={handleLogin} />
{/if}

