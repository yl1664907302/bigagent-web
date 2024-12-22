<template>
  <div v-html="md.render(markdown)"></div>
</template>
<script>
import MarkdownIt from 'markdown-it'
export default {
  data() {
    return {
      markdown: '# Hello, world!\nThis is **Markdown**.',
      md: new MarkdownIt()
    }
  }
}
</script>