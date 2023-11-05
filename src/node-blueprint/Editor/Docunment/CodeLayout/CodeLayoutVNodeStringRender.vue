<script lang="ts">
import { defineComponent, h } from 'vue';

export default defineComponent({
  props: {
    content: {
      type: null,
      required: true,
    },
  },
  render() {
    if (typeof this.content === 'string')
      return [ h('span', this.content) ];
    if (typeof this.content === 'function')
      return [ this.content() ];
    return [];
  },
})
</script>