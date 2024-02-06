<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div ref="container" class="code-layout-root">
    <div v-if="config.titleBar" class="code-layout-title-bar">
      <div>
        <slot name="titleBarIcon" />
        <slot v-if="config.menuBar" name="titleBarMenu" />
      </div>
      <div>
        <slot name="titleBarCenter" />
      </div>
      <div>
        <slot name="titleBarRight" />
      </div>
    </div>
    <!--root-->
    <div class="code-layout-activity">
      <!--activity bar-->
      <div 
        v-if="config.activityBar && config.primarySideBarPosition === 'left' && config.activityBarPosition === 'side'" 
        :class="['code-layout-activity-bar',config.primarySideBarPosition]"
      >
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
        :secondMinSize="config.bottomPanelMinHeight"
        @closeSecond="(v) => config.bottomPanel = v"
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
          <template v-if="config.bottomAlignment === 'center' || config.bottomAlignment === 'justify'">
            <SplitThird 
              v-if="config.primarySideBarPosition === 'left'"
              v-model:sizeLeft="config.primarySideBarWidth"
              v-model:sizeRight="config.secondarySideBarWidth"
              :showLeft="config.primarySideBar"
              :showRight="config.secondarySideBar"
              :leftMinSize="config.primarySideBarMinWidth"
              :rightMinSize="config.secondarySideBarWidth"
              @closeLeft="(v) => config.primarySideBar = v"
              @closeRight="(v) => config.secondarySideBar = v"
            >
              <template #left>
                <slot name="primarySideBar" />
              </template>
              <template #center>
                <SplitBase
                  :size="100 - config.bottomPanelHeight"
                  :horizontal="false"
                  :showSecond="config.bottomPanel && config.bottomAlignment === 'center'"
                  :secondMinSize="config.bottomPanelMinHeight"
                  @update:size="(s) => config.bottomPanelHeight = 100 - s"
                  @closeSecond="(v) => config.bottomPanel = v"
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
            <SplitThird 
              v-if="config.primarySideBarPosition === 'right'"
              v-model:sizeLeft="config.secondarySideBarWidth"
              v-model:sizeRight="config.primarySideBarWidth"
              :showLeft="config.secondarySideBar"
              :showRight="config.primarySideBar"
              :leftMinSize="config.secondarySideBarWidth"
              :rightMinSize="config.primarySideBarMinWidth"
              @closeLeft="(v) => config.secondarySideBar = v"
              @closeRight="(v) => config.primarySideBar = v"
            >
              <template #left>
                <slot name="secondarySideBar" />
              </template>
              <template #center>
                <SplitBase
                  :size="100 - config.bottomPanelHeight"
                  :horizontal="false"
                  :showSecond="config.bottomPanel && config.bottomAlignment === 'center'"
                  :secondMinSize="config.bottomPanelMinHeight"
                  @update:size="(s) => config.bottomPanelHeight = 100 - s"
                  @closeSecond="(v) => config.bottomPanel = v"
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
                <slot name="primarySideBar" />
              </template>
            </SplitThird>
          </template>
          <!--
            split three grid but bottom panel in left
          
            +----+---------+-----+
            |left| center  |right|
            |--------------|     |
            |   panel      |     |
            +--------------+-----+
          -->
          <template v-if="config.bottomAlignment === 'left'">
            <SplitBase
              v-if="config.primarySideBarPosition === 'left'"
              :size="100 - config.secondarySideBarWidth"
              :showSecond="config.secondarySideBar"
              :secondMinSize="config.secondarySideBarMinWidth"
              @closeSecond="(v) => config.secondarySideBar = v"
              @update:size="(s) => config.secondarySideBarWidth = 100 - s"
            >
              <template #first>
                <SplitBase
                  v-model:size="config.bottomPanelHeight"
                  :horizontal="false"
                  :showSecond="config.bottomPanel"
                  :secondMinSize="config.bottomPanelMinHeight"
                  @closeSecond="(v) => config.bottomPanel = v"
                >
                  <template #first>
                    <SplitBase
                      v-model:size="config.primarySideBarWidth"
                      :showFirst="config.primarySideBar"
                      :firstMinSize="config.primarySideBarMinWidth"
                      @closeFirst="(v) => config.primarySideBar = v"
                    >
                      <template #first>
                        <slot v-if="config.primarySideBarPosition === 'left'" name="primarySideBar" />
                        <slot v-else name="secondarySideBar" />
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
            <SplitBase
              v-if="config.primarySideBarPosition === 'right'"
              :size="100 - config.primarySideBarWidth"
              :showSecond="config.primarySideBar"
              :secondMinSize="config.primarySideBarMinWidth"
              @closeSecond="(v) => config.primarySideBar = v"
              @update:size="(s) => config.primarySideBarWidth = 100 - s"
            >
              <template #first>
                <SplitBase
                  v-model:size="config.bottomPanelHeight"
                  :horizontal="false"
                  :showSecond="config.bottomPanel"
                  :secondMinSize="config.bottomPanelMinHeight"
                  @closeSecond="(v) => config.bottomPanel = v"
                >
                  <template #first>
                    <SplitBase
                      v-model:size="config.secondarySideBarWidth"
                      :showFirst="config.secondarySideBar"
                      :firstMinSize="config.secondarySideBarMinWidth"
                      @closeFirst="(v) => config.secondarySideBar = v"
                    >
                      <template #first>
                        <slot name="secondarySideBar" />
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
                <slot name="primarySideBar" />
              </template>
            </SplitBase>
          </template>
          <!--
            split three grid but bottom panel in right 
            
            +----+---------+-----+
            |left| center  |right|
            |    |---------------|
            |    |     panel     |
            +----+---------------+
          -->
          <template v-if="config.bottomAlignment === 'right'">
            <SplitBase
              v-if="config.primarySideBarPosition === 'left'"
              v-model:size="config.primarySideBarWidth"
              :showFirst="config.primarySideBar"
              :firstMinSize="config.primarySideBarMinWidth"
              @closeFirst="(v) => config.primarySideBar = v"
            >
              <template #first>
                <slot name="primarySideBar" />
              </template>
              <template #second>
                <SplitBase
                  :size="100 - config.bottomPanelHeight"
                  :horizontal="false"
                  :showSecond="config.bottomPanel"
                  :secondMinSize="config.bottomPanelMinHeight"
                  @update:size="(v) => config.bottomPanelHeight = 100 - v"
                  @closeSecond="(v) => config.bottomPanel = v"
                >
                  <template #first>
                    <SplitBase
                      :size="100 - config.secondarySideBarWidth"
                      :showFirst="config.secondarySideBar"
                      :secondMinSize="config.secondarySideBarMinWidth"
                      @update:size="(v) => config.secondarySideBarWidth = 100 - v"
                      @closeFirst="(v) => config.secondarySideBar = v"
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
            <SplitBase
              v-if="config.primarySideBarPosition === 'right'"
              v-model:size="config.secondarySideBarWidth"
              :showFirst="config.secondarySideBar"
              :firstMinSize="config.secondarySideBarMinWidth"
              @closeFirst="(v) => config.secondarySideBar = v"
            >
              <template #first>
                <slot name="secondarySideBar" />
              </template>
              <template #second>
                <SplitBase
                  :size="100 - config.bottomPanelHeight"
                  :horizontal="false"
                  :showSecond="config.bottomPanel"
                  :secondMinSize="config.bottomPanelMinHeight"
                  @update:size="(v) => config.bottomPanelHeight = 100 - v"
                  @closeSecond="(v) => config.bottomPanel = v"
                >
                  <template #first>
                    <SplitBase
                      :size="100 - config.primarySideBarWidth"
                      :showFirst="config.primarySideBar"
                      :secondMinSize="config.primarySideBarMinWidth"
                      @update:size="(v) => config.primarySideBarWidth = 100 - v"
                      @closeFirst="(v) => config.primarySideBar = v"
                    >
                      <template #first>
                        <slot name="centerArea" />
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
              </template>
            </SplitBase>
          </template>
        </template>
        <template #second>
          <slot name="bottomPanel" />
        </template>
      </SplitBase>
      <!--activity bar (right)-->
      <div 
        v-if="config.activityBar && config.primarySideBarPosition === 'right' && config.activityBarPosition === 'side'" 
        :class="['code-layout-activity-bar',config.primarySideBarPosition]"
      >
        <slot name="activityBar" />
      </div>
    </div>
    <!--status bar-->
    <div v-if="config.statusBar" class="code-layout-status" :style="{ height: config.statusBarHeight }">
      <slot name="statusBar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import SplitThird from './SplitLayout/SplitThird.vue';
import SplitBase from './SplitLayout/SplitBase.vue';
import type { CodeLayoutConfig } from './CodeLayout';

export interface CodeLayoutBaseInstance {
  getRef: () => HTMLElement | undefined;
}

const container = ref<HTMLElement>();

defineProps({
  config: {
    type: Object as PropType<CodeLayoutConfig>,
    required: true,
  },
});

defineExpose({
  getRef: () => container.value,
});

</script>