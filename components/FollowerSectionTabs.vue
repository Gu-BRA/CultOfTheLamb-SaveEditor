<template>
    <nav class="nav nav-tabs mb-3" :aria-label="t('Follower lists')">
        <NuxtLink v-for="tab in tabs" :key="tab.path" :to="tab.path" class="nav-link"
            :class="{ active: route.path === tab.path }" :aria-current="route.path === tab.path ? 'page' : undefined">
            {{ t(tab.label) }}
        </NuxtLink>
    </nav>
</template>

<script setup lang="ts">
const { t } = useLanguage();
const route = useRoute();
const tabs = [
    { path: '/followers', label: 'Active Followers' },
    { path: '/recruiting-followers', label: 'Recruiting Followers' },
    { path: '/dead-followers', label: 'Dead Followers' },
];
</script>
