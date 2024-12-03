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

    <slot>
      <div v-for="(content, i) in contents" :key="i" class="console-content-box">
        <span v-if="typeof content.content === 'string'">{{ content.content }}</span>
        <ConsoleObjectShower 
          v-else-if="content.speicalType==='object'"
          :value="content.content"
          @on-go-ref="(d: string,b: string,p: string) => $emit('goRef', d,b,p)" 
        />
        <ConsoleRefShower 
          v-else 
          :value="content.content"
          :isTop="true"
          @on-go-ref="(d: string,b: string,p: string) => $emit('goRef', d,b,p)"
        />
      </div>
    </slot>

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
import type { LogContentType, LogLevel } from '@/node-blueprint/Base/Logger/Logger';
import type { LogSpeicalType } from './Console.vue';

defineProps({
  level: {
    type: String as PropType<LogLevel>,
    default: undefined,
  },
  srcText: {
    type: String,
    default: null,
  },
  tag: {
    type: String,
    default: null,
  },
  contents: {
    type: Object as PropType<{
      content: LogContentType,
      speicalType: LogSpeicalType,
    }[]>,
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