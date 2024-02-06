
let showDelayTimer = 0;
let hideDelayTimer = 0;
let showState = false;

export function useSimpleTooltipDelayLock() {

  function onEnter(cb: () => void) {
    if (hideDelayTimer > 0) {
      clearTimeout(hideDelayTimer);
      hideDelayTimer = 0;
    }
    if (showState) {
      cb();
      return;
    }
    if (showDelayTimer > 0) 
      clearTimeout(showDelayTimer);
    showDelayTimer = setTimeout(() => {
      cb();
      showState = true;
    }, 650);
  }
  function onLeave(cb: () => void) {
    cb();
    if (hideDelayTimer > 0) 
      clearTimeout(hideDelayTimer);
    hideDelayTimer = setTimeout(() => {
      showState = false;
    }, 50);
  }

  return {
    onEnter,
    onLeave,
  }
}