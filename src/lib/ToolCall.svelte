<script>
  import LucideIcons from './LucideIcons.svelte'

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

<div class="border border-border rounded-lg overflow-hidden mt-1">
  <button class="flex items-center gap-2 w-full py-1.5 px-3 bg-transparent border-none text-text cursor-pointer text-xs text-left hover:bg-surface-alt transition-colors" on:click={toggle}>
    <LucideIcons name="wrench" size={12} />
    <span class="flex-1 font-mono text-accent">{name}</span>
    <span class="text-text-faint text-[0.65rem]">{collapsed ? '\u25BC' : '\u25B2'}</span>
  </button>
  {#if !collapsed}
    <pre class="px-3 py-2 m-0 text-[0.7rem] text-text-muted bg-surface border-t border-border overflow-x-auto whitespace-pre-wrap break-all">{formatArgs(arguments_)}</pre>
  {/if}
</div>
