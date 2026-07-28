export const API_BASE = import.meta.env.VITE_API_URL || 'https://washroom-raffle-unharmed.ngrok-free.dev'

const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  'User-Agent': 'rentek-app/1.0',
}

export async function chatCompletions(messages, tools, conversationId = null, userName = null, userEmail = null, token = null) {
  const body = { messages, tools }
  if (conversationId) body.conversation_id = conversationId
  if (userName) body.user_name = userName
  if (userEmail) body.user_email = userEmail

  const headers = { ...HEADERS }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function* chatCompletionsStream(messages, tools, conversationId = null, chatId = null, signal = null, userName = null, userEmail = null, token = null) {
  const body = { messages, tools, stream: true }
  if (conversationId) body.conversation_id = conversationId
  if (chatId) body.chat_id = chatId
  if (userName) body.user_name = userName
  if (userEmail) body.user_email = userEmail

  const headers = { ...HEADERS }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/v1/chat/completions/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6)
        if (data === '[DONE]') return
        try {
          yield JSON.parse(data)
        } catch {}
      }
    }
  }
}

function extractError(err) {
  if (!err) return 'Error inesperado'
  if (typeof err.detail === 'string') return err.detail
  if (Array.isArray(err.detail)) return err.detail.map(e => e.msg).join(', ')
  if (err.message) return err.message
  return 'Error inesperado'
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractError(err))
  }
  return res.json()
}

export async function register(email, password, displayName) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email, password, display_name: displayName }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractError(err))
  }
  return res.json()
}

export async function getObservabilityLogs(limit = 50) {
  const res = await fetch(`${API_BASE}/api/observability?limit=${limit}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function fetchCategorias() {
  try {
    const res = await fetch(`${API_BASE}/api/catalog`, {
      headers: HEADERS,
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    }
  } catch (e) {
    console.warn('API error, using client fallback for categories:', e)
  }
  return FALLBACK_CATALOG
}

export async function fetchDetalleCategoria(categoria) {
  try {
    const res = await fetch(`${API_BASE}/api/maquinaria/${encodeURIComponent(categoria)}`, {
      headers: HEADERS,
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    console.warn('API error for detail:', e)
  }
  return null
}

export async function calcularCotizacion(items) {
  try {
    const res = await fetch(`${API_BASE}/api/cotizacion/calcular`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ items }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    console.warn('API cotizacion error:', e)
  }
  return null
}

/** CART API — syncs with server-side carrito */
export async function fetchCart(token) {
  const headers = { ...HEADERS, 'Authorization': `Bearer ${token}` }
  const res = await fetch(`${API_BASE}/api/carrito`, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function addToCart(item, token) {
  const headers = { ...HEADERS, 'Authorization': `Bearer ${token}` }
  const res = await fetch(`${API_BASE}/api/carrito`, {
    method: 'POST',
    headers,
    body: JSON.stringify(item),
  })
  if (!res.ok) return null
  return res.json()
}

export async function removeFromCart(itemId, token) {
  const headers = { ...HEADERS, 'Authorization': `Bearer ${token}` }
  const res = await fetch(`${API_BASE}/api/carrito/${itemId}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) return null
  return res.json()
}

export async function checkoutCart(token) {
  const headers = { ...HEADERS, 'Authorization': `Bearer ${token}` }
  const res = await fetch(`${API_BASE}/api/carrito/checkout`, {
    method: 'POST',
    headers,
  })
  if (!res.ok) return null
  return res.json()
}

