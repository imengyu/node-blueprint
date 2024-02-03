<script lang="ts">
import { defineComponent, h } from 'vue';

export default defineComponent({
  props: {
    content: {
      type: null,
      required: true,
    },
    class: {
      type: String,
      default: '',
    }
  },
  render() {
    if (typeof this.content === 'string')
      return [ h('span', { class: this.class }, this.content) ];
    if (typeof this.content === 'function')
      return [ this.content() ];
    return [];
  },
})
</script>