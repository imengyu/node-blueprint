<template>
  <div class="prop-item">
    <span>{{ title }}</span>
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps({
  title: {
    type: String,
    default: '',
  }
});
</script>

<style lang="scss">.prop-item {
  white-space: nowrap;
  position: relative;
  padding: 3px 2px 5px 0;
  border-bottom: 1px solid var(--mx-editor-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  > .prop-item-editor {
    display: inline-block;
    width: 60%;
  }
  > span {
    display: inline-block;
    width: 40%;
    text-align: right;
    padding-right: 10px;
    color: var(--mx-editor-text-color);
  }
}
</style>