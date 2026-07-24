<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'
  import ProductDetailModal from './ProductDetailModal.svelte'
  import { fetchCategorias, FALLBACK_CATALOG } from './api.js'

  const dispatch = createEventDispatcher()

  let catalog = []
  let loading = true
  let searchQuery = ''
  let selectedCategory = 'Todas'
  let selectedProductForModal = null
  let isModalOpen = false

  const categoriesList = ['Todas', 'Excavadoras', 'Bulldozers', 'Retroexcavadoras', 'Grúas', 'Compactadores', 'Generadores']

  onMount(async () => {
    try {
      const data = await fetchCategorias()
      if (Array.isArray(data) && data.length > 0) {
        catalog = data
      } else {
        catalog = FALLBACK_CATALOG
      }
    } catch (e) {
      catalog = FALLBACK_CATALOG
    } finally {
      loading = false
    }
  })

  $: filteredCatalog = catalog.filter(item => {
    const matchesCategory = selectedCategory === 'Todas' || item.categoria === selectedCategory
    const query = searchQuery.toLowerCase().trim()
    if (!query) return matchesCategory

    const matchesName = item.nombre.toLowerCase().includes(query)
    const matchesCatName = item.categoria.toLowerCase().includes(query)
    const matchesDesc = (item.descripcion || '').toLowerCase().includes(query)
    const matchesBrand = (item.marcas || []).some(m => m.toLowerCase().includes(query))
    
    return matchesCategory && (matchesName || matchesCatName || matchesDesc || matchesBrand)
  })

  function openDetail(item) {
    selectedProductForModal = item
    isModalOpen = true
  }

  function handleAddToCartFromCard(item) {
    dispatch('addToCart', {
      item,
      duration: 1,
      durationUnit: 'dias',
      totalDays: 1,
      calculatedTotal: item.precios?.diario || 3500,
      startDate: new Date().toISOString().split('T')[0]
    })
  }

  function handleConsultAI(item) {
    dispatch('consultAI', item)
  }

  function handleAddToCartFromModal(e) {
    dispatch('addToCart', e.detail)
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  
  <!-- Hero Section -->
  <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 border border-border p-8 md:p-12 shadow-2xl">
    <div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
      <LucideIcons icon="hard-hat" class="w-96 h-96 text-amber-400" />
    </div>
    
    <div class="relative z-10 max-w-2xl space-y-4">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
        <LucideIcons icon="sparkles" class="w-3.5 h-3.5" />
        Renta de Maquinaria Pesada Garantizada
      </div>
      
      <h1 class="text-3xl md:text-5xl font-black text-text tracking-tight leading-tight">
        Alquila la Maquinaria Pesada que tu Obra Necesita.
      </h1>
      
      <p class="text-sm md:text-base text-text-faint leading-relaxed">
        Excavadoras, Bulldozers, Retroexcavadoras y Grúas con disponibilidad inmediata. Cotiza tarifas por día, semana o mes con entrega en obra y asesoría inteligente por IA.
      </p>

      <!-- Search input bar inside hero -->
      <div class="pt-2 flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <LucideIcons icon="search" class="absolute left-3.5 top-3.5 w-4 h-4 text-text-faint" />
          <input
            type="text"
            placeholder="Buscar por equipo, marca (CAT, Komatsu...), o trabajo..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-3 bg-surface/90 border border-border rounded-xl text-sm text-text placeholder-text-faint focus:outline-none focus:border-amber-400 backdrop-blur"
          />
        </div>
        <button
          on:click={() => dispatch('toggleChat')}
          class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <LucideIcons icon="sparkles" class="w-4 h-4" />
          Asesor IA RAG
        </button>
      </div>
    </div>
  </div>

  <!-- Category Pills Filter -->
  <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
    {#each categoriesList as cat}
      <button
        on:click={() => selectedCategory = cat}
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border {selectedCategory === cat ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' : 'bg-surface hover:bg-surface-hover text-text-muted border-border'}"
      >
        {cat}
      </button>
    {/each}
  </div>

  <!-- Catalog Grid -->
  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each Array(6) as _}
        <div class="h-96 rounded-2xl bg-surface border border-border animate-pulse p-4 flex flex-col justify-between">
          <div class="h-48 bg-bg rounded-xl mb-4"></div>
          <div class="h-6 bg-bg rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-bg rounded w-1/2"></div>
        </div>
      {/each}
    </div>
  {:else if filteredCatalog.length === 0}
    <div class="py-16 text-center space-y-3 bg-surface rounded-2xl border border-border">
      <LucideIcons icon="search" class="w-12 h-12 text-text-faint mx-auto" />
      <h3 class="text-base font-bold text-text">No se encontraron equipos</h3>
      <p class="text-xs text-text-faint max-w-sm mx-auto">Prueba buscando con otro término o seleccionando otra categoría en el menú superior.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredCatalog as item}
        <div class="group rounded-2xl bg-surface border border-border hover:border-amber-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/5">
          
          <!-- Image Header -->
          <div class="relative aspect-video overflow-hidden bg-bg cursor-pointer" on:click={() => openDetail(item)}>
            <img
              src={item.imagen || '/images/excavadora.jpg'}
              alt={item.nombre}
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            
            <span class="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500 text-slate-950 shadow">
              {item.categoria}
            </span>

            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span class="text-xs text-white/90 font-medium drop-shadow">
                {item.marcas ? item.marcas.slice(0, 3).join(', ') : 'Marcas Premium'}
              </span>
            </div>
          </div>

          <!-- Body Info -->
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <h3
                on:click={() => openDetail(item)}
                class="text-base font-bold text-text group-hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
              >
                {item.nombre}
              </h3>
              
              <p class="text-xs text-text-faint line-clamp-2 mt-1">
                {item.descripcion}
              </p>

              <!-- Specs bullets snippet -->
              {#if item.specs}
                <div class="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-text-muted bg-bg/50 p-2.5 rounded-xl border border-border/40">
                  {#each Object.entries(item.specs).slice(0, 2) as [key, val]}
                    <div>
                      <span class="text-text-faint block text-[10px]">{key}</span>
                      <strong class="text-text font-semibold">{val}</strong>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Pricing & Action Buttons -->
            <div class="pt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-text-faint uppercase font-medium block">Tarifa desde</span>
                <span class="text-lg font-black text-amber-400">
                  ${item.precios?.diario?.toLocaleString() || '3,500'} <span class="text-xs font-normal text-text-muted">MXN /día</span>
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  on:click={() => handleConsultAI(item)}
                  class="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors"
                  title="Preguntar al Asesor IA sobre este equipo"
                >
                  <LucideIcons icon="sparkles" class="w-4 h-4" />
                </button>
                <button
                  on:click={() => handleAddToCartFromCard(item)}
                  class="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <LucideIcons icon="shopping-cart" class="w-3.5 h-3.5" />
                  Rentar
                </button>
              </div>
            </div>

          </div>

        </div>
      {/each}
    </div>
  {/if}

</div>

<!-- Product Detail Modal -->
<ProductDetailModal
  item={selectedProductForModal}
  isOpen={isModalOpen}
  on:close={() => isModalOpen = false}
  on:addToCart={handleAddToCartFromModal}
  on:consultAI={(e) => handleConsultAI(e.detail)}
/>
