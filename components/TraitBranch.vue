<template>
    <div class="row g-4 my-3">
        <section v-for="branch in branches" :key="branch.key" class="col-12 col-xl-6"
            :aria-labelledby="`cult-trait-branch-${branch.key}`">
            <h3 :id="`cult-trait-branch-${branch.key}`">{{ t(branch.title) }}</h3>
            <div class="row g-3">
                <div v-for="trait in branch.traits" :key="trait.id" class="col-12">
                    <article class="card h-100" :class="{ 'border-success': isEnabled(trait.id) }">
                        <div class="card-body">
                            <div class="d-flex gap-3 align-items-start">
                                <img v-if="trait.image" :src="trait.image" :alt="t(trait.name)" width="56" height="56"
                                    class="doctrine-upgrade-icon flex-shrink-0">
                                <div class="flex-grow-1">
                                    <label :for="`cult-trait-${trait.id}`" class="fw-semibold d-block mb-2">
                                        {{ t(trait.name) }}
                                    </label>
                                    <p v-if="trait.description" class="small mb-2">{{ t(trait.description) }}</p>
                                    <span class="badge" :class="isEnabled(trait.id) ? 'text-bg-success' : 'text-bg-secondary'">
                                        {{ t(isEnabled(trait.id) ? 'Unlocked' : 'Locked') }}
                                    </span>
                                </div>
                                <div class="form-check form-switch">
                                    <input :id="`cult-trait-${trait.id}`" v-model="currentCultTraits" type="checkbox"
                                        role="switch" class="form-check-input" :value="trait.id" :aria-label="t(trait.name)">
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import type { JsonSaveFile } from '~/types/save';
import type { ComputedRef } from 'vue';

type TraitData = {
    id: number;
    image: string;
    name: string;
    description: string;
}

const { t } = useLanguage();
const props = defineProps<{
    leftBranch: TraitData[];
    rightBranch: TraitData[];
    saveData: JsonSaveFile;
}>();

const currentCultTraits = generateObjectInsensitiveComputed(() => props.saveData, 'CultTraits') as ComputedRef<number[]>;
const branches = computed(() => [
    { key: 'left', title: 'Left Branch', traits: props.leftBranch },
    { key: 'right', title: 'Right Branch', traits: props.rightBranch },
]);
const isEnabled = (id: number) => currentCultTraits.value?.includes(id) ?? false;
</script>

<style scoped>
.doctrine-upgrade-icon {
    object-fit: contain;
    background: linear-gradient(145deg, #29342f, #171b19);
    border: 1px solid rgba(201, 37, 26, .35);
    border-radius: 8px;
    padding: 4px;
    box-shadow: inset 0 -3px 0 #c9251a, 0 3px 9px rgba(23, 27, 25, .16);
}
</style>
