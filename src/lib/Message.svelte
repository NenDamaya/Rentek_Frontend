<script>
  import LucideIcons from './LucideIcons.svelte'
  export let role = 'assistant'
  export let content = ''
  export let toolCalls = []
  export let streaming = false
</script>

<div class="flex items-start gap-3 mb-5" class:flex-row-reverse={role === 'user'}>
  <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-colors"
    style="{role === 'user'
      ? 'background: linear-gradient(135deg, #2563eb, #3b82f6); color: white'
      : 'background: linear-gradient(135deg, #1a2540, #1e2d4a); color: #64748b; border: 1px solid #2a3a5c'}">
    <LucideIcons name={role === 'user' ? 'user' : 'hardhat'} size={16} />
  </div>

  <div class="max-w-[85%] sm:max-w-[70%] min-w-0">
    {#if toolCalls && toolCalls.length > 0}
      <div class="mb-2 space-y-1.5">
        {#each toolCalls as call, i}
          <div class="flex items-center gap-2 text-[0.7rem] px-3 py-2 rounded-lg"
            style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2)">
            <LucideIcons name="wrench" size={11} />
            <span style="color: #f59e0b; font-weight: 500">{call.name}</span>
            {#if call.status === 'done'}
              <span class="ml-auto" style="color: #4ade80">Hecho</span>
            {:else if call.error}
              <span class="ml-auto" style="color: #f87171">Error</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <div class="rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm"
      style="{role === 'user'
        ? 'background: #1e3a5f; color: #e2e8f0; border: 1px solid #2563eb'
        : 'background: #1a2540; color: #cbd5e1; border: 1px solid #1e2d4a'}">
      <p class="whitespace-pre-wrap break-words m-0">{content}</p>
    </div>
  </div>
</div>
