<template>
    <section>
        <h1 class="h3">{{ t('Building Unlocks') }}</h1>
        <p class="text-body-secondary">{{ t('Choose which buildings, decorations and floors are available in your cult.') }}</p>
        <div v-if="!store.saveData" class="alert alert-info">{{ t('Load a compatible save to edit buildings.') }}</div>
        <template v-else>
            <div class="nav nav-pills gap-2 mb-3" :aria-label="t('Building categories')">
                <button v-for="category in categories" :key="category.key" type="button" class="nav-link"
                    :class="{ active: selected === category.key }" :aria-pressed="selected === category.key"
                    @click="selected = category.key">
                    {{ t(category.name) }} <span class="badge text-bg-secondary ms-1">{{ count(category.key) }}</span>
                </button>
            </div>
            <div class="row g-3 align-items-end mb-3">
                <div class="col-md-8">
                    <label for="building-search" class="form-label">{{ t('Search buildings') }}</label>
                    <input id="building-search" v-model="search" class="form-control" type="search"
                        :placeholder="t('Search by name or description')">
                </div>
                <div class="col-md-4">
                    <label for="building-status" class="form-label">{{ t('Status') }}</label>
                    <select id="building-status" v-model="status" class="form-select">
                        <option value="all">{{ t('All') }}</option>
                        <option value="unlocked">{{ t('Unlocked') }}</option>
                        <option value="locked">{{ t('Locked') }}</option>
                    </select>
                </div>
            </div>
            <p class="small text-body-secondary">
                {{ t('Unlocking makes buildings available for construction. It does not place or remove buildings on the map.') }}
                {{ t('Divine Inspiration prerequisites are applied automatically, and both tabs stay in sync.') }}
                {{ t('Changes are applied when you save to the game.') }}
            </p>
            <p class="small">{{ t('{enabled} unlocked of {total}', { enabled: unlockedCount, total: buildings.length }) }}</p>
            <div v-if="!visible.length" class="alert alert-info">{{ t('No buildings found.') }}</div>
            <div class="row g-3">
                <div v-for="building in visible" :key="building.id" class="col-12 col-md-6 col-xl-4">
                    <div class="card h-100" :class="{ 'border-success': isEnabled(building) }">
                        <div class="card-body d-flex gap-3 align-items-start">
                            <img v-if="building.image" :src="building.image" alt="" class="building-icon flex-shrink-0" width="64" height="64" loading="lazy">
                            <div class="flex-grow-1">
                                <label :for="`building-${building.id}`" class="fw-semibold d-block mb-2">{{ t(building.name) }}</label>
                                <p v-if="building.description" class="small mb-2">{{ t(building.description) }}</p>
                                <p v-if="building.imageSource === 'illustrative'" class="small text-body-secondary mb-2">
                                    {{ t('Illustrative icon — original artwork unavailable in this game version.') }}
                                </p>
                                <span class="badge" :class="isEnabled(building) ? 'text-bg-success' : 'text-bg-secondary'">
                                    {{ t(isEnabled(building) ? 'Unlocked' : 'Locked') }}
                                </span>
                                <p v-if="building.unlock.kind === 'builtin'" class="small text-body-secondary mt-2 mb-0">{{ t('Available by default') }}</p>
                                <p v-else-if="!canEditBuilding(store.saveData, building)" class="small text-body-secondary mt-2 mb-0">{{ t('This save does not contain the required unlock field.') }}</p>
                            </div>
                            <div class="form-check form-switch">
                                <input :id="`building-${building.id}`" type="checkbox" role="switch" class="form-check-input"
                                    :aria-label="t(building.name)" :checked="isEnabled(building)"
                                    :disabled="!canEditBuilding(store.saveData, building)" @change="toggle(building, $event)">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </section>
</template>
<script setup lang="ts">
import { buildings, buildingEnabled, canEditBuilding, setBuilding, type Building } from '~/utils/buildings';
const { t } = useLanguage();
const store = useSaveData();
const selected = ref('buildings');
const search = ref('');
const status = ref('all');
const categories = [{ key: 'buildings', name: 'Buildings' },
    { key: 'decorations', name: 'Decorations' }, { key: 'floors', name: 'Floors' }];
const count = (category: string) => buildings.filter(row => row.category === category).length;
const isEnabled = (row: Building) => buildingEnabled(store.saveData, row);
const unlockedCount = computed(() => buildings.filter(isEnabled).length);
const visible = computed(() => buildings.filter(row => {
    if (row.category !== selected.value) return false;
    if (status.value === 'unlocked' && !isEnabled(row)) return false;
    if (status.value === 'locked' && isEnabled(row)) return false;
    return `${t(row.name)} ${t(row.description)}`.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase());
}));
function toggle(building: Building, event: Event) {
    if (canEditBuilding(store.saveData, building)) setBuilding(store.saveData, building, (event.target as HTMLInputElement).checked);
}
</script>
<style scoped>
.building-icon { object-fit: contain; background: #ece4cf; padding: 4px; border-radius: 8px; }
</style>
