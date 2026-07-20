<script>
  import LucideIcons from './LucideIcons.svelte'
  export let role = 'assistant'
  export let content = ''
  export let toolCalls = []
  export let streaming = false
</script>

<div class="flex items-start gap-3 mb-5" class:flex-row-reverse={role === 'user'}>
  <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
    style="{role === 'user'
      ? 'background: linear-gradient(135deg, #f97316, #ea580c); color: white'
      : 'background: white; color: #6b7280; border: 1px solid #e5e7eb'}">
    <LucideIcons name={role === 'user' ? 'user' : 'hardhat'} size={16} />
  </div>

  <div class="max-w-[85%] sm:max-w-[70%] min-w-0">
    {#if toolCalls && toolCalls.length > 0}
      <div class="mb-2 space-y-1.5">
        {#each toolCalls as call, i}
          <div class="flex items-center gap-2 text-[0.7rem] px-3 py-2 rounded-lg"
            style="background: #fffbeb; border: 1px solid #fde68a">
            <LucideIcons name="wrench" size={11} />
            <span style="color: #d97706; font-weight: 500">{call.name}</span>
            {#if call.status === 'done'}
              <span class="ml-auto" style="color: #16a34a">Hecho</span>
            {:else if call.error}
              <span class="ml-auto" style="color: #dc2626">Error</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <div class="rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm"
      style="{role === 'user'
        ? 'background: #f97316; color: white; border: none'
        : 'background: white; color: #1f2937; border: 1px solid #e5e7eb'}">
      <p class="whitespace-pre-wrap break-words m-0">{content}</p>
    </div>
  </div>
</div>
