<template>
    <div v-if="saveStore.saveData">
        <h2> {{ t("Cartas de tarô") }} </h2>
        <label class="small form-check form-switch inline-switch">
            <input type="checkbox" role="switch" v-model="showInternal" class="form-check-input" />
            <span class="form-check-label">{{ t("Mostrar IDs internos (armas, maldições e marcadores)") }}</span>
        </label>
        <hr>
        <table class="table">
            <thead>
                <tr>
                    <th class="col"> {{ t("Unlocked?") }} </th>
                    <th class="col"> {{ t("Image") }} </th>
                    <th class="col"> {{ t("Name") }} </th>
                    <th class="col"> {{ t("Effect") }} </th>
                    <th class="col"> {{ t("Effect +") }} </th>
                    <th class="col"> {{ t("Effect ++") }} </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="tarotCard in visibleCards" :key="tarotCard.id">
                    <td class="col">
                        <div class="form-check form-switch table-switch">
                            <input v-model="playerFoundTrinkets" type="checkbox" role="switch" class="form-check-input"
                                :id="`tarot-${tarotCard.id}`" :aria-label="t(tarotCard.name)" :value="tarotCard.id">
                        </div>
                    </td>
                    <td class="col">
                        <NuxtImg v-if="tarotCard.image" loading="eager" :src="tarotCard.image" :alt="t('Picture not available')"
                            class="tarot-card-size image-inner" quality="100" fit="inside" />
                        <small v-if="tarotCard.imageIsBack" class="d-block text-muted"> {{ t("Verso da carta — arte frontal não identificada") }} </small>
                    </td>
                    <td class="col">
                        <label class="form-check-label">{{ t(tarotCard.name) }}</label>
                    </td>
                    <td class="col">
                        <label class="form-check-label">{{ t(tarotCard.effect) }}</label>
                    </td>
                    <td class="col">
                        <label class="form-check-label">{{ t(tarotCard.effect_1) }}</label>
                    </td>
                    <td class="col">
                        <label class="form-check-label">{{ t(tarotCard.effect_2) }}</label>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <p v-else> {{ t("Load a save file!") }} </p>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { generateObjectInsensitiveComputed } from "~/utils/utility";
import { useSaveData } from "~/stores/saveData";

const { data: tarotCardList } = useFetch<{ id: number, image: string, name: string, effect: string, effect_1: string, effect_2: string, internal?: boolean, imageIsBack?: boolean }[]>(publicPath("/data/tarotCard.json"));

const saveStore = useSaveData();
const showInternal = ref(false);
const visibleCards = computed(() => tarotCardList.value?.filter(card => !card.internal || showInternal.value || playerFoundTrinkets.value?.includes(card.id)));

const playerFoundTrinkets = generateObjectInsensitiveComputed(() => saveStore.saveData, "PlayerFoundTrinkets");
</script>
