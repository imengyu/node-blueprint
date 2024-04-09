<template>
  <div class="node-editor-toolbar">
    <slot />
  </div>
</template>

<style lang="scss">
@import '../NodeIdeDefine.scss';

.node-editor-toolbar {
  position: relative;
  border-right: none;
  height: 100%;
  padding-top: 20px;
  background: var(--mx-editor-background-color);
  width: $left-toolbar-width;
  
  &::before {
    display: inline-block;
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    background-color: var(--mx-editor-border-color-dark);
    z-index: 0;
  }

  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-direction: column;
  user-select: none;
  overflow: hidden;

  > .tool-item {
    width: $left-toolbar-width;
    height: $left-toolbar-width;
    line-height: $left-toolbar-width;
  }
  .button {
    position: relative;
    text-align: center;
    display: inline-flex;
    cursor: pointer;
    font-size: 15px;
    user-select: none;
    color: var(--mx-editor-light-text-color);
    justify-content: center;
    align-items: center;
    overflow: visible;
    color: var(--mx-editor-light-text-color);

    &:hover {
      color: var(--mx-editor-active-text-color);
      
      svg {
        color: var(--mx-editor-active-text-color);
        fill: var(--mx-editor-active-text-color);
      }
    }

    svg {
      fill: var(--mx-editor-light-text-color);
    }

    &.icon {
      width: $left-toolbar-width;
      height: $left-toolbar-width;
      font-size: 18px;
    }

    &:hover {
      color: var(--mx-editor-active-text-color);
    }
    &.active {
      border-top: 1px solid var(--mx-editor-border-color-dark);
      border-bottom: 1px solid var(--mx-editor-border-color-dark);
      border-left: 1px solid var(--mx-editor-border-color-dark);
      background-color: var(--mx-editor-background-second-color);

      &::after {
        display: inline-block;
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        right: 1px;
        width: 1px;
        background-color: var(--mx-editor-background-second-color);
      }
    }
    &:focus {
      opacity: 0.8;
    }
    

    @each $key, $color in $text-color-names {
      &.#{"" + $key} {
        color: var(--mx-editor-#{$key}-text-color);
        svg {
          fill: var(--mx-editor-#{$key}-text-color);
        }

        &:hover {
          color: var(--mx-editor-#{$key}-light-text-color);
          
          svg {
            color: var(--mx-editor-#{$key}-light-text-color);
            fill: var(--mx-editor-#{$key}-light-text-color);
          }
        }
      }
    }

    &.disabled, &[disabled] {
      cursor: default!important;
      opacity: 1;
      background-color: transparent!important;

      svg {
        color: var(--mx-editor-drak-text-color)!important;
        fill: var(--mx-editor-drak-text-color)!important;
      }
    }
  }
  .separator {
    display: inline-block;
    width: 100%;
    height: 1px;
    margin: 4px 3px 0 3px;
    border-bottom: 2px dashed var(--mx-editor-border-color);
  }
  .block {
    display: inline-block;
    padding: 1px 8px;
  }
}
</style>