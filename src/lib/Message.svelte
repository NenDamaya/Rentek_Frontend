<script>
  import LucideIcons from './LucideIcons.svelte'
  import MarkdownRenderer from './MarkdownRenderer.svelte'
  export let role = 'assistant'
  export let content = ''
  export let toolCalls = []
  export let streaming = false
  export let tokens = 0

  let copiedId = null

  $: estimatedTokens = tokens || (content ? Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length * 1.3)) : 0)

  function copyContent(id) {
    navigator.clipboard.writeText(content).then(() => {
      copiedId = id
      setTimeout(() => copiedId = null, 1500)
    })
  }
</script>

{#if role === 'system'}
  <div class="flex items-center justify-center my-4 px-2">
    <div class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-surface-alt border border-border text-xs text-text-2 shadow-xs max-w-xl">
      <div class="w-6 h-6 rounded-lg bg-accent-light flex items-center justify-center text-accent border border-accent-border shrink-0">
        <LucideIcons name="sparkles" size={13} />
      </div>
      <div class="flex-1 min-w-0 leading-relaxed">
        <span class="font-bold text-accent">Sistema:</span>
        <span class="text-text-muted"> {content}</span>
      </div>
    </div>
  </div>
{:else}
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
      <MarkdownRenderer {content} />
    </div>

    {#if content && !streaming}
      <div class="flex items-center gap-1.5 mt-1 px-1" class:justify-end={role === 'user'}>
        <span class="text-[0.65rem] text-text-faint flex items-center gap-1 font-mono bg-surface-alt px-2 py-0.5 rounded-full border border-border">
          <LucideIcons name="zap" size={10} />
          {estimatedTokens} tokens
        </span>

        <button class="flex items-center gap-1 text-[0.65rem] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer border border-border bg-surface-alt text-text-muted hover:text-text hover:bg-surface-hover"
          on:click={() => copyContent('msg')} title="Copiar mensaje">
          {#if copiedId}
            <LucideIcons name="clipboard-check" size={11} class="text-green" />
            <span class="text-green">¡Copiado!</span>
          {:else}
            <LucideIcons name="clipboard" size={11} />
            <span>Copiar</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>
{/if}
