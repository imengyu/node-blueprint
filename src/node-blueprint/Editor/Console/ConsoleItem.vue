<template>
  <div 
    :class="[ 
      'console-item ',
      level,
      warpOpen ? 'warp' : '',
      tiny ? 'tiny' : '',
    ]"
  >
    <Icon 
      v-if="hasWarp" 
      icon="icon-arrow-right-filling"
      fill="currentColor"
      :class="'switch iconfont' + (warpOpen?' open':'')"
      @click="$emit('update:warpOpen', !warpOpen)"
    />

    <Icon v-if="level==='error'" icon="icon-delete-filling" class="icon iconfont text-danger" />
    <Icon v-else-if="level==='warning'" icon="icon-warning-filling" class="icon text-warning" />
    <Icon v-else-if="level==='info'" icon="icon-prompt-filling" class="icon text-info" />

    <span v-if="tag" class="tag mr-2">{{ tag }}</span>

    <span v-if="typeof content === 'string'">{{ content }}</span>
    <ConsoleObjectShower 
      v-else-if="speicalType==='object'"
      :value="content"
      @on-go-ref="(d: string,b: string,p: string) => $emit('goRef', d,b,p)" 
    />
    <ConsoleRefShower 
      v-else 
      :value="content"
      :isTop="true"
      @on-go-ref="(d: string,b: string,p: string) => $emit('goRef', d,b,p)"
    />

    <a 
      v-if="srcText"
      class="src"
      @click="$emit('goSrc')"
    >
      {{ srcText }}
    </a>
  </div>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue'
import ConsoleRefShower from "./ConsoleRefShower.vue";
import ConsoleObjectShower from "./ConsoleObjectShower.vue";
import Icon from "../Nana/Icon.vue";
import type { LogLevel } from '@/node-blueprint/Base/Logger/Logger';
import type { LogSpeicalType } from './Console.vue';

defineProps({
  level: {
    type: String as PropType<LogLevel>,
    default: undefined,
  },
  speicalType: {
    type: String as PropType<LogSpeicalType>,
    default: '',
  },
  srcText: {
    type: String,
    default: null,
  },
  tag: {
    type: String,
    default: null,
  },
  content: {
    type: null,
    default: null,
  },
  showAs: {
    type: null,
    default: null,
  },
  warpOpen: {
    type: Boolean,
    default: false,
  },
  hasWarp: {
    type: Boolean,
    default: false,
  },
  tiny: {
    type: Boolean,
    default: false,
  },
});
defineEmits([ 
  'goSrc',
  'goRef',
  'update:warpOpen'
]);
</script>