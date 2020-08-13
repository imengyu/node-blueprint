<template>
  <Editor />
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import Editor from "../components/Editor.vue";

@Component({
  components: {
    'Editor': Editor,
  }
})
export default class EditorView extends Vue {

}
</script>