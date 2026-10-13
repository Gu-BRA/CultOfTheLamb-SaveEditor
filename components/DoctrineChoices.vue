<template>
    <div>
        <p class="small text-body-secondary">
            {{ t('Enable “The One Who Waits Beaten” in Character to select both doctrines in a pair. The game unlocks this after defeating him; Forgotten Commandment Stones provide the extra choices.') }}
            {{ t('Changes are included when you download the edited save.') }}
        </p>
        <div v-if="canEditDoctrines(saveData)" class="mb-3">
            <button type="button" class="btn btn-outline-primary" @click="synchronizeExistingDoctrines(saveData)">
                {{ t('Synchronize existing doctrines') }}
            </button>
            <p class="small text-body-secondary mt-2 mb-0">{{ t('Register doctrines already enabled through traits or upgrades, and update doctrine progression. Both options in a pair are preserved.') }}</p>
        </div>
        <div class="nav nav-pills gap-2 mb-3" :aria-label="t('Doctrine categories')">
            <button v-for="category in doctrineCategories" :key="category.name" type="button" class="nav-link"
                :class="{ active: selectedCategory === category.name }" :aria-pressed="selectedCategory === category.name"
                @click="selectedCategory = category.name">
                {{ t(category.name) }}
                <span class="badge text-bg-secondary ms-1">{{ chosenCount(category) }}/{{ category.pairs.length }}</span>
            </button>
        </div>
        <div v-if="!canEditDoctrines(saveData)" class="alert alert-warning">
            {{ t('This save does not contain the required doctrine fields.') }}
        </div>
        <div v-else class="row g-3">
            <div v-for="pair in activeCategory?.pairs ?? []" :key="pair.name" class="col-12">
                <section class="card doctrine-pair">
                    <div class="card-header d-flex align-items-center justify-content-between gap-2">
                        <h3 class="h6 mb-0">{{ t(pair.name) }}</h3>
                    </div>
                    <div class="card-body">
                        <fieldset>
                            <legend class="visually-hidden">{{ t(pair.name) }}</legend>
                            <div class="row g-3">
                                <div v-for="option in [pair.left, pair.right]" :key="option.id" class="col-12 col-lg-6">
                                    <label class="doctrine-option h-100" :class="{ selected: selectedDoctrineIds(pair, saveData).includes(option.id) }"
                                        :for="`doctrine-${option.id}`">
                                        <input :id="`doctrine-${option.id}`" type="checkbox"
                                            class="form-check-input flex-shrink-0" :checked="selectedDoctrineIds(pair, saveData).includes(option.id)"
                                            :disabled="!canEnableDoctrineOption(pair, saveData, option.id)"
                                            @change="select(pair, option.id, ($event.target as HTMLInputElement).checked)">
                                        <img v-if="imageFor(option)" :src="imageFor(option)" alt="" width="52" height="52" class="doctrine-icon flex-shrink-0">
                                        <span class="flex-grow-1">
                                            <span class="fw-semibold d-block">{{ t(option.name) }}</span>
                                            <span class="small text-body-secondary">{{ t(option.description) }}</span>
                                            <span v-if="selectedDoctrineIds(pair, saveData).includes(option.id) && !doctrineIds(saveData).includes(option.id)" class="small d-block text-warning-emphasis mt-1">{{ t('Effect enabled; doctrine registration pending.') }}</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { canEditDoctrines, canEnableDoctrineOption, doctrineCategories, doctrineIds, selectedDoctrineIds, setDoctrineOption, synchronizeExistingDoctrines, type DoctrineCategory, type DoctrineOption, type DoctrinePair } from '~/utils/doctrines';
import type { JsonSaveFile } from '~/types/save';
import { publicPath } from '~/utils/public-path';

const props = defineProps<{ saveData: JsonSaveFile }>();
const { t } = useLanguage();
const selectedCategory = ref(doctrineCategories[0]!.name);
const activeCategory = computed(() => doctrineCategories.find(category => category.name === selectedCategory.value));
const chosenCount = (category: DoctrineCategory) => category.pairs.filter(pair => {
    return selectedDoctrineIds(pair, props.saveData).length > 0;
}).length;
function imageFor(option: DoctrineOption) {
    if (option.cultTraitId !== undefined) return publicPath(`/Traits/${option.cultTraitId}.png`);
    return '';
}
function select(pair: DoctrinePair, id: number, enabled: boolean) {
    if (canEditDoctrines(props.saveData)) setDoctrineOption(props.saveData, pair, id, enabled);
}
</script>

<style scoped>
.doctrine-pair { border-color: rgba(201, 37, 26, .35); }
.doctrine-option {
    min-height: 100%; display: flex; align-items: center; gap: .85rem; padding: .9rem 1rem;
    border: 1px solid var(--bs-border-color); border-radius: .65rem; cursor: pointer;
    background: var(--bs-tertiary-bg); transition: border-color .15s ease, background-color .15s ease;
}
.doctrine-option:hover { border-color: #c9251a; }
.doctrine-option.selected { border-color: #c9251a; background: color-mix(in srgb, #c9251a 9%, var(--bs-tertiary-bg)); }
.doctrine-icon { object-fit: contain; background: #ece4cf; border-radius: 8px; padding: 4px; }
.doctrine-none { min-height: 0; width: fit-content; padding-block: .55rem; }
</style>
