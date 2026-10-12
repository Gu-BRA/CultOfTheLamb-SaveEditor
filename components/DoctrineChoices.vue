<template>
    <div>
        <p class="small text-body-secondary">
            {{ t('Choose at most one doctrine from each pair. Selecting one removes the opposing choice and synchronizes the related upgrades and cult traits.') }}
            {{ t('Changes are included when you download the edited save.') }}
        </p>
        <div v-if="canEditDoctrines(saveData)" class="mb-3">
            <button type="button" class="btn btn-outline-primary" @click="synchronizeExistingDoctrines(saveData)">
                {{ t('Synchronize existing doctrines') }}
            </button>
            <p class="small text-body-secondary mt-2 mb-0">{{ t('Register choices previously enabled as traits or upgrades, and update doctrine progression. Conflicting pairs are kept for you to resolve.') }}</p>
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
                        <span v-if="selectedDoctrine(pair, saveData) === 'conflict'" class="badge text-bg-warning">
                            {{ t('Both choices are present in this save. Select one to resolve the pair.') }}
                        </span>
                    </div>
                    <div class="card-body">
                        <fieldset>
                            <legend class="visually-hidden">{{ t(pair.name) }}</legend>
                            <div class="row g-3">
                                <div v-for="option in [pair.left, pair.right]" :key="option.id" class="col-12 col-lg-6">
                                    <label class="doctrine-option h-100" :class="{ selected: selectedDoctrine(pair, saveData) === option.id }"
                                        :for="`doctrine-${option.id}`">
                                        <input :id="`doctrine-${option.id}`" type="radio" :name="`doctrine-pair-${pair.name}`"
                                            class="form-check-input flex-shrink-0" :checked="selectedDoctrine(pair, saveData) === option.id"
                                            @change="select(pair, option.id)">
                                        <img v-if="imageFor(option)" :src="imageFor(option)" alt="" width="52" height="52" class="doctrine-icon flex-shrink-0">
                                        <span class="flex-grow-1">
                                            <span class="fw-semibold d-block">{{ t(option.name) }}</span>
                                            <span class="small text-body-secondary">{{ t(option.description) }}</span>
                                            <span v-if="selectedDoctrine(pair, saveData) === option.id && !doctrineIds(saveData).includes(option.id)" class="small d-block text-warning-emphasis mt-1">{{ t('Effect enabled; doctrine registration pending.') }}</span>
                                        </span>
                                    </label>
                                </div>
                                <div class="col-12">
                                    <label class="doctrine-option doctrine-none" :for="`doctrine-none-${pair.left.id}`">
                                        <input :id="`doctrine-none-${pair.left.id}`" type="radio" :name="`doctrine-pair-${pair.name}`"
                                            class="form-check-input flex-shrink-0" :checked="selectedDoctrine(pair, saveData) === null"
                                            @change="select(pair, null)">
                                        <span>{{ t('No choice selected') }}</span>
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
import { canEditDoctrines, doctrineCategories, doctrineIds, selectedDoctrine, setDoctrine, synchronizeExistingDoctrines, type DoctrineCategory, type DoctrineOption } from '~/utils/doctrines';
import { publicPath } from '~/utils/public-path';
import type { JsonSaveFile } from '~/types/save';

const props = defineProps<{ saveData: JsonSaveFile }>();
const { t } = useLanguage();
const selectedCategory = ref(doctrineCategories[0]!.name);
const activeCategory = computed(() => doctrineCategories.find(category => category.name === selectedCategory.value));
const chosenCount = (category: DoctrineCategory) => category.pairs.filter(pair => {
    const selected = selectedDoctrine(pair, props.saveData);
    return selected !== null && selected !== 'conflict';
}).length;
function imageFor(option: DoctrineOption) {
    if (option.cultTraitId !== undefined) return publicPath(`/Traits/${option.cultTraitId}.png`);
    return '';
}
function select(pair: DoctrinePair, id: number | null) {
    if (canEditDoctrines(props.saveData)) setDoctrine(props.saveData, pair, id);
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
