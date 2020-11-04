<template>
  <router-view></router-view>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({
  components: {},
  name: "App"
})
export default class App extends Vue {
}
</script>
