<script>
  import ToolCall from './ToolCall.svelte'

  export let role
  export let content
  export let toolCalls = []
  export let streaming = false

  $: isUser = role === 'user'
  $: isAssistant = role === 'assistant'
  $: isTool = role === 'tool'
</script>

<div class="message" class:user={isUser} class:assistant={isAssistant} class:tool={isTool}>
  <div class="avatar">
    {#if isUser}
      👤
    {:else if isTool}
      ⚙️
    {:else}
      🤖
    {/if}
  </div>
  <div class="bubble">
    {#if content}
      <div class="text">{content}{#if streaming}<span class="cursor">▊</span>{/if}</div>
    {/if}
    {#if toolCalls && toolCalls.length > 0}
      <div class="tool-calls">
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

<style>
  .message {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-start;
  }
  .message.user {
    flex-direction: row-reverse;
  }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1em;
    flex-shrink: 0;
  }
  .user .avatar {
    background: var(--primary);
  }
  .assistant .avatar {
    background: var(--surface-2);
  }
  .tool .avatar {
    background: var(--tool-msg);
    font-size: 0.9em;
  }
  .bubble {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: var(--radius);
    line-height: 1.5;
    font-size: 0.95em;
  }
  .user .bubble {
    background: var(--user-msg);
    color: white;
    border-bottom-right-radius: 4px;
  }
  .assistant .bubble {
    background: var(--assistant-msg);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }
  .tool .bubble {
    background: var(--tool-msg);
    border: 1px solid var(--border);
    font-size: 0.85em;
    color: var(--text-muted);
  }
  .text {
    white-space: pre-wrap;
    word-break: break-word;
  }
  .tool-calls {
    margin-top: 8px;
  }
  .cursor {
    animation: blink 0.7s infinite;
    color: var(--primary);
  }
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
</style>
