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
        :showSecond="config.bottomPanel && config.bottomAlignment === 'justify'"
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
            :showLeft="config.primarySideBar"
            :showRight="config.secondarySideBar"
          >
            <template #left>
              <slot name="primarySideBar" />
            </template>
            <template #center>
              <SplitBase
                v-model:size="config.bottomPanelHeight"
                :horizontal="false"
                :showSecond="config.bottomPanel && config.bottomAlignment === 'center'"
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
            :showSecond="config.secondarySideBar"
            @update:size="(s) => config.secondarySideBarWidth = 100 - s"
          >
            <template #first>
              <SplitBase
                v-model:size="config.bottomPanelHeight"
                :showSecond="config.bottomPanel"
              >
                <template #first>
                  <SplitBase
                    v-model:size="config.primarySideBarWidth"
                    :showFirst="config.primarySideBar"
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
            :showFirst="config.primarySideBar"
          >
            <template #first>
              <SplitBase
                v-model:size="config.bottomPanelHeight"
                :showSecond="config.bottomPanel"
              >
                <template #first>
                  <SplitBase
                    v-model:size="config.primarySideBarWidth"
                    :showFirst="config.primarySideBar"
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
            <template #second>
              <slot name="primarySideBar" />
            </template>
          </SplitBase>
        </template>
        <template #second>
          <slot name="bottomPanel" />
        </template>
      </SplitBase>
    </div>
    <!--status bar-->
    <div v-if="config.statusBar" class="code-layout-status" :style="{ height: config.statusBarHeight }">
      <slot name="statusBar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import SplitThird from './SplitLayout/SplitThird.vue';
import SplitBase from './SplitLayout/SplitBase.vue';

export interface CodeLayoutConfig {
  activityBar: boolean,
  primarySideBar: boolean,
  primarySideBarWidth: number,
  secondarySideBar: boolean,
  secondarySideBarWidth: number,
  bottomPanel: boolean,
  bottomPanelHeight: number,
  bottomAlignment: 'left'|'center'|'right'|'justify',
  statusBar: boolean,
  statusBarHeight: number|string,
}

defineProps({
  config: {
    type: Object as PropType<CodeLayoutConfig>,
    required: true,
  },
});

</script>

<style lang="scss">
@import "./Scss/Root.scss";
</style>