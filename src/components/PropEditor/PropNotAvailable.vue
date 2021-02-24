<template>
  <div class="empty-view">
    {{title}}<br/>当前属性面板不可用
  </div>
</template>

<script>
export default {
  name: 'PropNotAvailable',
  props: [ 'title' ]
}
</script>