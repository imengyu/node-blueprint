<template>
  <div class="node-checkbox no-drag param-editor" @click="() => $emit('update-value', !value)">
    <Icon v-if="value" icon="icon-select-bold" />
  </div>
</template>

<script lang="ts">
import type { IKeyValueObject } from '@/node-blueprint/Base/Utils/BaseTypes';
import { defineComponent, type PropType } from 'vue'
import Icon from '../../Base/Icon.vue';

export default defineComponent({
    name: "BooleanEditor",
    emits: ["update-value", "update-custom-data"],
    props: {
        value: {
            type: Boolean,
            required: true
        },
        customData: Object as PropType<IKeyValueObject>,
    },
    components: { Icon }
})
</script>
