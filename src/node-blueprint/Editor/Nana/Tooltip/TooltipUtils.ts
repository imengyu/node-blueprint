export function getContainer() {
  let container = document.querySelector('.nana-tooltip-container') as HTMLDivElement;
  if (!container) {
    container = document.createElement('div');
    container.classList.add('nana-tooltip-container');
    document.body.appendChild(container);
  }
  return container;
}