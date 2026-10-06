<template>
    <div class="editor-navigation">
        <div class="editor-brand">
            <img class="editor-brand__mark" src="/cult-of-the-lamb-game-icon.png" alt="" aria-hidden="true">
            <div>
                <div class="editor-brand__title">{{ t('Cult of the Lamb') }}</div>
                <div class="editor-brand__subtitle">{{ t('A save editor for your cult') }}</div>
            </div>
        </div>
        <nav class="editor-nav" :aria-label="t('Main navigation')">
            <NuxtLink v-for="item in routeList" :key="item.path" :to="item.path" class="editor-nav__link"
                :class="{ 'is-active': isActive(item.path) }" :aria-current="isActive(item.path) ? 'page' : undefined">
                <span class="editor-nav__icon" aria-hidden="true">{{ item.icon }}</span>
                <span>{{ t(item.text) }}</span>
            </NuxtLink>
        </nav>
        <div class="editor-language">
            <label for="editor-language" class="small">{{ t('Language') }}</label>
            <select id="editor-language" v-model="language" class="form-select form-select-sm" :aria-label="t('Language')">
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
            </select>
        </div>
    </div>
</template>

<script setup lang="ts">
const { language, t } = useLanguage();
const route = useRoute();

const isActive = (path: string) => route.path === path;

const routeList = [
    { path: '/', text: 'Character', icon: '✦' },
    { path: '/inventory-editor', text: 'Inventory Editor', icon: '◇' },
    { path: '/tarot-cards', text: 'Tarot Cards', icon: '☷' },
    { path: '/followers', text: 'Followers', icon: '☻' },
    { path: '/recruiting-followers', text: 'Recruiting Followers', icon: '＋' },
    { path: '/dead-followers', text: 'Dead Followers', icon: '†' },
    { path: '/upgrades', text: 'Upgrades', icon: '✧' },
    { path: '/building-unlocks', text: 'Building Unlocks', icon: '⌂' },
    { path: '/raw', text: 'Raw', icon: '{ }' },
];
</script>

<style scoped>
.editor-navigation { display: grid; grid-template-columns: minmax(190px, auto) minmax(0, 1fr) 180px; align-items: center; gap: 1rem; }
.editor-brand { display:flex; align-items:center; gap:.75rem; min-width:0; }
.editor-brand__mark { display:block; width:3.25rem; height:3.25rem; flex:0 0 auto; object-fit:contain; border-radius:.55rem; filter:drop-shadow(0 2px 1px rgba(0,0,0,.2)); }
.editor-brand__title { color:#171b19; font-weight:800; font-size:.99rem; line-height:1.2; }
.editor-brand__subtitle { margin-top:.18rem; color:#6d685d; font-size:.75rem; }
.editor-nav { display:flex; flex-wrap:wrap; gap:.35rem; min-width:0; }
.editor-nav__link { display:inline-flex; align-items:center; gap:.4rem; padding:.48rem .62rem; color:#383a34; text-decoration:none; border:1px solid transparent; border-radius:.5rem; font-size:.86rem; font-weight:620; white-space:nowrap; transition:background .15s ease,color .15s ease,border-color .15s ease; }
.editor-nav__link:hover { color:#171b19; background:rgba(23,27,25,.06); border-color:rgba(23,27,25,.12); }
.editor-nav__link.is-active { color:#8e1c15; background:rgba(201,37,26,.1); border-color:rgba(201,37,26,.27); box-shadow:inset 0 -2px 0 #c9251a; }
.editor-nav__icon { display:inline-grid; min-width:1rem; place-items:center; color:#ed684d; font-size:1rem; line-height:1; }
.editor-language { min-width:0; }
.editor-language label { display:block; margin:0 0 .25rem .1rem; color:#6d685d; }
@media (max-width: 1100px) { .editor-navigation { grid-template-columns:1fr 180px; } .editor-brand { grid-column:1 / -1; } }
@media (max-width: 600px) { .editor-navigation { grid-template-columns:1fr; gap:.65rem; } .editor-brand { grid-column:auto; } .editor-nav { flex-wrap:nowrap; overflow-x:auto; padding-bottom:.3rem; scrollbar-width:thin; } .editor-nav__link { font-size:.8rem; } .editor-language { max-width:180px; } }
</style>
