<template>
    <section>
        <h1 class="h3">{{ t('Upgrades') }}</h1>
        <p class="text-body-secondary">{{ t('Enable improvements from the Divine Inspiration and Sermons trees.') }}</p>
        <div class="nav nav-tabs mb-3" role="tablist" :aria-label="t('Upgrades')">
            <button v-for="tree in upgradeTrees" :id="`tab-${tree.key}`" :key="tree.key" type="button"
                class="nav-link" :class="{ active: selected === tree.key }" role="tab"
                :aria-selected="selected === tree.key" :aria-controls="`panel-${tree.key}`"
                @click="selected = tree.key">
                {{ t(tree.name) }}
                <span class="badge text-bg-secondary ms-1">{{ countEnabled(tree) }}/{{ tree.upgrades.length }}</span>
            </button>
            <button id="tab-doctrines" type="button" class="nav-link"
                :class="{ active: selected === 'doctrines' }" role="tab"
                :aria-selected="selected === 'doctrines'" aria-controls="panel-doctrines"
                @click="selected = 'doctrines'">
                {{ t('Cult Traits') }}
            </button>
        </div>
        <div v-if="!editable" class="alert alert-info">{{ t('Load a compatible save to edit upgrades.') }}</div>
        <section v-else-if="selected === 'doctrines'" id="panel-doctrines" role="tabpanel"
            aria-labelledby="tab-doctrines">
            <h2 class="h4">{{ t('Cult Traits') }}</h2>
            <div class="nav nav-tabs mb-3" role="tablist" :aria-label="t('Cult Traits')">
                <button v-for="(doctrine, index) in traitData" :id="`tab-doctrine-${index}`" :key="doctrine.name"
                    type="button" class="nav-link" :class="{ active: selectedDoctrineTab === index }" role="tab"
                    :aria-selected="selectedDoctrineTab === index" :aria-controls="`panel-doctrine-${index}`"
                    @click="selectedDoctrineTab = index">
                    {{ t(doctrine.name) }}
                </button>
            </div>
            <div v-if="activeDoctrine" :id="`panel-doctrine-${selectedDoctrineTab}`" role="tabpanel"
                :aria-labelledby="`tab-doctrine-${selectedDoctrineTab}`">
                <TraitBranch :left-branch="activeDoctrine.leftBranch" :right-branch="activeDoctrine.rightBranch"
                    :save-data="store.saveData" />
            </div>
        </section>
        <div v-else :id="`panel-${activeTree.key}`" role="tabpanel" :aria-labelledby="`tab-${activeTree.key}`">
            <p class="small text-body-secondary">
                {{ t('Enabling an upgrade also enables its prerequisites. Disabling it removes dependent upgrades in the same tree.') }}
                {{ t('Buildings are unlocked for construction; existing buildings are kept.') }}
            </p>
            <label for="upgrade-search" class="form-label">{{ t('Search upgrades') }}</label>
            <input id="upgrade-search" v-model="search" type="search" class="form-control mb-3"
                :placeholder="t('Search by name or description')">
            <p class="small">{{ t('Changes are applied when you save to the game.') }}</p>
            <div v-if="!visible.length" class="text-body-secondary">{{ t('No upgrades found.') }}</div>
            <div v-for="tier in tiers" :key="tier" class="mb-4">
                <h2 class="h5">{{ t('Tier {tier}', { tier: tier + 1 }) }}</h2>
                <div class="row g-3">
                    <div v-for="upgrade in visible.filter(row => row.tier === tier)" :key="upgrade.id"
                        class="col-12 col-lg-6">
                        <div class="card h-100" :class="{ 'border-success': enabledIds.has(upgrade.id) }">
                            <div class="card-body">
                                <div class="d-flex gap-3 align-items-start">
                                    <img v-if="upgrade.image" :src="upgrade.image" alt="" width="56" height="56"
                                        class="upgrade-icon flex-shrink-0">
                                    <div class="flex-grow-1">
                                        <label :for="`upgrade-${upgrade.id}`" class="fw-semibold d-block mb-2">{{ t(upgrade.name) }}</label>
                                        <p v-if="upgrade.description" class="small mb-2">{{ t(upgrade.description) }}</p>
                                        <span class="badge" :class="enabledIds.has(upgrade.id) ? 'text-bg-success' : 'text-bg-secondary'">
                                            {{ t(enabledIds.has(upgrade.id) ? 'Unlocked' : 'Locked') }}
                                        </span>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input :id="`upgrade-${upgrade.id}`" class="form-check-input" type="checkbox"
                                            role="switch" :aria-label="t(upgrade.name)" :checked="enabledIds.has(upgrade.id)"
                                            @change="toggle(upgrade, $event)">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { canEditUpgrades, setUpgrade, unlockedUpgrades, upgradeTrees, type Upgrade, type UpgradeTree } from '~/utils/upgrades';
const { t } = useLanguage();
const store = useSaveData();
const { data: traitData } = useFetch<{ name: string, leftBranch: { id: number, image: string, name: string, description: string }[], rightBranch: { id: number, image: string, name: string, description: string }[] }[]>('/data/traitData.json');
const selected = ref('divine');
const selectedDoctrineTab = ref(0);
const search = ref('');
const editable = computed(() => canEditUpgrades(store.saveData));
const activeTree = computed(() => upgradeTrees.find(tree => tree.key === selected.value)!);
const activeDoctrine = computed(() => traitData.value?.[selectedDoctrineTab.value]);
const enabledIds = computed(() => new Set(unlockedUpgrades(store.saveData)));
const countEnabled = (tree: UpgradeTree) => tree.upgrades.filter(row => enabledIds.value.has(row.id)).length;
const visible = computed(() => {
    const query = search.value.trim().toLocaleLowerCase();
    return activeTree.value.upgrades.filter(row => `${t(row.name)} ${t(row.description)}`.toLocaleLowerCase().includes(query));
});
const tiers = computed(() => [...new Set(visible.value.map(row => row.tier))].sort((a, b) => a - b));
function toggle(upgrade: Upgrade, event: Event) {
    if (canEditUpgrades(store.saveData)) {
        setUpgrade(store.saveData, activeTree.value, upgrade.id, (event.target as HTMLInputElement).checked);
    }
}
</script>

<style scoped>
.upgrade-icon { object-fit: contain; background: #ece4cf; border-radius: 8px; padding: 4px; }
</style>
