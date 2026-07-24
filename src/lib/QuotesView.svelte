<script>
  import { onMount } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'

  let quotes = []

  onMount(() => {
    try {
      quotes = JSON.parse(localStorage.getItem('rentek_quotes') || '[]')
    } catch {}
  })

  function deleteQuote(id) {
    quotes = quotes.filter(q => q.id !== id)
    localStorage.setItem('rentek_quotes', JSON.stringify(quotes))
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
  
  <div class="space-y-2">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase">
      <LucideIcons icon="file-text" class="w-3.5 h-3.5" />
      Historial de Cotizaciones
    </div>
    <h2 class="text-2xl font-extrabold text-text tracking-tight">Tus Solicitudes de Renta y Cotizaciones</h2>
    <p class="text-xs text-text-faint max-w-2xl">
      Revisa el estado de tus cotizaciones solicitadas, detalles de entrega en obra y resumen de precios de maquinaria.
    </p>
  </div>

  {#if quotes.length === 0}
    <div class="py-16 text-center space-y-3 bg-surface rounded-2xl border border-border">
      <LucideIcons icon="file-text" class="w-12 h-12 text-text-faint mx-auto" />
      <h3 class="text-base font-bold text-text">No tienes cotizaciones registradas aún</h3>
      <p class="text-xs text-text-faint max-w-sm mx-auto">Selecciona equipos en el catálogo, agrégalos al carrito y solicita tu cotización.</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each quotes as quote}
        <div class="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-lg">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <div class="flex items-center gap-3">
                <span class="text-lg font-extrabold text-amber-400 font-mono">{quote.id}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {quote.status || 'En Revisión Logística'}
                </span>
              </div>
              <p class="text-xs font-bold text-text mt-1">Proyecto: {quote.projectName}</p>
              <p class="text-[11px] text-text-faint">Fecha: {quote.date} • Obra: {quote.siteLocation}</p>
            </div>

            <div class="flex items-center gap-3">
              <div class="text-right">
                <span class="text-[10px] text-text-faint uppercase block font-semibold">Total Estimado</span>
                <span class="text-xl font-black text-amber-400">${quote.grandTotal?.toLocaleString()} MXN</span>
              </div>
              <button
                on:click={() => deleteQuote(quote.id)}
                class="p-2 rounded-lg text-text-faint hover:text-rose-400 hover:bg-rose-500/10"
                title="Eliminar de historial"
              >
                <LucideIcons icon="trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Items list in quote -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {#each quote.items as item}
              <div class="p-3 rounded-xl bg-bg border border-border/60 flex items-center gap-3">
                <img src={item.item.imagen || '/images/excavadora.jpg'} alt={item.item.nombre} class="w-12 h-12 rounded-lg object-cover border border-border" />
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-bold text-text truncate">{item.item.nombre}</h4>
                  <p class="text-[11px] text-text-faint">{item.duration} {item.durationUnit} • <strong class="text-amber-400">${item.calculatedTotal?.toLocaleString()} MXN</strong></p>
                </div>
              </div>
            {/each}
          </div>

        </div>
      {/each}
    </div>
  {/if}

</div>
