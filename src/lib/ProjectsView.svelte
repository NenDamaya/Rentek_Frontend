<script>
  import { createEventDispatcher } from 'svelte'
  import LucideIcons from './LucideIcons.svelte'

  const dispatch = createEventDispatcher()

  const projectsList = [
    {
      title: "Construcción de Naves Industriales",
      icon: "building",
      desc: "Combinación óptima de maquinaria para excavación de cimentaciones profundas, nivelación de plataformas y montajes de estructuras metálicas.",
      equipos: ["Excavadora Hidráulica de Orugas", "Bulldozer de Orugas", "Grúa Telescópica Móvil"],
      duracionPromedio: "1 - 3 meses",
      descuentoCombo: "15% OFF"
    },
    {
      title: "Urbanización y Obras Viales",
      icon: "truck",
      desc: "Solución integral para aperturas de calles, movimiento de tierra, colocación de subbases y zanjado de redes de drenaje y agua.",
      equipos: ["Retroexcavadora Mixta 4x4", "Rodillo Compactador Vibratorio", "Bulldozer de Orugas"],
      duracionPromedio: "2 - 6 semanas",
      descuentoCombo: "10% OFF"
    },
    {
      title: "Demolición y Limpieza de Predios",
      icon: "hammer",
      desc: "Equipo pesado para demolición de concreto, retiro de escombros y habilitación de terreno plano listo para construcción.",
      equipos: ["Excavadora con Martillo Hidráulico", "Bulldozer de Orugas", "Cargador Frontal"],
      duracionPromedio: "1 - 3 semanas",
      descuentoCombo: "12% OFF"
    },
    {
      title: "Suministro Eléctrico Continuo para Obras",
      icon: "zap",
      desc: "Generadores industriales diésel de alta potencia insonorizados para sitios sin conexión a la red de CFE.",
      equipos: ["Planta de Luz 150 kVA", "Generador Diésel 250 kVA"],
      duracionPromedio: "Mensual",
      descuentoCombo: "Tarifa preferencial"
    }
  ]

  function handleConsultAI(projectName) {
    dispatch('consultAI', { nombre: projectName })
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
  
  <div class="space-y-2">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase">
      <LucideIcons icon="hard-hat" class="w-3.5 h-3.5" />
      Paquetes de Maquinaria por Proyecto
    </div>
    <h2 class="text-2xl font-extrabold text-text tracking-tight">Kits Recomendados por Tipo de Obra</h2>
    <p class="text-xs text-text-faint max-w-2xl">
      Ahorra tiempo y costos seleccionando los paquetes prediseñados de maquinaria pesada validados por nuestros ingenieros civiles.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each projectsList as proj}
      <div class="p-6 rounded-2xl bg-surface border border-border hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg">
        <div class="space-y-3">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <LucideIcons icon={proj.icon} class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-base font-bold text-text">{proj.title}</h3>
                <span class="text-[11px] text-text-faint">Duración típica: <strong class="text-text">{proj.duracionPromedio}</strong></span>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {proj.descuentoCombo}
            </span>
          </div>

          <p class="text-xs text-text-faint leading-relaxed">{proj.desc}</p>

          <div class="space-y-1.5 pt-2">
            <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Equipos en el paquete:</span>
            <div class="flex flex-wrap gap-1.5">
              {#each proj.equipos as eq}
                <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-bg text-amber-400 border border-border">
                  ✓ {eq}
                </span>
              {/each}
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border/60 flex justify-between items-center">
          <span class="text-xs text-text-muted">¿Necesitas asesoría personalizada?</span>
          <button
            on:click={() => handleConsultAI(proj.title)}
            class="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LucideIcons icon="sparkles" class="w-3.5 h-3.5" />
            Cotizar Paquete con IA
          </button>
        </div>
      </div>
    {/each}
  </div>

</div>
