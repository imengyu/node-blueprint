<template>
  <button
    :class="[
      'nana-button',
      round ? 'round' : '',
      disabled ? 'disabled' : '',
      loading ? 'loading' : '',
      size ? `size-${size}` : '',
      status ? `status-${status} status` : '',
    ]"
    @click="disabled ? {} : $emit('click')"
  >
    <SimpleLoading v-if="loading" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import SimpleLoading from './SimpleLoading.vue';

defineEmits([ 'click' ]);

defineProps({
  round: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String as PropType<'primary'|'error'|'warning'|'info'|'success'>,
    default: '',
  },
  size: {
    type: String,
    default: 'normal',
  },
});
</script>

<style lang="scss">
:root {
  --nana-button-dark-text-color: var(--nana-text-2);
  --nana-button-light-text-color: var(--nana-text-5);
  --nana-button-default-color: var(--nana-fill-5);
  --nana-button-default-hover-color: var(--nana-fill-3);
  --nana-button-normal-border-radius: var(--nana-border-radius-large);
  --nana-button-round-border-radius: var(--nana-border-radius-round);
}

.nana-button {
  background: transparent;
  appearance: none;
  outline: none;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
  flex-shrink: 0;
  user-select: none;
  width: auto;
  white-space: nowrap;
  min-width: 55px;
  transition: background-color .1s,transform .1s,color .35s cubic-bezier(.65,0,.25,1),padding .25s cubic-bezier(.65,0,.25,1);
  border: none;
  cursor: pointer;
  background-color: var(--nana-button-default-color);
  box-shadow: 0 2px 5px 0 rgba(#000, 0.05);
  border: 1px solid rgba(#000, 0.1);
  border-radius: var(--nana-button-normal-border-radius);
  color: var(--nana-button-dark-text-color);
  box-sizing: border-box;
  overflow: hidden;
  
  --nana-simple-loading-color:  var(--nana-button-dark-text-color);

  &.disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
  &.loading {
    cursor: default;
  }

  .simple-loading {
    margin-right: 8px;
  }

  &.status {
    &-primary {
      --nana-simple-loading-color: var(--nana-button-light-text-color);

      color: var(--nana-button-light-text-color);
      background: linear-gradient(var(--nana-primary-2), var(--nana-primary-1));
      outline-color: var(--nana-hover-primary-2);
    }
    &-error {
      --nana-simple-loading-color: var(--nana-button-light-text-color);

      color: var(--nana-button-light-text-color);
      background-color: var(--nana-error-1);
      outline-color: var(--nana-error-2);
    }
    &-warning {
      --nana-simple-loading-color: var(--nana-button-light-text-color);

      color: var(--nana-button-light-text-color);
      background-color: var(--nana-warning-1);
      outline-color: var(--nana-warning-2);
    }
    &-info {
      --nana-simple-loading-color: var(--nana-button-light-text-color);

      color: var(--nana-button-light-text-color);
      background-color: var(--nana-info-1);
      outline-color: var(--nana-info-2);
    }
    &-success {
      --nana-simple-loading-color: var(--nana-button-light-text-color);

      color: var(--nana-button-light-text-color);
      background-color: var(--nana-success-1);
      outline-color: var(--nana-success-2);
    }
  }
  &.round {
    border-radius: var(--nana-button-round-border-radius);
  }
  &.size {
    &-large {
      height: 60px;
      padding: 0 40px;
      font-size: 18px;

      .simple-loading {
        width: 18px;
        height: 18px;
      }
    }
    &-normal {
      height: 40px;
      padding: 0 25px;
      font-size: 14px;

      .simple-loading {
        width: 14px;
        height: 14px;
      }
    }
    &-small {
      height: 27px;
      padding: 0 10px;
      font-size: 13px;

      .simple-loading {
        width: 13px;
        height: 13px;
      }
    }
    &-mini {
      height: 23px;
      padding: 0 4px;
      font-size: 12px;

      .simple-loading {
        width: 12px;
        height: 12px;
      }
    }
  }

  &:not(.disabled):not(.loading) {
    &:hover {
      &.status {
        background-color: var(--nana-button-default-hover-color);

        &-primary {
          background-color: var(--nana-primary-2);
        }
        &-error {
          background-color: var(--nana-error-2);
        }
        &-warning {
          background-color: var(--nana-warning-2);
        }
        &-info {
          background-color: var(--nana-info-2);
        }
        &-success {
          background-color: var(--nana-success-2);
        }
      }
    }
    &:focus {
      outline: 1px solid #fff;
    }
    &:active {
      transform: scale(0.95);
    }
  }
}
</style>