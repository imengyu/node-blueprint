
let defaultModalTeplport = 'body';

let modalCurrentZIndex = 100;

export function getModalCurrentZIndex(show: boolean) {
  if (show)
    modalCurrentZIndex++; 
  else
    modalCurrentZIndex--;
  
  return modalCurrentZIndex;
}
export function getDefaultModalTeplport() {
  return defaultModalTeplport;
}
export function setDefaultModalTeplport(el: string) {
  defaultModalTeplport = el;
}