<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script lang="ts">

import Vue from 'vue'

export default Vue.extend({
  name: 'App',
  mounted: function() {
    console.log('App mounted');
  },
  destroyed: function() {
    console.log('App destroyed');
  }
})

</script>
