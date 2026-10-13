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
        <div class="nav nav-tabs mb-3 mt-4" role="tablist" :aria-label="t('Character collections')">
            <button id="tab-recipes" type="button" class="nav-link" role="tab"
                :class="{ active: selectedCollection === 'recipes' }" :aria-selected="selectedCollection === 'recipes'"
                aria-controls="panel-recipes" @click="selectedCollection = 'recipes'">
                {{ t("Cooking Recipes") }}
            </button>
            <button id="tab-clothing" type="button" class="nav-link" role="tab"
                :class="{ active: selectedCollection === 'clothing' }" :aria-selected="selectedCollection === 'clothing'"
                aria-controls="panel-clothing" @click="selectedCollection = 'clothing'">
                {{ t("Clothing") }}
                <span class="badge text-bg-secondary ms-1">{{ unlockedClothing.length }}/{{ clothingCount }}</span>
            </button>
        </div>
        <section v-if="selectedCollection === 'recipes'" id="panel-recipes" role="tabpanel" aria-labelledby="tab-recipes">
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
        </section>
        <section v-else id="panel-clothing" role="tabpanel" aria-labelledby="tab-clothing">
            <h2>{{ t("Clothing") }}</h2>
            <p class="text-body-secondary">{{ t("Unlock clothing recipes and special outfits found in the installed game data.") }}</p>
            <section v-for="group in clothingGroups" :key="group.name" class="mb-4">
                <div class="d-flex align-items-center gap-2 mb-3">
                    <h3 class="h5 mb-0">{{ t(group.name) }}</h3>
                    <span class="badge text-bg-secondary">{{ group.items.length }}</span>
                </div>
                <div class="row g-3">
                    <div v-for="clothing in group.items" :key="clothing.id" class="col-12 col-md-6 col-xl-4">
                        <article class="card h-100" :class="{ 'border-success': unlockedClothing.includes(clothing.id) }">
                            <ClothingPreview :clothing-id="clothing.id" :name="t(clothing.name)" />
                            <div class="card-body d-flex align-items-start gap-3">
                                <div class="flex-grow-1">
                                    <h3 class="h6 mb-2">{{ t(clothing.name) }}</h3>
                                    <span class="badge" :class="unlockedClothing.includes(clothing.id) ? 'text-bg-success' : 'text-bg-secondary'">
                                        {{ t(unlockedClothing.includes(clothing.id) ? 'Unlocked' : 'Locked') }}
                                    </span>
                                </div>
                                <div class="form-check form-switch">
                                    <input :id="`clothing-${clothing.id}`" type="checkbox" role="switch" class="form-check-input"
                                        :aria-label="t(clothing.name)" :checked="unlockedClothing.includes(clothing.id)"
                                        @change="toggleClothing(clothing.id, $event)">
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </section>
        </section>
    </div>
    <p v-else> {{ t("Load a save file!") }} </p>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { generateObjectInsensitiveComputed } from "~/utils/utility";
import { useSaveData } from "~/stores/saveData";
import { useSiteData } from "~/stores/siteData";

const { data: recipeData } = useFetch<{ id: number, image: string, name: string, description: string, effect: string, ingredient: string, category: string, quality: string }[]>(publicPath('/data/cookingRecipe.json'));
const { data: clothingData } = useFetch<{ id: number, name: string, category?: string }[]>(publicPath('/data/followerClothing.json'));
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
const selectedCollection = ref<'recipes' | 'clothing'>('recipes');
const clothingCategoryNames = ['Regular clothing', 'Special outfits', 'Cultist Pack', 'Heretic Pack', 'Sinful Pack', 'Pilgrim Pack', 'Apple Arcade', 'Appearance only'];
const clothingGroups = computed(() => clothingCategoryNames
    .map(name => ({ name, items: (clothingData.value ?? []).filter(item => item.category === name) }))
    .filter(group => group.items.length));
const clothingCount = computed(() => clothingGroups.value.reduce((count, group) => count + group.items.length, 0));
const unlockedClothing = computed<number[]>({
    get() {
        const key = Object.keys(saveStore.saveData ?? {}).find(name => name.toLowerCase() === 'unlockedclothing');
        const value = key ? Reflect.get(saveStore.saveData!, key) : [];
        return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
    },
    set(value) {
        if (!saveStore.saveData) return;
        const key = Object.keys(saveStore.saveData).find(name => name.toLowerCase() === 'unlockedclothing') ?? 'UnlockedClothing';
        Reflect.set(saveStore.saveData, key, [...new Set(value)]);
    }
});
function toggleClothing(id: number, event: Event) {
    const selected = (event.target as HTMLInputElement).checked;
    unlockedClothing.value = selected
        ? [...unlockedClothing.value, id]
        : unlockedClothing.value.filter(value => value !== id);
}

const deathCatBeatenWarningModal = ref(null);
const deathCatClick = () => {
    if (siteData.deathCatWarningAcknowledged || !deathCatBeatenWarningModal.value) return;
    (deathCatBeatenWarningModal.value as any).modal?.toggle();
    siteData.deathCatWarningAcknowledged = true;
}
</script>
