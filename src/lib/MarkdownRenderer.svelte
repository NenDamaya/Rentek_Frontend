<script>
  import { marked } from 'marked'

  export let content = ''

  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  $: html = marked.parse(content || '')
</script>

<div class="markdown-body leading-relaxed">{@html html}</div>

<style>
  .markdown-body :global(p) {
    margin: 0 0 0.5rem 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .markdown-body :global(p:last-child) {
    margin-bottom: 0;
  }
  .markdown-body :global(ul), .markdown-body :global(ol) {
    margin: 0.25rem 0;
    padding-left: 1.5rem;
  }
  .markdown-body :global(li) {
    margin: 0.15rem 0;
  }
  .markdown-body :global(strong) {
    font-weight: 600;
  }
  .markdown-body :global(code) {
    background: rgba(0,0,0,0.06);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
  }
  .markdown-body :global(pre) {
    overflow-x: auto;
    padding: 0.75rem;
    border-radius: 6px;
    margin: 0.5rem 0;
  }
</style>
