<style lang="scss" src="~/assets/scss/global.scss" />

<template>
  <div>
    <NuxtLayout>
      <NuxtPage :page-key="route => route.path" />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import "source-map-support/register";
import { Tooltip } from 'bootstrap';

onMounted(() => {
  new Tooltip(document.body, {
    selector: "[data-bs-toggle='tooltip']",
  })
});

</script>
