<script>
  import ToolCall from './ToolCall.svelte'
  import LucideIcons from './LucideIcons.svelte'

  export let role
  export let content
  export let toolCalls = []
  export let streaming = false

  $: isUser = role === 'user'
  $: isAssistant = role === 'assistant'
  $: isTool = role === 'tool'
</script>

<div class="flex gap-3 mb-4 items-start {isUser ? 'flex-row-reverse' : ''}">
  <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm
    {isUser ? 'bg-primary' : isTool ? 'bg-tool-msg' : 'bg-surface-2'}">
    {#if isUser}
      <LucideIcons name="user" size={16} />
    {:else if isTool}
      <LucideIcons name="wrench" size={14} />
    {:else}
      <LucideIcons name="bot" size={16} />
    {/if}
  </div>
  <div class="max-w-[85%] md:max-w-[70%] px-3.5 py-2.5 text-sm leading-relaxed rounded-xl
    {isUser ? 'bg-primary text-white rounded-br-sm' : ''}
    {isAssistant ? 'bg-assistant-msg border border-border rounded-bl-sm' : ''}
    {isTool ? 'bg-tool-msg border border-border text-text-muted text-xs rounded-bl-sm' : ''}">
    {#if content}
      <div class="whitespace-pre-wrap break-words">{content}{#if streaming}<span class="text-primary animate-pulse ml-0.5">|</span>{/if}</div>
    {/if}
    {#if toolCalls && toolCalls.length > 0}
      <div class="mt-2">
        {#each toolCalls as tc}
          <ToolCall
            name={tc.function?.name || tc.name}
            arguments_={tc.function?.arguments || tc.arguments}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>
