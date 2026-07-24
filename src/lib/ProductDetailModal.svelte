<script>
  import { createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'

  export let item = null
  export let isOpen = false

  const dispatch = createEventDispatcher()

  let rentalDays = 1
  let rentalType = 'dias' // 'dias' | 'semanas' | 'meses'
  let startDate = new Date().toISOString().split('T')[0]

  $: priceBreakdown = calculatePrice(item, rentalDays, rentalType)

  function calculatePrice(product, duration, type) {
    if (!product || !product.precios) return { unitRate: 0, total: 0, scheme: 'diario' }
    
    let totalDays = duration
    if (type === 'semanas') totalDays = duration * 7
    if (type === 'meses') totalDays = duration * 30

    const dailyRate = product.precios.diario || 0
    const weeklyRate = product.precios.semanal || (dailyRate * 6)
    const monthlyRate = product.precios.mensual || (dailyRate * 22)

    let total = 0
    let scheme = 'Diario'
    let unitRate = dailyRate

    if (totalDays >= 30) {
      const months = Math.floor(totalDays / 30)
      const remDays = totalDays % 30
      total = (months * monthlyRate) + (remDays * dailyRate)
      scheme = 'Tarifa Mensual preferencial'
      unitRate = Math.round(monthlyRate / 30)
    } else if (totalDays >= 7) {
      const weeks = Math.floor(totalDays / 7)
      const remDays = totalDays % 7
      total = (weeks * weeklyRate) + (remDays * dailyRate)
      scheme = 'Tarifa Semanal con descuento'
      unitRate = Math.round(weeklyRate / 7)
    } else {
      total = totalDays * dailyRate
      scheme = 'Tarifa Diaria'
      unitRate = dailyRate
    }

    return { totalDays, total, scheme, unitRate }
  }

  function handleAddToCart() {
    if (!item) return
    dispatch('addToCart', {
      item,
      duration: rentalDays,
      durationUnit: rentalType,
      totalDays: priceBreakdown.totalDays,
      calculatedTotal: priceBreakdown.total,
      startDate
    })
    close()
  }

  function handleConsultAI() {
    dispatch('consultAI', item)
    close()
  }

  function close() {
    dispatch('close')
  }
</script>

{#if isOpen && item}
  <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    
    <!-- Modal Container -->
    <div class="relative w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-surface/80 sticky top-0 z-10 backdrop-blur">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {item.categoria}
          </span>
          <h2 class="text-xl font-bold text-text truncate">{item.nombre}</h2>
        </div>
        <button on:click={close} class="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover">
          <LucideIcons icon="x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-6">
        
        <!-- Top Section: Image & Key Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Equipment Image -->
          <div class="relative rounded-xl overflow-hidden bg-bg border border-border group aspect-video md:aspect-auto flex items-center justify-center">
            <img src={item.imagen || '/images/excavadora.jpg'} alt={item.nombre} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
            <div class="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
              {#if item.marcas}
                {#each item.marcas as marca}
                  <span class="px-2 py-0.5 text-[10px] font-medium bg-surface/90 text-text rounded backdrop-blur">
                    {marca}
                  </span>
                {/each}
              {/if}
            </div>
          </div>

          <!-- Quick Quote & Duration Picker -->
          <div class="flex flex-col justify-between space-y-4 bg-bg/50 p-5 rounded-xl border border-border/60">
            <div>
              <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Configurar Periodo de Renta</h3>
              
              <!-- Rates breakdown -->
              <div class="grid grid-cols-3 gap-2 mb-4 text-center">
                <div class="bg-surface p-2.5 rounded-lg border border-border">
                  <span class="block text-[10px] text-text-faint">Día</span>
                  <span class="text-sm font-bold text-amber-400">${item.precios?.diario?.toLocaleString()} MXN</span>
                </div>
                <div class="bg-surface p-2.5 rounded-lg border border-border">
                  <span class="block text-[10px] text-text-faint">Semana</span>
                  <span class="text-sm font-bold text-amber-400">${item.precios?.semanal?.toLocaleString()} MXN</span>
                </div>
                <div class="bg-surface p-2.5 rounded-lg border border-border">
                  <span class="block text-[10px] text-text-faint">Mes</span>
                  <span class="text-sm font-bold text-amber-400">${item.precios?.mensual?.toLocaleString()} MXN</span>
                </div>
              </div>

              <!-- Duration Selector -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <label class="block text-xs font-medium text-text-muted mb-1">Duración</label>
                    <input type="number" min="1" max="365" bind:value={rentalDays} class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-amber-400" />
                  </div>
                  <div class="w-1/2">
                    <label class="block text-xs font-medium text-text-muted mb-1">Unidad</label>
                    <select bind:value={rentalType} class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-amber-400">
                      <option value="dias">Día(s)</option>
                      <option value="semanas">Semana(s)</option>
                      <option value="meses">Mes(es)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-text-muted mb-1">Fecha Inicio deseada</label>
                  <input type="date" bind:value={startDate} class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-amber-400" />
                </div>
              </div>
            </div>

            <!-- Price Calculated Preview -->
            <div class="border-t border-border pt-3">
              <div class="flex justify-between items-end mb-1">
                <div>
                  <span class="text-xs text-text-faint block">{priceBreakdown.scheme}</span>
                  <span class="text-xs text-text-muted font-medium">{priceBreakdown.totalDays} días acumulados</span>
                </div>
                <div class="text-right">
                  <span class="text-2xl font-extrabold text-amber-400">${priceBreakdown.total.toLocaleString()} MXN</span>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-2 mt-4">
                <button
                  on:click={handleAddToCart}
                  class="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <LucideIcons icon="shopping-cart" class="w-4 h-4" />
                  Añadir al Carrito
                </button>
                <button
                  on:click={handleConsultAI}
                  class="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold p-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
                  title="Preguntar detalles al Asesor IA"
                >
                  <LucideIcons icon="sparkles" class="w-4 h-4" />
                  Consultar IA
                </button>
              </div>
            </div>

          </div>

        </div>

        <!-- Description -->
        {#if item.descripcion}
          <div class="bg-surface/50 p-4 rounded-xl border border-border/40">
            <h4 class="text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Descripción del Equipo</h4>
            <p class="text-sm text-text-faint leading-relaxed">{item.descripcion}</p>
          </div>
        {/if}

        <!-- Technical Specs Table -->
        {#if item.specs}
          <div>
            <h4 class="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <LucideIcons icon="wrench" class="w-4 h-4 text-amber-400" />
              Especificaciones Técnicas
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each Object.entries(item.specs) as [key, val]}
                <div class="flex justify-between items-center p-3 rounded-lg bg-bg border border-border/60 text-xs">
                  <span class="text-text-muted font-medium">{key}</span>
                  <span class="font-semibold text-text">{val}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Use cases & recommendations -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#if item.recomendado}
            <div class="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <h5 class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LucideIcons icon="check-circle" class="w-4 h-4" />
                Uso Recomendado
              </h5>
              <ul class="space-y-1.5 text-xs text-text-faint">
                {#each item.recomendado as rec}
                  <li class="flex items-start gap-1.5">
                    <span class="text-emerald-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if item.no_recomendado}
            <div class="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <h5 class="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LucideIcons icon="x-circle" class="w-4 h-4" />
                No Recomendado
              </h5>
              <ul class="space-y-1.5 text-xs text-text-faint">
                {#each item.no_recomendado as noRec}
                  <li class="flex items-start gap-1.5">
                    <span class="text-rose-400 mt-0.5">•</span>
                    <span>{noRec}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>

      </div>

    </div>

  </div>
{/if}
