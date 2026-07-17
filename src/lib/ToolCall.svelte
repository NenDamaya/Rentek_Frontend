<script>
  export let name
  export let arguments_

  $: collapsed = true

  function toggle() {
    collapsed = !collapsed
  }

  function formatArgs(args) {
    if (!args || args === '{}') return '{}'
    try {
      const parsed = typeof args === 'string' ? JSON.parse(args) : args
      return JSON.stringify(parsed, null, 2)
    } catch {
      return String(args)
    }
  }
</script>

<div class="tool-call" class:collapsed>
  <button class="tool-header" on:click={toggle}>
    <span class="tool-icon">🔧</span>
    <span class="tool-name">{name}</span>
    <span class="tool-toggle">{collapsed ? '▼' : '▲'}</span>
  </button>
  {#if !collapsed}
    <pre class="tool-args">{formatArgs(arguments_)}</pre>
  {/if}
</div>

<style>
  .tool-call {
    background: var(--tool-msg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin: 4px 0;
    overflow: hidden;
  }
  .tool-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 12px;
    background: none;
    border: none;
    color: var(--text);
    cursor: pointer;
    font-size: 0.85em;
    text-align: left;
  }
  .tool-header:hover {
    background: var(--surface-2);
  }
  .tool-icon {
    font-size: 0.9em;
  }
  .tool-name {
    flex: 1;
    font-family: monospace;
    color: var(--primary);
  }
  .tool-toggle {
    color: var(--text-muted);
    font-size: 0.8em;
  }
  .tool-args {
    padding: 8px 12px;
    margin: 0;
    font-size: 0.8em;
    color: var(--text-muted);
    background: var(--surface);
    border-top: 1px solid var(--border);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
