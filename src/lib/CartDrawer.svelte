<script>
  import { createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'

  export let cart = []
  export let isOpen = false

  const dispatch = createEventDispatcher()

  let isCheckout = false
  let quoteSuccess = null

  // Checkout form fields
  let projectName = ''
  let siteLocation = ''
  let contactPhone = ''
  let notes = ''
  let submitting = false

  $: subtotal = cart.reduce((acc, i) => acc + (i.calculatedTotal || 0), 0)
  $: transportEstimate = cart.length > 0 ? 3500 * cart.length : 0
  $: iva = Math.round((subtotal + transportEstimate) * 0.16)
  $: grandTotal = subtotal + transportEstimate + iva

  function removeItem(index) {
    dispatch('removeFromCart', index)
  }

  function clearCart() {
    dispatch('clearCart')
  }

  function handleProcessCheckout() {
    if (cart.length === 0) return
    isCheckout = true
  }

  function handleConfirmOrder() {
    if (!projectName.trim() || !siteLocation.trim() || !contactPhone.trim()) {
      alert('Por favor completa el nombre del proyecto, ubicación de la obra y teléfono de contacto.')
      return
    }

    submitting = true
    setTimeout(() => {
      const quoteId = `RTK-${Math.floor(100000 + Math.random() * 900000)}`
      const orderData = {
        id: quoteId,
        date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
        items: [...cart],
        projectName,
        siteLocation,
        contactPhone,
        notes,
        subtotal,
        transportEstimate,
        iva,
        grandTotal,
        status: 'Cotización Generada - En Revisión'
      }

      // Save to localStorage orders list
      try {
        const existing = JSON.parse(localStorage.getItem('rentek_quotes') || '[]')
        existing.unshift(orderData)
        localStorage.setItem('rentek_quotes', JSON.stringify(existing))
      } catch {}

      quoteSuccess = orderData
      submitting = false
      dispatch('orderCreated', orderData)
    }, 800)
  }

  function close() {
    isCheckout = false
    quoteSuccess = null
    dispatch('close')
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
    
    <!-- Drawer backdrop -->
    <div class="fixed inset-0" on:click={close}></div>

    <!-- Drawer Panel -->
    <div class="relative w-full max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col z-10 animate-slide-in">
      
      <!-- Header -->
      <div class="p-5 border-b border-border flex items-center justify-between bg-surface/90">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <LucideIcons icon="shopping-bag" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-text">Carrito de Cotización</h2>
            <p class="text-xs text-text-faint">{cart.length} equipo(s) seleccionado(s)</p>
          </div>
        </div>
        <button on:click={close} class="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover">
          <LucideIcons icon="x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Success Screen -->
      {#if quoteSuccess}
        <div class="flex-1 p-6 overflow-y-auto flex flex-col justify-center items-center text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h3 class="text-xl font-bold text-text">¡Cotización Solicitada!</h3>
          <p class="text-xs text-text-faint max-w-xs">
            Se ha creado tu solicitud de renta <span class="font-mono text-amber-400 font-bold">{quoteSuccess.id}</span> para el proyecto <span class="text-text font-semibold">{quoteSuccess.projectName}</span>.
          </p>

          <div class="w-full bg-bg p-4 rounded-xl border border-border text-left space-y-2 text-xs">
            <div class="flex justify-between border-b border-border/50 pb-2">
              <span class="text-text-muted">Folio de Cotización:</span>
              <span class="font-mono text-amber-400 font-bold">{quoteSuccess.id}</span>
            </div>
            <div class="flex justify-between border-b border-border/50 pb-2">
              <span class="text-text-muted">Ubicación Obra:</span>
              <span class="text-text font-medium">{quoteSuccess.siteLocation}</span>
            </div>
            <div class="flex justify-between border-b border-border/50 pb-2">
              <span class="text-text-muted">Teléfono Contacto:</span>
              <span class="text-text font-medium">{quoteSuccess.contactPhone}</span>
            </div>
            <div class="flex justify-between pt-1">
              <span class="text-text-muted">Monto Estimado Total:</span>
              <span class="text-base font-bold text-amber-400">${quoteSuccess.grandTotal.toLocaleString()} MXN</span>
            </div>
          </div>

          <p class="text-[11px] text-text-faint">Un asesor logístico de Rentek se comunicará contigo en menos de 30 min para coordinar la entrega en obra.</p>

          <button
            on:click={() => { clearCart(); close(); }}
            class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all"
          >
            Entendido / Volver al Catálogo
          </button>
        </div>

      {:else if isCheckout}
        
        <!-- Checkout Form Screen -->
        <div class="flex-1 p-6 overflow-y-auto space-y-4">
          <button on:click={() => isCheckout = false} class="text-xs text-amber-400 hover:underline flex items-center gap-1">
            ← Volver al carrito
          </button>
          
          <h3 class="text-lg font-bold text-text">Datos para Logística de Renta</h3>
          <p class="text-xs text-text-faint">Ingresa los datos para calcular flete y entrega en obra.</p>

          <div class="space-y-3 pt-2">
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">Nombre del Proyecto / Empresa *</label>
              <input type="text" placeholder="Ej: Obra Cimentación Parque Industrial" bind:value={projectName} class="w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400" />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">Ubicación de la Obra (Dirección/Ciudad) *</label>
              <input type="text" placeholder="Ej: Av. Industrial 450, Monterrey, N.L." bind:value={siteLocation} class="w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400" />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">Teléfono de Contacto Responsable *</label>
              <input type="tel" placeholder="Ej: 81 1234 5678" bind:value={contactPhone} class="w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400" />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">Notas especiales de entrega (Opcional)</label>
              <textarea rows="3" placeholder="Ej: Acceso para cama baja por portón norte..." bind:value={notes} class="w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400 resize-none"></textarea>
            </div>
          </div>

          <!-- Financial Breakdown Summary -->
          <div class="bg-bg p-4 rounded-xl border border-border space-y-2 text-xs">
            <div class="flex justify-between text-text-muted">
              <span>Subtotal Equipos ({cart.length}):</span>
              <span class="text-text font-medium">${subtotal.toLocaleString()} MXN</span>
            </div>
            <div class="flex justify-between text-text-muted">
              <span>Flete y Logística estimado:</span>
              <span class="text-text font-medium">${transportEstimate.toLocaleString()} MXN</span>
            </div>
            <div class="flex justify-between text-text-muted">
              <span>IVA (16%):</span>
              <span class="text-text font-medium">${iva.toLocaleString()} MXN</span>
            </div>
            <div class="flex justify-between text-sm font-bold text-text pt-2 border-t border-border/60">
              <span>Total Estimado:</span>
              <span class="text-amber-400 text-base">${grandTotal.toLocaleString()} MXN</span>
            </div>
          </div>
        </div>

        <div class="p-5 border-t border-border bg-surface/90">
          <button
            on:click={handleConfirmOrder}
            disabled={submitting}
            class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {#if submitting}
              <span>Generando Folio...</span>
            {:else}
              <LucideIcons icon="check-circle" class="w-4 h-4" />
              Confirmar y Enviar Cotización
            {/if}
          </button>
        </div>

      {:else}

        <!-- Cart Items List -->
        {#if cart.length === 0}
          <div class="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 text-text-muted">
            <div class="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center text-text-faint">
              <LucideIcons icon="shopping-cart" class="w-7 h-7" />
            </div>
            <h3 class="text-sm font-semibold text-text">Tu carrito está vacío</h3>
            <p class="text-xs text-text-faint max-w-xs">Navega por nuestro catálogo de maquinaria pesada y agrega los equipos que necesites para tu obra.</p>
          </div>
        {:else}
          <div class="flex-1 p-4 overflow-y-auto space-y-3">
            {#each cart as cartItem, index}
              <div class="p-3.5 rounded-xl bg-bg border border-border/80 flex gap-3 relative group">
                <img src={cartItem.item.imagen || '/images/excavadora.jpg'} alt={cartItem.item.nombre} class="w-16 h-16 rounded-lg object-cover border border-border" />
                
                <div class="flex-1 min-w-0 pr-6">
                  <span class="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">{cartItem.item.categoria}</span>
                  <h4 class="text-xs font-bold text-text truncate">{cartItem.item.nombre}</h4>
                  
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-faint">
                    <span>Periodo: <strong class="text-text">{cartItem.duration} {cartItem.durationUnit}</strong></span>
                    <span>•</span>
                    <span>Inicio: <strong class="text-text">{cartItem.startDate || 'Inmediato'}</strong></span>
                  </div>

                  <div class="mt-1.5 flex justify-between items-center">
                    <span class="text-xs font-bold text-amber-400">${cartItem.calculatedTotal?.toLocaleString()} MXN</span>
                  </div>
                </div>

                <button
                  on:click={() => removeItem(index)}
                  class="absolute top-3 right-3 p-1 rounded-md text-text-faint hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Eliminar del carrito"
                >
                  <LucideIcons icon="trash-2" class="w-4 h-4" />
                </button>
              </div>
            {/each}
          </div>

          <!-- Footer Total & Checkout Action -->
          <div class="p-5 border-t border-border bg-surface/90 space-y-3">
            <div class="space-y-1.5 text-xs text-text-muted">
              <div class="flex justify-between">
                <span>Subtotal Equipos:</span>
                <span class="text-text font-semibold">${subtotal.toLocaleString()} MXN</span>
              </div>
              <div class="flex justify-between">
                <span>Flete estimado:</span>
                <span class="text-text font-semibold">${transportEstimate.toLocaleString()} MXN</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-text pt-2 border-t border-border/50">
                <span>Total Estimado (+IVA):</span>
                <span class="text-amber-400 text-base">${grandTotal.toLocaleString()} MXN</span>
              </div>
            </div>

            <button
              on:click={handleProcessCheckout}
              class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <span>Solicitar Cotización de Renta</span>
              <LucideIcons icon="arrow-right" class="w-4 h-4" />
            </button>
          </div>
        {/if}

      {/if}

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
