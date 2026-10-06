<template>
    <div v-if="saveStore.saveData">
        <h2> {{ t("Cult Information & Character Stats") }} </h2>
        <hr />
        <div class="row mb-2">
            <div class="col">
                <label for="CultName"> {{ t("Cult Name:") }} </label>
                <input v-model="cultName" type="text" class="form-control" id="CultName" />
                <br />
                <label for="CurrentDayIndex"> {{ t("Current Day:") }} </label>
                <input v-model="currentDayIndex" type="number" class="form-control" id="CurrentDayIndex" />
                <br />
                <h4> {{ t("Dungeon Doors Unlocked") }} </h4>
                <div class="row mb-4">
                    <div v-for="dungeon in dungeonData" class="col">
                        <div v-for="dungeonData of dungeon" class="form-check form-switch">
                            <input v-model="unlockedDungeonDoor" type="checkbox" role="switch" class="form-check-input"
                                :id="`dungeon_${dungeonData.id}`" :value="dungeonData.id">
                            <label class="form-check-label" :for="`dungeon_${dungeonData.id}`">{{ t(dungeonData.name) }}</label>
                        </div>
                    </div>
                </div>
                <button class="btn btn-danger" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample"
                    aria-expanded="false" aria-controls="collapseExample"> {{ t("Spoiler section") }} </button>
                <p />
                <div class="collapse" id="collapseExample">
                    <div class="card card-body">
                        <div class="row">
                            <div class="col">
                                <div class="form-check form-switch">
                                    <input v-model="deathCatBeaten" type="checkbox" role="switch" class="form-check-input"
                                        id="DeathCatBeaten" @click="deathCatClick">
                                    <label class="form-check-label" for="DeathCatBeaten"> {{ t("The One Who Waits Beaten") }} </label>
                                </div>
                            </div>
                            <div class="col">
                                <div class="form-check form-switch">
                                    <input v-model="ratauKilled" type="checkbox" role="switch" class="form-check-input" id="RatauKilled">
                                    <label class="form-check-label" for="RatauKilled"> {{ t("Ratau Killed") }} </label>
                                </div>
                            </div>
                        </div>
                        <DeathCatBeatenWarningModal ref="deathCatBeatenWarningModal" />
                    </div>
                </div>
            </div>
            <div class="col">
                <HeartMeter v-model="playerHealth" :label="t('Red Hearts:')" type="red"
                    :half-hearts="true"
                    full-icon="/HeartIcons/red-full-hires.png" half-icon="/HeartIcons/red-half-hires.png"
                    />
                <HeartMeter v-model="playerSpiritHealth" :label="t('Spirit Hearts:')" type="spirit"
                    :half-hearts="true"
                    full-icon="/HeartIcons/spirit-full-hires.png" half-icon="/HeartIcons/spirit-half-hires.png"
                    />
                <HeartMeter v-model="playerBlueHealth" :label="t('Blue Hearts:')" type="blue"
                    :half-hearts="true" full-icon="/HeartIcons/blue-hires.png"
                    half-icon="/HeartIcons/blue-hires.png" />
                <HeartMeter v-model="playerBlackHealth" :label="t('Diseased Hearts:')" type="diseased"
                    :half-hearts="true" full-icon="/HeartIcons/diseased-hires.png"
                    half-icon="/HeartIcons/diseased-hires.png" empty-icon="/HeartIcons/diseased-empty.svg"
                    />
                <HeartMeter v-model="playerFireHealth" :label="t('Molten Hearts:')" type="fire"
                    :half-hearts="true" full-icon="/HeartIcons/molten-hires.png"
                    half-icon="/HeartIcons/molten-hires.png" />
                <HeartMeter v-model="playerIceHealth" :label="t('Frozen Hearts:')" type="ice"
                    :half-hearts="true" full-icon="/HeartIcons/frozen-hires.png"
                    half-icon="/HeartIcons/frozen-hires.png" />
            </div>
        </div>
        <h2> {{ t("Cooking Recipes") }} </h2>
        <hr />
        <table class="table">
            <thead>
                <tr>
                    <th> {{ t("Unlocked?") }} </th>
                    <th> {{ t("Image") }} </th>
                    <th> {{ t("Name") }} </th>
                    <th> {{ t("Description") }} </th>
                    <th> {{ t("Effects") }} </th>
                    <th> {{ t("Ingredients") }} </th>
                    <th> {{ t("Category") }} </th>
                    <th> {{ t("Quality") }} </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="recipe in recipeData">
                    <td>
                        <div class="form-check form-switch recipe-unlock-switch">
                            <input v-model="recipesDiscovered" type="checkbox" role="switch" class="form-check-input"
                                :id="`recipe-${recipe.id}`" :aria-label="t(recipe.name)" :value="recipe.id">
                        </div>
                    </td>
                    <td>
                        <div class="center-container">
                            <NuxtImg loading="eager" :src="recipe.image" :alt="t('Image not available')"
                                class="image-inner smalls-ize" quality="100" width="64px" height="64px" fit="inside" />
                        </div>
                    </td>
                    <td>
                        {{ t(recipe.name) }}
                    </td>
                    <td>
                        {{ t(recipe.description) }}
                    </td>
                    <td>
                        {{ t(recipe.effect) }}
                    </td>
                    <td>
                        {{ t(recipe.ingredient) }}
                    </td>
                    <td>
                        {{ t(recipe.category) }}
                    </td>
                    <td>
                        {{ recipe.quality }}
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
import { useSiteData } from "~/stores/siteData";

