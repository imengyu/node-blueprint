

import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';
import '@imengyu/vue-scroll-rect/lib/vue-scroll-rect.css'
import 'vue-code-layout/lib/vue-code-layout.css';
import '@/Common/ArrayTools'
import TooltipDirective from '@/Editor/Components/Shared/Tooltip/TooltipDirective';
import ScrollRect from '@imengyu/vue-scroll-rect';
import type { Plugin } from 'vue';
import { initLib } from './Nodes';
import { initBase } from './Core';

const plugin : Plugin = {
  install(app, ...options) {
    app.use(TooltipDirective);
    app.use(ScrollRect);
    initBase();
    initLib();
  },
}

export default plugin

export {
  
}