export const FALLBACK_CATALOG = [
  {
    id: "excavadoras",
    categoria: "Excavadoras",
    nombre: "Excavadora Hidráulica de Orugas",
    marcas: ["Caterpillar", "Komatsu", "Volvo", "Hitachi", "JCB"],
    modelos: ["CAT 320", "Komatsu PC200", "Volvo EC220D", "Hitachi ZX210"],
    precios: { diario: 4500, semanal: 27000, mensual: 95000 },
    imagen: "/images/excavadora.jpg",
    specs: {
      "Potencia bruta": "148 - 172 HP",
      "Peso de operación": "21,500 - 24,000 kg",
      "Capacidad de cucharón": "1.0 - 1.4 m³",
      "Profundidad máx. excavación": "6.7 m"
    },
    descripcion: "Excavadora versátil de alto rendimiento ideal para movimiento de tierras pesado, cimentaciones, zanjado y demolición.",
    recomendado: ["Movimiento de tierra pesado", "Zanjas profundas", "Demolición estructural", "Canteras y minería suave"],
    no_recomendado: ["Espacios interiores reducidos", "Transitar sobre asfalto terminado sin protección"]
  },
  {
    id: "bulldozers",
    categoria: "Bulldozers",
    nombre: "Bulldozer de Orugas",
    marcas: ["Caterpillar", "Komatsu", "Shantui", "John Deere"],
    modelos: ["CAT D6T", "CAT D8T", "Komatsu D65EX", "Komatsu D155A"],
    precios: { diario: 5800, semanal: 34800, mensual: 120000 },
    imagen: "/images/bulldozer.jpg",
    specs: {
      "Potencia de motor": "215 - 354 HP",
      "Peso operativo": "20,500 - 38,000 kg",
      "Capacidad de hoja SU": "5.6 - 8.7 m³",
      "Tren de rodaje": "Orugas de servicio pesado"
    },
    descripcion: "Tractor sobre orugas con hoja topadora frontal y ripper posterior. Máxima potencia para empuje y nivelación de terrenos exigentes.",
    recomendado: ["Nivelación de terrenos a gran escala", "Desmonte y limpieza de predios", "Empuje de material pesado"],
    no_recomendado: ["Carga de camiones", "Superficies de concreto pulido"]
  },
  {
    id: "retroexcavadoras",
    categoria: "Retroexcavadoras",
    nombre: "Retroexcavadora Mixta 4x4",
    marcas: ["Caterpillar", "JCB", "Case", "John Deere", "New Holland"],
    modelos: ["CAT 420F2", "JCB 3CX", "Case 580 Super N"],
    precios: { diario: 2800, semanal: 16800, mensual: 58000 },
    imagen: "/images/retroexcavadora.jpg",
    specs: {
      "Potencia": "93 - 110 HP",
      "Peso operativo": "8,500 kg",
      "Cucharón cargador": "1.0 m³",
      "Cucharón excavador": "0.24 m³ / Prof. 4.3m"
    },
    descripcion: "Equipamiento dual multipropósito con cargador frontal y brazo excavador trasero. Altamente móvil en carretera y obras urbanas.",
    recomendado: ["Obras urbanas y servicios públicos", "Excavación de zanjas menores", "Carga rápida de camiones de 7-14m³"],
    no_recomendado: ["Excavaciones profundas > 5m", "Terrenos fangosos extremos sin tracción 4x4"]
  },
  {
    id: "gruas",
    categoria: "Grúas",
    nombre: "Grúa Telescópica Móvil",
    marcas: ["Liebherr", "Tadano", "Grove", "Terex", "Sany"],
    modelos: ["Tadano GR-500EX", "Liebherr LTM 1050", "Grove RT530E"],
    precios: { diario: 7200, semanal: 43200, mensual: 155000 },
    imagen: "/images/grua.jpg",
    specs: {
      "Capacidad de elevación": "30 - 75 Toneladas",
      "Pluma telescópica": "31 - 50 metros",
      "Motor": "Diesel Turbo Intercooler",
      "Estabilizadores": "Hidráulicos H-type"
    },
    descripcion: "Grúa todoterreno telescópica ideal para montaje de estructuras metálicas, elevación de maquinaria pesada y elementos prefabricados.",
    recomendado: ["Montaje de naves industriales", "Izaje de estructuras metálicas y lozas", "Colocación de tanques y transformadores"],
    no_recomendado: ["Operación bajo líneas de alta tensión sin libramiento", "Vientos superiores a 40 km/h"]
  },
  {
    id: "compactadores",
    categoria: "Compactadores",
    nombre: "Rodillo Compactador Vibratorio",
    marcas: ["Hamm", "Caterpillar", "Bomag", "Dynapac"],
    modelos: ["Hamm 3411", "CAT CS54B", "Bomag BW211"],
    precios: { diario: 2400, semanal: 14400, mensual: 48000 },
    imagen: "/images/excavadora.jpg",
    specs: {
      "Peso operativo": "11,500 - 12,800 kg",
      "Ancho de tambor": "2,130 mm",
      "Frecuencia vibratoria": "30/36 Hz",
      "Fuerza centrífuga": "246 kN"
    },
    descripcion: "Compactador monobanda con tambor liso o pata de cabra para estabilización de suelos, subbases de carreteras y explanaciones.",
    recomendado: ["Terracerías y subbases de carreteras", "Compactación de suelos granulares y cohesivos"],
    no_recomendado: ["Zanjas angostas de menos de 2.2 metros de ancho"]
  },
  {
    id: "generadores",
    categoria: "Generadores",
    nombre: "Planta de Luz / Generador Diesel",
    marcas: ["Cummins", "Caterpillar", "Generac", "Pramac"],
    modelos: ["Cummins C150D5", "CAT DE200", "Generac SD150"],
    precios: { diario: 1800, semanal: 10800, mensual: 36000 },
    imagen: "/images/grua.jpg",
    specs: {
      "Capacidad standby": "150 - 250 kVA",
      "Voltaje": "220V / 440V Trifásico",
      "Tanque de combustible": "350 Litros (18-24 hrs continuas)",
      "Nivel de ruido": "70 dB @ 7m (Insonorizado)"
    },
    descripcion: "Generador diésel insonorizado cabinado de alta eficiencia para suministro ininterrumpido de energía en sitios remotos u obras sin red eléctrica.",
    recomendado: ["Alimentación eléctrica de obras", "Eventos y respaldo hospitalario/industrial"],
    no_recomendado: ["Ambientes cerrados sin ventilación de escape de gases"]
  },
  {
    id: "minicargadores",
    categoria: "Compactadores",
    nombre: "Minicargador Compacto (Bobcat)",
    marcas: ["Bobcat", "Caterpillar", "Kubota", "Case"],
    modelos: ["Bobcat S570", "CAT 262D3", "Kubota SSV65"],
    precios: { diario: 1950, semanal: 11700, mensual: 39000 },
    imagen: "/images/retroexcavadora.jpg",
    specs: {
      "Potencia": "74 HP",
      "Capacidad de carga": "860 - 1,200 kg",
      "Peso operativo": "3,100 kg",
      "Velocidad máx": "11.8 km/h"
    },
    descripcion: "Minicargador de llantas o banda de goma ultra versátil para maniobrar en espacios reducidos, limpieza de escombro y carga de camionetas.",
    recomendado: ["Espacios urbanos reducidos", "Limpieza de predios y acarreos menores", "Nivelación fina y jardinería"],
    no_recomendado: ["Excavaciones profundas", "Zonas con fango extremo de alta flotación"]
  },
  {
    id: "motoniveladoras",
    categoria: "Bulldozers",
    nombre: "Motoniveladora Articulada",
    marcas: ["Caterpillar", "Komatsu", "John Deere", "CASE"],
    modelos: ["CAT 140K", "Komatsu GD655-5", "John Deere 670G"],
    precios: { diario: 4900, semanal: 29400, mensual: 98000 },
    imagen: "/images/bulldozer.jpg",
    specs: {
      "Potencia de motor": "170 - 200 HP",
      "Ancho de vertedera": "3.7 - 4.3 metros",
      "Peso operativo": "17,500 kg",
      "Tracción": "6x4 Articulada"
    },
    descripcion: "Niveladora de alta precisión para conformación de taludes, perfilado de subbases de carretera y esparcimiento de balasto/grava.",
    recomendado: ["Construcción y conservación de carreteras", "Nivelación de plataformas industriales", "Perfilado de caminos rurales"],
    no_recomendado: ["Excavación en roca sólida", "Desmonte inicial de árboles grandes"]
  }
]

