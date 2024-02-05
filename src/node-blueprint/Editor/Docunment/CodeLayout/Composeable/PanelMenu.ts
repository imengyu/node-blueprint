import ContextMenu, { type MenuItem } from "@imengyu/vue3-context-menu";
import type { CodeLayoutConfig, CodeLayoutContext, CodeLayoutPanelInternal } from "../CodeLayout";
import { useCodeLayoutLang } from "../Language";
import { inject, type Ref } from "vue";

export function usePanelMenuControl() {

  const { t } = useCodeLayoutLang();
  const context = inject('codeLayoutContext') as CodeLayoutContext;
  const layoutConfig = inject('codeLayoutConfig') as Ref<CodeLayoutConfig>;

  function onContextMenu(panel: CodeLayoutPanelInternal, e: MouseEvent) {
    e.preventDefault();

    const parent = panel.getParent();
    if (!parent)
      return;
    const parentArray = parent.children;
    if (!parentArray)
      return;

    let showCount = 0;
    for (const iterator of parentArray)
      showCount += iterator.visible ? 1 : 0;

    ContextMenu.showContextMenu({
      x: e.x,
      y: e.y,
      theme: 'code-layout',
      items: [
        { 
          label: `${t(panel.visible ? 'hide' : 'show')} '${panel.name}'`, 
          disabled: panel.noHide || showCount <= 1,
          onClick: () => {
            panel.visible = !panel.visible;
            context.relayoutAfterToggleVisible(panel);
          }
        },
        { 
          label: `${t(panel.showBadge ? 'hide' : 'show')} ${t('badge')}`,
          hidden: !panel.parentGroup?.getIsTopGroup(),
          divided: 'down',
          onClick: () => {
            panel.showBadge = !panel.showBadge;
          }
        },
        ...parentArray.map(othersPanel => {
          return {
            label: othersPanel.name,
            checked: othersPanel.visible,
            disabled: othersPanel.noHide || (showCount <= 1 && othersPanel.visible),
            onClick() {
              othersPanel.visible = !othersPanel.visible;
              context.relayoutAfterToggleVisible(othersPanel);
            },
          } as MenuItem
        }),
        ...(panel.parentGrid === 'primarySideBar' ? [
          { 
            label: t('activityBarPosition'),
            divided: 'up',
            children: [
              { 
                label: t('side'),
                checked: layoutConfig.value.activityBarPosition === 'side',
                onClick() { layoutConfig.value.activityBarPosition = 'side';}
              },
              { 
                label: t('top'),
                checked: layoutConfig.value.activityBarPosition === 'top',
                onClick() { layoutConfig.value.activityBarPosition = 'top';}
              },
              { 
                label: t('hidden'),
                checked: layoutConfig.value.activityBarPosition === 'hidden',
                onClick() { layoutConfig.value.activityBarPosition = 'hidden';}
              },
            ]
          },
          { 
            label: layoutConfig.value.primarySideBarPosition === 'left' ? 
              t('movePrimarySideBarRight') : t('movePrimarySideBarLeft'),
            onClick() {
              layoutConfig.value.primarySideBarPosition =
                (layoutConfig.value.primarySideBarPosition === 'left') ? 'right' : 'left';
            }
          },
          { 
            label:`${t('hide')} ${t('primarySideBar')}`,
            onClick() {
              context.relayoutTopGridProp('primarySideBar', false);
            }
          },
        ] as MenuItem[] : []),
        ...(panel.parentGrid === 'secondarySideBar' ? [
          { 
            label: layoutConfig.value.primarySideBarPosition === 'left' ? 
              t('moveSecondarySideBarLeft') : t('moveSecondarySideBarRight'),
            onClick() {
              layoutConfig.value.primarySideBarPosition =
                (layoutConfig.value.primarySideBarPosition === 'left') ? 'right' : 'left';
            }
          },
          { 
            label:`${t('hide')} ${t('secondarySideBar')}`,
            onClick() {
              context.relayoutTopGridProp('secondarySideBar', false);
            }
          },
        ] as MenuItem[] : []),
        ...(panel.parentGrid === 'bottomPanel' ? [ 
          { 
            label: t('alignPanel'),
            divided: 'up',
            children: [
              { 
                label: t('center'),
                checked: layoutConfig.value.bottomAlignment === 'center',
                onClick() { layoutConfig.value.bottomAlignment = 'center';}
              },
              { 
                label: t('justify'),
                checked: layoutConfig.value.bottomAlignment === 'justify',
                onClick() { layoutConfig.value.bottomAlignment = 'justify';}
              },
              { 
                label: t('left'),
                checked: layoutConfig.value.bottomAlignment === 'left',
                onClick() { layoutConfig.value.bottomAlignment = 'left';}
              },
              { 
                label: t('right'),
                checked: layoutConfig.value.bottomAlignment === 'right',
                onClick() { layoutConfig.value.bottomAlignment = 'right';}
              },
            ]
          },
          { 
            label:`${t('hide')} ${t('panel')}`,
            onClick() {
              context.relayoutTopGridProp('bottomPanel', false);
            }
          },
        ] as MenuItem[] : [])
      ]
    });
  }

  return {
    onContextMenu,
  }
}