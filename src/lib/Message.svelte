<script>
  import LucideIcons from './LucideIcons.svelte'
  export let role = 'assistant'
  export let content = ''
  export let toolCalls = []
  export let streaming = false

  let copiedId = null

  function copyContent(id) {
    navigator.clipboard.writeText(content).then(() => {
      copiedId = id
      setTimeout(() => copiedId = null, 1500)
    })
  }
</script>

<div class="flex items-start gap-3 mb-5" class:flex-row-reverse={role === 'user'}>
  <div class="flex flex-col items-center gap-0.5 shrink-0">
    <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm
      {role === 'user'
        ? 'bg-accent text-white'
        : 'bg-surface text-text-muted border border-border'}">
      {#if role === 'user'}
        <LucideIcons name="user" size={16} />
      {:else}
        <img src="/rentek-black.png" alt="Rentek" class="w-6 h-6 object-contain" />
      {/if}
    </div>
    <button class="p-1 rounded transition-colors cursor-pointer
      {role === 'user' ? 'text-white/70' : 'text-text-faint'}"
      on:click={() => copyContent('msg')} title="Copiar mensaje">
      {#if copiedId}
        <LucideIcons name="clipboard-check" size={12} />
      {:else}
        <LucideIcons name="clipboard" size={12} />
      {/if}
    </button>
  </div>

  <div class="max-w-[85%] sm:max-w-[70%] min-w-0">
    {#if toolCalls && toolCalls.length > 0}
      <div class="mb-2 space-y-1.5">
        {#each toolCalls as call, i}
          <div class="flex items-center gap-2 text-[0.7rem] px-3 py-2 rounded-lg bg-amber-light border border-amber-border">
            <LucideIcons name="wrench" size={11} />
            <span class="font-medium text-amber">{call.name}</span>
            {#if call.status === 'done'}
              <span class="ml-auto text-green">Hecho</span>
            {:else if call.error}
              <span class="ml-auto text-red">Error</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <div class="rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
      {role === 'user'
        ? 'bg-accent text-white'
        : 'bg-surface text-text-2 border border-border'}">
      <p class="whitespace-pre-wrap break-words m-0">{content}</p>
    </div>
  </div>
</div>
