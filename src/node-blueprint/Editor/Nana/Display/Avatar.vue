<template>
  <div 
    :class="[
      'nana-avatar',
      round ? 'round' : '',
    ]"
    :style="{
      borderRadius: round ? undefined : radius,
      width: solveSize(size),
      height: solveSize(size),
    }"
    @click="$emit('click')"
  >
    <img 
      v-if="url || defaultAvatar" :src="url || defaultAvatar"
      :style="{
        width: solveSize(size),
        height: solveSize(size),
      }"
    >
    <span 
      v-else 
      :style="{ 
        width: solveSize(size),
        height: solveSize(size),
        lineHeight: solveSize(size),
        color: textColor,
        ...textStyle
      }"
    >
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { solveSize } from '../Utils/StyleUtils'

defineProps({
  /**
   * 默认头像，在 url 为空或者加载失败时使用此头像
   */
  defaultAvatar: {
    type: String,
    default: '',
  },
  /**
   * 头像的图标URL
   */
  url: {
    type: String,
    default: '',
  },
  /**
   * 当未提供 url 时，支持在头像上显示文字, 建议显示1-2个汉字
   */
  text: {
    type: String,
    default: '',
  },
  /**
   * 文字的颜色
   * @default '#fff'
   */
  textColor: {
    type: String,
    default: '',
  },
  /**
   * 文字的样式
   */
  textStyle: {
    type: Object,
    default: null,
  },
  /**
   * 头像的大小。
   * @default 40
   */
  size: {
    type: Number,
    default: 40,
  },
  /**
   * 头像圆角大小
   * @default 0
   */
  radius: {
    type: Number,
    default: 0,
  },
  /**
   * 头像是否是圆型，设置后 radius 无效
   * @default false
   */
  round: {
    type: Boolean,
    default: false,
  },
});
defineEmits([ 'click' ]);
</script>

<style lang="scss">
.nana-avatar {
  --nana-avatar-background: var(--nana-fill-1);

  overflow: hidden;
  background-color: var(--nana-avatar-background);

  span {
    display: block;
    text-align: center;
    user-select: none;
    font-weight: bold;
  }

  &.round {
    border-radius: var(--nana-border-radius-circle);
  }
}
</style>