const { data: recipeData } = useFetch<{ id: number, image: string, name: string, description: string, effect: string, ingredient: string, category: string, quality: string }[]>(publicPath('/data/cookingRecipe.json'));
const { data: dungeonData } = useFetch<{ id: number, name: string }[][]>(publicPath('/data/dungeonData.json'));

const saveStore = useSaveData();
const siteData = useSiteData();

const unlockedDungeonDoor = generateObjectInsensitiveComputed(() => saveStore.saveData, "UnlockedDungeonDoor");
const currentDayIndex = generateObjectInsensitiveComputed(() => saveStore.saveData, "CurrentDayIndex");
const cultName = generateObjectInsensitiveComputed(() => saveStore.saveData, "CultName");

const deathCatBeaten = generateObjectInsensitiveComputed(() => saveStore.saveData, "DeathCatBeaten");
const ratauKilled = generateObjectInsensitiveComputed(() => saveStore.saveData, "RatauKilled");

const playerHealth = generateObjectInsensitiveComputed(() => saveStore.saveData, "PLAYER_HEALTH");
const playerSpiritHealth = generateObjectInsensitiveComputed(() => saveStore.saveData, "PLAYER_SPIRIT_HEARTS");
const playerBlackHealth = generateObjectInsensitiveComputed(() => saveStore.saveData, "PLAYER_BLACK_HEARTS");
const playerBlueHealth = generateObjectInsensitiveComputed(() => saveStore.saveData, "PLAYER_BLUE_HEARTS");
const playerFireHealth = generateObjectInsensitiveComputed(() => saveStore.saveData, "PLAYER_FIRE_HEARTS");
const playerIceHealth = generateObjectInsensitiveComputed(() => saveStore.saveData, "PLAYER_ICE_HEARTS");

const recipesDiscovered = generateObjectInsensitiveComputed(() => saveStore.saveData, "RecipesDiscovered");

const deathCatBeatenWarningModal = ref(null);
const deathCatClick = () => {
    if (siteData.deathCatWarningAcknowledged || !deathCatBeatenWarningModal.value) return;
    (deathCatBeatenWarningModal.value as any).modal?.toggle();
    siteData.deathCatWarningAcknowledged = true;
}
</script>
