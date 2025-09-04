

import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';
import 'vue-code-layout/lib/vue-code-layout.css';
import '@/Common/ArrayTools'
import TooltipDirective from '@/Editor/Components/Shared/Tooltip/TooltipDirective';
import type { Plugin } from 'vue';

const plugin : Plugin = {
  install(app, ...options) {
    app.use(TooltipDirective);
  },
}

export default plugin

export {
  
}