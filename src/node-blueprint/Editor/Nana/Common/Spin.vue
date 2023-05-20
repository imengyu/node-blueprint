<template>
  <div class="nana-spin" />
</template>

<style>
:root {
  --nana-spin-color: #333;
}

.nana-spin {

  width: 30px;
  height: 30px;
  border: 2px solid var(--nana-spin-color);
  border-top-color: transparent;
  border-radius: 100%;
  animation: nana-spin-circle infinite 0.75s linear;
}

@keyframes nana-spin-circle {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>