<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="code-layot-root">
    <!--root-->
    <div class="code-layot-activity">
      <!--activity bar-->
      <div class="code-layot-activity-bar">
        <slot name="activityBar" />
      </div>
      <!--
        base area
      
        and if bottomAlignment is justify, show bottom panel here
        +----+---------+-----+
        |left| center  |right|
        |--------------------|
        |    bottom panel    |
        +----+---------+-----+
      
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
            +----+---------+-----+
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
            +----+---------+-----+
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
    <div v-if="config.statusBar" class="code-layot-status" :style="{ height: config.statusBarHeight }">
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
:root {
  --code-layot-color-background: #1e1e1e;
  --code-layot-color-background-light: #333333;
  --code-layot-color-highlight: #0078d4;
  --code-layot-color-border-background: #2a2a2a;
  --code-layot-color-border-size: 3px;
}

.code-layot-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background-color: var(--code-layot-color-background);

  > .code-layot-activity {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    flex: 1;

    .code-layot-activity-bar {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      background-color: var(--code-layot-color-background-light);
      width: 45px;
    }
  }
  > .code-layot-status {
    flex-grow: 0;
    background-color: var(--code-layot-color-highlight);
  }
}

.code-layot-split-base {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;

  &.vertical {
    flex-direction: column;
    justify-content: stretch;
    align-items: flex-start;

    > .code-layot-split-dragger {
      width:100% ;
      height: var(--code-layot-color-border-size);
      cursor: ns-resize;

      &::after {
        left: 0;
        right: 0;
        top: 1px;
        height: 1px;
        bottom: unset;
        width: unset;
      }
    }
  }
  &.horizontal {
    flex-direction: row;
    justify-content: flex-start;
    align-items: stretch;

    > .code-layot-split-dragger {
      width: var(--code-layot-color-border-size);
      height: 100%;
      cursor: ew-resize;

      &::after {
        top: 0;
        bottom: 0;
        left: 1px;
        width: 1px;
      }
    }
  }

  > .code-layot-split-dragger {
    position: relative;
    height: 100%;
    width: var(--code-layot-color-border-size);
    cursor: ns-resize;
    user-select: none;

    &::after {
      position: absolute;
      content: '';
      top: 0;
      bottom: 0;
      left: 1px;
      width: 1px;
      background-color: var(--code-layot-color-border-background);
    }

    &.resize:hover {
      background-color: var(--code-layot-color-highlight);

      &::after {
        background-color: transparent;
      }
    }
  }
}
</style>