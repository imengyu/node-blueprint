<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="code-layout-root">
    <!--root-->
    <div class="code-layout-activity">
      <!--activity bar-->
      <div class="code-layout-activity-bar">
        <slot name="activityBar" />
      </div>
      <!--
        base area
      
        and if bottomAlignment is justify, show bottom panel here
        +----+---------+-----+
        |left| center  |right|
        |--------------------|
        |    bottom panel    |
        +--------------------+
      
      -->
      <SplitBase
        v-model:size="config.bottomPanelHeight"
        :horizontal="false"
        :showSecond="bottomPanel && config.bottomAlignment === 'justify'"
        :secondMinSize="config.bottomPanelMinHeight"
        @closeSecond="(v) => $emit('update:bottomPanel', v)"
      >
        <template #first>
          <!--
            simple split three grid：
            +----+---------+-----+
            |left| center  |right|
            |    |---------|     |
            |    | panel   |     |
            +----+---------+-----+
          -->
          <SplitThird 
            v-if="config.bottomAlignment === 'center' || config.bottomAlignment === 'justify'"
            v-model:sizeLeft="config.primarySideBarWidth"
            v-model:sizeRight="config.secondarySideBarWidth"
            :showLeft="primarySideBar"
            :showRight="secondarySideBar"
            :leftMinSize="config.primarySideBarMinWidth"
            :rightMinSize="config.secondarySideBarWidth"
            @closeLeft="(v) => $emit('update:primarySideBar', v)"
            @closeRight="(v) => $emit('update:secondarySideBar', v)"
          >
            <template #left>
              <slot name="primarySideBar" />
            </template>
            <template #center>
              <SplitBase
                :size="100 - config.bottomPanelHeight"
                :horizontal="false"
                :showSecond="bottomPanel && config.bottomAlignment === 'center'"
                :secondMinSize="config.bottomPanelMinHeight"
                @update:size="(s) => config.bottomPanelHeight = 100 - s"
                @closeSecond="(v) => $emit('update:bottomPanel', v)"
              >
                <template #first>
                  <slot name="centerArea" />
                </template>
                <template #second>
                  <slot name="bottomPanel" />
                </template>
              </SplitBase>
            </template>
            <template #right>
              <slot name="secondarySideBar" />
            </template>
          </SplitThird>
          <!--
            split three grid but bottom panel in left
          
            +----+---------+-----+
            |left| center  |right|
            |--------------|     |
            |   panel      |     |
            +--------------+-----+
          -->
          <SplitBase
            v-if="config.bottomAlignment === 'left'"
            :size="100 - config.secondarySideBarWidth"
            :showSecond="secondarySideBar"
            :secondMinSize="config.secondarySideBarMinWidth"
            @closeSecond="(v) => $emit('update:secondarySideBar', v)"
            @update:size="(s) => config.secondarySideBarWidth = 100 - s"
          >
            <template #first>
              <SplitBase
                v-model:size="config.bottomPanelHeight"
                :horizontal="false"
                :showSecond="bottomPanel"
                :secondMinSize="config.bottomPanelMinHeight"
                @closeSecond="(v) => $emit('update:bottomPanel', v)"
              >
                <template #first>
                  <SplitBase
                    v-model:size="config.primarySideBarWidth"
                    :showFirst="primarySideBar"
                    :firstMinSize="config.primarySideBarMinWidth"
                    @closeFirst="(v) => $emit('update:primarySideBar', v)"
                  >
                    <template #first>
                      <slot name="primarySideBar" />
                    </template>
                    <template #second>
                      <slot name="centerArea" />
                    </template>
                  </SplitBase>
                </template>
                <template #second>
                  <slot name="bottomPanel" />
                </template>
              </SplitBase>
            </template>
            <template #second>
              <slot name="secondarySideBar" />
            </template>
          </SplitBase>
          <!--
            split three grid but bottom panel in right 
            
            +----+---------+-----+
            |left| center  |right|
            |    |---------------|
            |    |     panel     |
            +----+---------------+
          -->
          <SplitBase
            v-if="config.bottomAlignment === 'right'"
            v-model:size="config.primarySideBarWidth"
            :showFirst="primarySideBar"
            :firstMinSize="config.primarySideBarMinWidth"
            @closeFirst="(v) => $emit('update:primarySideBar', v)"
          >
            <template #first>
              <slot name="primarySideBar" />
            </template>
            <template #second>
              <SplitBase
                :size="100 - config.bottomPanelHeight"
                :horizontal="false"
                :showSecond="bottomPanel"
                :secondMinSize="config.bottomPanelMinHeight"
                @update:size="(v) => config.bottomPanelHeight = 100 - v"
                @closeSecond="(v) => $emit('update:bottomPanel', v)"
              >
                <template #first>
                  <SplitBase
                    v-model:size="config.primarySideBarWidth"
                    :showFirst="primarySideBar"
                    :firstMinSize="config.primarySideBarMinWidth"
                    @closeFirst="(v) => $emit('update:primarySideBar', v)"
                  >
                    <template #first>
                      <slot name="centerArea" />
                    </template>
                    <template #second>
                      <slot name="secondarySideBar" />
                    </template>
                  </SplitBase>
                </template>
                <template #second>
                  <slot name="bottomPanel" />
                </template>
              </SplitBase>
            </template>
          </SplitBase>
        </template>
        <template #second>
          <slot name="bottomPanel" />
        </template>
      </SplitBase>
    </div>
    <!--status bar-->
    <div v-if="statusBar" class="code-layout-status" :style="{ height: config.statusBarHeight }">
      <slot name="statusBar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import SplitThird from './SplitLayout/SplitThird.vue';
import SplitBase from './SplitLayout/SplitBase.vue';
import type { CodeLayoutConfig } from './CodeLayout';

defineEmits([ 
  'update:secondarySideBar',
  'update:primarySideBar',
  'update:bottomPanel'
])

defineProps({
  config: {
    type: Object as PropType<CodeLayoutConfig>,
    required: true,
  },
  activityBar: {
    type: Boolean,
    default: true,
  },
  primarySideBar: {
    type: Boolean,
    default: true,
  },
  secondarySideBar: {
    type: Boolean,
    default: true,
  },
  bottomPanel: {
    type: Boolean,
    default: true,
  },
  statusBar: {
    type: Boolean,
    default: true,
  },
});

</script>

<style lang="scss">
@import "./Scss/Root.scss";
</style>