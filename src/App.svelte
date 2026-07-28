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

  let activeTab = 'catalog'
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

  async function handleAddToCart(e) {
    const cartItem = e.detail
    saveCart([...cart, cartItem])
    const token = localStorage.getItem('rentek_token')
    if (token && user) {
      try {
        const { addToCart } = await import('./lib/api.js')
        await addToCart({
          maquina_nombre: cartItem.item?.nombre || cartItem.maquina_nombre,
          duration: cartItem.duration || 1,
          duration_unit: cartItem.durationUnit || 'dias',
          start_date: cartItem.startDate || '',
          cantidad: 1,
        }, token)
      } catch {}
    }
    isCartOpen = true
  }

  function handleRemoveFromCart(e) {
    const idx = e.detail
    saveCart(cart.filter((_, i) => i !== idx))
    const token = localStorage.getItem('rentek_token')
    const removedItem = cart[idx]
    if (token && removedItem?.id) {
      import('./lib/api.js').then(m => m.removeFromCart(removedItem.id, token)).catch(() => {})
    }
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
