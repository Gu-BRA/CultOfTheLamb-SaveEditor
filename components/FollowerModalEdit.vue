<template>
    <div ref="followerModalElement" class="modal fade show" tabindex="-1" aria-modal="true" role="dialog">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header modal-header--sticky">
                    <h5 class="modal-title">{{ getPropertyCaseInsensitive(props.followerData, "Name") }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('Close')"></button>
                </div>
                <div class="modal-body">
                    <section v-if="props.showGreonPreset" class="border rounded p-3 mb-3 bg-light" :aria-label="t('Padrão de status do Greon')">
                        <h6> {{ t("Make Super Follower") }} </h6>
                        <p class="small mb-2"> {{ t("Nível") }}  {{ greonPreset.values.XPLevel }}  {{ t("· idade") }}  {{ greonPreset.values.Age }}  {{ t("· vida") }}  {{ greonPreset.values.HP }}/{{ greonPreset.values.MaxHP }}  {{ t("· fé") }}  {{ greonPreset.values.Faith }}  {{ t("· felicidade") }}  {{ greonPreset.values.Happiness }} · {{ greonPreset.values.Traits.length }}  {{ t("traços.") }} </p>
                        <p class="small mb-2">{{ t("Colar") }}: {{ t("Golden Skull Necklace") }}</p>
                        <button type="button" class="btn btn-outline-primary" @click="applyGreonPreset"> {{ t("Apply") }} </button>
                        <p v-if="presetApplied" class="small text-success mt-2 mb-0" role="status"> {{ t("Padrão aplicado ao formulário. Clique em Salvar alterações e depois em Baixar save editado.") }} </p>
                        <details class="small mt-2">
                            <summary> {{ t("Ver todos os valores do padrão") }} </summary>
                            <dl class="row mt-2 mb-0">
                                <template v-for="(value, field) in greonPreset.values" :key="field">
                                    <dt class="col-6">{{ t(greonPreset.labels[field]) }}</dt>
                                    <dd class="col-6">{{ t(Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value) }}</dd>
                                </template>
                            </dl>
                        </details>
                    </section>
                    <div class="row row-cols-1 row-cols-md-2 g-3">
                        <div class="col">
                            <label :for="makeFormId('ID')" class="form-label"> {{ t("Follower ID:") }} </label>
                            <input v-model.number="formData.ID" type="number" class="form-control"
                                :id="makeFormId('ID')">
                            <span class="text-danger fw-bold" style="font-size:14px;"> {{ t("Changing IDs is dangerous and can corrupt your save file, back up your save first.") }} </span>
                        </div>
                        <div class="col">
                            <label :for="makeFormId('Name')" class="form-label"> {{ t("Follower Name:") }} </label>
                            <input v-model.number="formData.Name" type="text" class="form-control"
                                :id="makeFormId('Name')">
                        </div>
                        <div class="col">
                            <label :for="makeFormId('XPLevel')" class="form-label"> {{ t("Follower Level:") }} </label>
                            <input v-model.number="formData.XPLevel" type="number" class="form-control" min="0"
                                :id="makeFormId('XPLevel')">
                        </div>
                        <div class="col">
                            <label :for="makeFormId('DayJoined')" class="form-label"> {{ t("Day Joined:") }} </label>
                            <input v-model.number="formData.DayJoined" type="number" class="form-control" min="0"
                                :id="makeFormId('DayJoined')">
                        </div>
                        <div class="col">
                            <label :for="makeFormId('Age')" class="form-label"> {{ t("Follower Age:") }} </label>
                            <input v-model.number="formData.Age" type="number" class="form-control" min="0"
                                :id="makeFormId('Age')">

                        </div>
                        <div class="col">
                            <label :for="makeFormId('MemberDuration')" class="form-label"> {{ t("Days in your Cult:") }} </label>
                            <input v-model.number="formData.MemberDuration" type="number" class="form-control" min="0"
                                :id="makeFormId('MemberDuration')">
                        </div>
                        <div class="col">
                            <label :for="makeFormId('LifeExpectancy')" class="form-label"> {{ t("Follower Life Expectancy:") }} </label>
                            <input v-model.number="formData.LifeExpectancy" type="number" class="form-control" min="0"
                                :id="makeFormId('LifeExpectancy')">
                        </div>
                        <div class="col">
                            <label :for="makeFormId('SacrificialValue')" class="form-label"> {{ t("Sacrificial Value:") }} </label>
                            <input v-model.number="formData.SacrificialValue" type="number" class="form-control" min="0"
                                :id="makeFormId('SacrificialValue')">
                        </div>

                    </div>
                    <hr>
                    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3 mb-3">
                        <div class="col">
                            <label :for="makeFormId('Outfit')"> {{ t("Follower Outfit:") }} </label>
                            <select v-model.number="formData.Outfit" class="form-select" :id="makeFormId('Outfit')">
                                <option v-if="!outfitList?.some(entry => entry.id === formData.Outfit)" :value="formData.Outfit"> {{ t("Outfit ID") }}  {{ formData.Outfit }}</option>
                                <option v-for="outfit of outfitList" :value="outfit.id"
                                    :key="`Outfit-${formData.ID}-${outfit.id}`">{{ t(outfit.name) }}</option>
                            </select>
                        </div>
                        <div v-if="followerSkinList" class="col">
                            <label :for="makeFormId('SkinCharacter')"> {{ t("Follower Skin:") }} </label>
                            <select v-model.number="formData.SkinCharacter" class="form-select"
                                :id="makeFormId('SkinCharacter')" :disabled="isRestrictedSkin">
                                <option v-if="!followerSkinList[formData.SkinCharacter]" :value="formData.SkinCharacter">{{ formData.SkinName }}  {{ t("(ID") }}  {{ formData.SkinCharacter }})</option>
                                <option v-for="(followerSkin, index) of followerSkinList" :value="index"
                                    :key="`SkinCharacter-${formData.ID}-${index}`">{{ t(followerSkin.name) }}</option>
                            </select>
                        </div>
                        <div v-if="followerSkinList" class="col">
                            <label :for="makeFormId('SkinVariation')"> {{ t("Follower Variant:") }} </label>
                            <select v-model.number="formData.SkinVariation" class="form-select"
                                :id="makeFormId('SkinVariation')" :disabled="isRestrictedSkin">
                                <option v-if="!followerSkinList[formData.SkinCharacter]?.variant?.[formData.SkinVariation]" :value="formData.SkinVariation">{{ formData.SkinName }}  {{ t("(atual)") }} </option>
                                <option v-for="(name, index) of followerSkinList[formData.SkinCharacter]?.variant ?? []"
                                    :value="index" :key="`SkinVariation-${formData.ID}-${index}`">{{
                                        formData.SkinCharacter === props.followerData.SkinCharacter && index === props.followerData.SkinVariation ? t(props.followerData.SkinName) : t(name) || `Variant ID ${index}`
                                    }}</option>
                            </select>
                        </div>
                        <div v-if="colourGroup" class="col">
                            <label :for="makeFormId('SkinColour')"> {{ t("Cor do seguidor:") }} </label>
                            <select v-model.number="formData.SkinColour" class="form-select" :id="makeFormId('SkinColour')"
                                :disabled="!!colourGroup.lockColor">
                                <option v-if="!colourGroup.colors[formData.SkinColour]" :value="formData.SkinColour"> {{ t("Cor") }}  {{ formData.SkinColour }}  {{ t("(atual, não catalogada)") }} </option>
                                <option v-for="(_, index) of colourGroup.colors" :key="index" :value="index"> {{ t("Cor") }}  {{ index }}</option>
                            </select>
                        </div>
                        <div class="col">
                            <label :for="makeFormId('Necklace')"> {{ t("Follower Necklace:") }} </label>
                            <select v-model.number="formData.Necklace" class="form-select" :id="makeFormId('Necklace')">
                                <option v-if="!necklaceList?.some(entry => entry.id === formData.Necklace)" :value="formData.Necklace"> {{ t("Necklace ID") }}  {{ formData.Necklace }}</option>
                                <option v-for="necklace of necklaceList" :value="necklace.id"
                                    :key="`Necklace-${formData.ID}-${necklace.id}`">{{ t(necklace.name) }}</option>
                            </select>
                        </div>
                        <div v-if="formData.Clothing !== undefined" class="col">
                            <label :for="makeFormId('Clothing')"> {{ t("Follower Clothing:") }} </label>
                            <select v-model.number="formData.Clothing" @change="changeClothing" class="form-select" :id="makeFormId('Clothing')">
                                <option v-if="!availableClothing.some(c => c.id === formData.Clothing)" :value="formData.Clothing" disabled>{{ t(clothingList?.find(c => c.id === formData.Clothing)?.name ?? `Clothing ID ${formData.Clothing}`) }}  {{ t("(legado, sem prévia)") }} </option>
                                <option v-for="clothing in availableClothing" :key="clothing.id" :value="clothing.id">{{ t(clothing.name) }}</option>
                            </select>
                        </div>
                    </div>
                    <div v-if="clothingAppearance?.[formData.Clothing ?? 0]?.variants.length" class="row mt-2">
                        <div class="col">
                            <label :for="makeFormId('ClothingVariant')"> {{ t("Variante da roupa:") }} </label>
                            <select v-model="formData.ClothingVariant" class="form-select" :id="makeFormId('ClothingVariant')">
                                <option value=""> {{ t("Padrão do jogo") }} </option>
                                <option v-if="formData.ClothingVariant && !clothingAppearance[formData.Clothing ?? 0].variants.includes(formData.ClothingVariant)" :value="formData.ClothingVariant">{{ formData.ClothingVariant }}  {{ t("(atual)") }} </option>
                                <option v-for="(variant, index) in clothingAppearance[formData.Clothing ?? 0].variants" :key="variant" :value="variant"> {{ t("Variante") }}  {{ index + 1 }} — {{ variant.replace('Clothes/', '') }}</option>
                            </select>
                        </div>
                    </div>
                    <p v-if="skinNotice" class="text-warning">{{ t(skinNotice) }}</p>
                    <br />
                    <div class="row">
                        <label> {{ t("Follower Attribute:") }} </label>
                        <div class="col">
                            <div class="form-check form-switch">
                                <input v-model="formData.IsStarving" type="checkbox" role="switch" class="form-check-input"
                                    id="stravingIndicator">
                                <label class="form-check-label" for="stravingIndicator"> {{ t("Starving Indicator") }} </label>
                            </div>
                            <div class="form-check form-switch">
                                <input v-model="formData.MarriedToLeader" type="checkbox" role="switch" class="form-check-input"
                                    id="marriedToLeader">
                                <label class="form-check-label" for="marriedToLeader"> {{ t("Married to Leader") }} </label>
                            </div>
                        </div>
                        <div class="col">
                            <div class="form-check form-switch">
                                <input v-model="formData.TaxEnforcer" type="checkbox" role="switch" class="form-check-input"
                                    id="taxEnforcer">
                                <label class="form-check-label" for="taxEnforcer"> {{ t("Tax Enforcer") }} </label>
                            </div>
                            <div class="form-check form-switch">
                                <input v-model="formData.FaithEnforcer" type="checkbox" role="switch" class="form-check-input"
                                    id="faithEnforcer">
                                <label class="form-check-label" for="faithEnforcer"> {{ t("Faith Enforcer") }} </label>
                            </div>
                        </div>
                    </div>
                    <div class="row row-cols-1 row-cols-sm-2">
                        <div class="col text-center">
                            <p class="mb-0"> {{ t("Skin Preview") }} </p>
                            <div class="d-grid align-items-center justify-content-center py-3">
                                <FollowerPreview :follower="formData" />
                            </div>
                        </div>
                        <div class="col text-center">
                            <p class="mb-0"> {{ t("Outfit Preview") }} </p>
                            <div class="d-grid align-items-center justify-content-center py-3">
                                <FollowerAppearancePreview :follower="formData" kind="outfit" />
                            </div>
                        </div>
                    </div>
                    <hr />
                    <div class="row row-cols-1 row-cols-md-2 g-3 mb-3">
                        <div class="col"> {{ t("You selected") }} <span class="text-success"><span class="fw-bold">{{ totalPositiveTraits
                                    }}</span> {{ t("positive trait(s)") }} </span> {{ t(", and") }} <span class="text-danger"><span
                                    class="fw-bold">{{ totalNegativeTraits }}</span> {{ t("negative trait(s)") }} </span>.
                        </div>
                        <div class="col">
                            <input type="text" :placeholder="t('Search...')" class="form-control" v-model="serachTrait">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <div class="alert alert-warning" role="alert">
                                <p> {{ t("A trait with a") }} <span class="fw-bold"> {{ t("warning") }} </span> {{ t("background is restricted, please use it with caution.") }} </p>
                                <div class="form-check form-switch">
                                    <input id="show-restricted-traits" type="checkbox" role="switch"
                                        v-model="showRestrictedTraits" class="form-check-input">
                                    <label class="form-check-label" for="show-restricted-traits"> {{ t("Show restricted traits") }} </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <table class="table table-striped">
                                <thead class="thead-dark">
                                    <tr>
                                        <th class="col"> {{ t("Unlocked?") }} </th>
                                        <th class="col"> {{ t("Image") }} </th>
                                        <th class="col"> {{ t("Effect") }} </th>
                                        <th class="col"> {{ t("Name") }} </th>
                                        <th class="col"> {{ t("Description") }} </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="['idle', 'pending', 'error'].includes(followerTraitLoading)">
                                        <td colspan="5" class="text-center">
                                            <div v-if="followerTraitLoading === 'error'"> {{ t("There was an error loading the follower traits") }} </div>
                                            <div v-else class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden"> {{ t("Loading...") }} </span>
                                            </div>
                                        </td>
                                    </tr>
                                    <template v-else v-for="trait in followerTraitListFiltered"
                                        :key="`Trait-${props.followerData.ID}-${trait.id}`">
                                        <tr :class="{ 'table-warning': trait.cultTrait || trait.restricted }"
                                            v-if="showRestrictedTraits || formData.Traits.includes(trait.id) || !(trait.restricted || trait.cultTrait)">
                                            <td class="col-1 text-center align-middle">
                                                <label class="form-check form-switch table-switch">
                                                <input v-model="formData.Traits" type="checkbox" role="switch"
                                                    class="form-check-input" :id="makeFormId(`TraitToggle-${trait.id}`)" :value="trait.id"
                                                    :disabled="currentCultTraits?.includes(trait.id)"
                                                    :aria-labelledby="makeFormId(`Trait-${trait.id}`)">
                                                </label>
                                            </td>
                                            <td class="col-1">
                                                <div class="center-container">
                                                    <NuxtImg v-if="trait.image" loading="eager" :src="trait.image"
                                                        class="image-inner small-size img-trait"
                                                        :class="{ 'trait-icon-original': !!trait.imageSource, 'trait-icon-positive': trait.effect === 'Positive', 'trait-icon-negative': trait.effect === 'Negative' }"
                                                        :alt="t(trait.name)" width="64" height="64" quality="100"
                                                        fit="inside" :title="t(trait.imageIsPlaceholder ? 'Ícone genérico: arte não identificada' : trait.name)" />
                                                </div>
                                            </td>
                                            <td class="col-1">
                                                <span
                                                    :class="{ 'text-success': trait.effect === 'Positive', 'text-danger': trait.effect === 'Negative', 'fw-bold': true }">
                                                    {{ t(trait.effect === 'Positive' ? 'Positivo' : trait.effect === 'Negative' ? 'Negativo' : (trait.textSource ? 'Especial' : 'Não catalogado')) }}
                                                </span>
                                            </td>
                                            <td class="col">
                                                <span :id="makeFormId(`Trait-${trait.id}`)">{{ t(trait.name) }}</span>

                                            </td>
                                            <td class="col">
                                                <p>{{ t(trait.description) }}</p>
                                                <small v-if="trait.imageIsPlaceholder" class="d-block text-muted mb-2"> {{ t("Ícone genérico: arte original não identificada.") }} </small>
                                                <p v-if="currentCultTraits?.includes(trait.id)"
                                                    class="text-danger fw-bold"> {{ t("This trait is currently disabled as it conflicts with a cult trait") }} </p>
                                                <p v-else-if="trait.cultTrait" class="fw-bold"> {{ t("This should be disable if thecult trait is enabled") }} </p>
                                                <p v-if="trait.restrictedReason" class="text-danger fw-bold">
                                                    {{ t(trait.restrictedReason) }}
                                                </p>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col">
                            <label> {{ t("Adoration (XP to next level):") }} </label>
                            <input v-model.number="formData.Adoration" type="range" class="form-range" min="0" max="100"
                                step="1">
                            <p>{{ formData.Adoration }}</p>
                            <label> {{ t("Faith:") }} </label>
                            <input v-model.number="formData.Faith" type="range" class="form-range" min="0" max="100"
                                step="1">
                            <p>{{ formData.Faith }}</p>
                            <label> {{ t("Happiness:") }} </label>
                            <input v-model.number="formData.Happiness" type="range" class="form-range" min="0" max="100"
                                step="1">
                            <p>{{ formData.Happiness }}</p>
                            <label> {{ t("Illness:") }} </label>
                            <input v-model.number="formData.Illness" type="range" class="form-range" min="0" max="100"
                                step="1" />
                            <p>{{ formData.Illness }}</p>
                            <label> {{ t("Reeducation:") }} </label>
                            <input v-model.number="formData.Reeducation" type="range" class="form-range" min="0"
                                max="100" step="1" />
                            <p>{{ formData.Reeducation }}</p>
                        </div>
                        <div class="col">
                            <label> {{ t("Exhaustion:") }} </label>
                            <input v-model.number="formData.Exhaustion" type="range" class="form-range" min="0"
                                max="100" step="1" />
                            <p>{{ formData.Exhaustion }}</p>
                            <label> {{ t("Rest:") }} </label>
                            <input v-model.number="formData.Rest" type="range" class="form-range" min="0" max="100"
                                step="1" />
                            <p>{{ formData.Rest }}</p>
                            <label> {{ t("Starvation:") }} </label>
                            <input v-model.number="formData.Starvation" type="range" class="form-range" min="0" max="75"
                                step="1" />
                            <p>{{ formData.Starvation }}</p>
                            <label> {{ t("Satiation:") }} </label>
                            <input v-model.number="formData.Satiation" type="range" class="form-range" min="0" max="100"
                                step="1" />
                            <p>{{ formData.Satiation }}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer modal-footer--sticky">
                    <button type="button" class="btn btn-success" v-show="isChanged" @click="save"> {{ t("Save changes") }} </button>
                    <button type="button" class="btn btn-warning" v-show="isChanged" @click="reset"> {{ t("Reset") }} </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"> {{ t("Close") }} </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { getPropertyCaseInsensitive } from '~/utils/utility';
import type { ClothingAppearance } from '~/utils/follower-appearance';
import type { FollowerPreviews } from '~/types/follower-preview';
import { Modal } from "bootstrap";
import type { Follower } from '~/types/save';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import greonPreset from '~/public/data/followerGreonPreset.json';
import { applyFollowerStatusPreset } from '~/utils/follower-preset';

const showModal = defineModel<boolean>();
const followerModalElement = ref<HTMLElement>();
const followerModal = ref<Modal>();
const serachTrait = ref("");
const showRestrictedTraits = ref(false);
const restrictedSkinName = ref([
    "Boss Death Cat",
    "Boss Baal",
    "Boss Aym",
    /CultLeader/i,
    "Leshy",
    "Heket",
    "Kallamar",
    "Shamura",
]);

const dataStore = useSaveData();

type FollowerTrait = {
    id: number;
    image: string;
    effect: "Positive" | "Negative" | "Neutral";
    name: string;
    description: string;
    restricted?: boolean;
    internal?: boolean;
    textSource?: string;
    imageSource?: string;
    imageIsPlaceholder?: boolean;
    restrictedReason?: string;
}

const { data: followerTraitList, status: followerTraitLoading } = useFetch<FollowerTrait[]>(publicPath("/data/followerTrait.json"));
const { data: followerSkinList } = useFetch<{ name: string; variant: string[]; }[]>(publicPath("/data/followerSkin.json"));
const { data: followerPreviews } = useFetch<FollowerPreviews>(publicPath('/data/followerPreviews.json'));
const colourGroup = computed(() => followerPreviews.value?.characters?.find(c => c.id === formData.value.SkinCharacter && c.skins.includes(formData.value.SkinName))
    ?? followerPreviews.value?.characters?.find(c => c.skins.includes(formData.value.SkinName)));
const { data: traitData } = useFetch<Array<{ name: string, leftBranch: Array<{ id: number }>, rightBranch: Array<{ id: number }> }>>(publicPath("/data/traitData.json"));
const { data: necklaceList } = useFetch<{ id: number, name: string }[]>(publicPath("/data/necklaces.json"));
const { data: outfitList } = useFetch<{ id: number, name: string }[]>(publicPath("/data/followerOutfit.json"));
const { data: clothingList } = useFetch<{ id: number, name: string }[]>(publicPath("/data/followerClothing.json"));
const { data: clothingAppearance } = useFetch<ClothingAppearance>(publicPath('/data/followerClothingAppearance.json?v=2'));
// Old enum members and Count have no wearable definition in the installed game.
// Preserve an existing value, but only offer clothing with verified native art for new selections.
const availableClothing = computed(() => (clothingList.value ?? []).filter(c => clothingAppearance.value?.[c.id]?.variants.length));
function changeClothing() { formData.value.ClothingVariant = ''; }
const skinNotice = ref('');
const presetApplied = ref(false);

const props = defineProps<{ followerData: Follower, isDead?: boolean, showGreonPreset?: boolean }>();
// copy from props
const formData = ref({
    ID: props.followerData.ID,
    XPLevel: props.followerData.XPLevel,
    Age: props.followerData.Age,
    LifeExpectancy: props.followerData.LifeExpectancy,
    Name: props.followerData.Name,
    DayJoined: props.followerData.DayJoined,
    MemberDuration: props.followerData.MemberDuration,
    SacrificialValue: props.followerData.SacrificialValue,
    Outfit: props.followerData.Outfit,
    Clothing: props.followerData.Clothing,
    ClothingVariant: props.followerData.ClothingVariant,
    SkinCharacter: props.followerData.SkinCharacter,
    SkinVariation: props.followerData.SkinVariation,
    SkinColour: props.followerData.SkinColour,
    SkinName: props.followerData.SkinName,
    Necklace: props.followerData.Necklace,
    IsStarving: props.followerData.IsStarving,
    MarriedToLeader: props.followerData.MarriedToLeader,
    TaxEnforcer: props.followerData.TaxEnforcer,
    FaithEnforcer: props.followerData.FaithEnforcer,
    Traits: Array.from(props.followerData.Traits),
    Adoration: props.followerData.Adoration,
    Faith: props.followerData.Faith,
    Happiness: props.followerData.Happiness,
    Illness: props.followerData.Illness,
    Reeducation: props.followerData.Reeducation,
    Exhaustion: props.followerData.Exhaustion,
    Rest: props.followerData.Rest,
    Starvation: props.followerData.Starvation,
    Satiation: props.followerData.Satiation,
});

const isRestrictedSkin = computed(() => {
    return restrictedSkinName.value.some(name => {
        if (typeof name === "string") {
            return formData.value.SkinName.includes(name);
        }

        return name.test(formData.value.SkinName);
    });
});

const allCultTraits = computed(() => {
    const traits = new Set<number>();

    traitData.value?.forEach(trait => {
        trait.leftBranch?.forEach(trait => traits.add(trait.id));
        trait.rightBranch?.forEach(trait => traits.add(trait.id));
    });

    return Array.from(traits);
});

const currentCultTraits = computed(() => {
    return getPropertyCaseInsensitive(dataStore.saveData, "CultTraits");
});

const allFollowerTraits = computed(() => {
    const traits: Array<FollowerTrait & { cultTrait?: boolean }> = (followerTraitList.value ?? []).map(trait => ({ ...trait }));
    for (const id of formData.value.Traits) {
        if (!traits.some(trait => trait.id === id)) {
            traits.push({ id, name: `Trait ID ${id}`, image: '', effect: 'Neutral', description: 'Traço presente no save; ainda não identificado no catálogo.' });
        }
    }


    traits.forEach(trait => {
        trait.cultTrait = allCultTraits.value.includes(trait.id);
    });

    return traits.sort((a, b) => {
        // sort by effect, positive first
        const effectSort = { Positive: 0, Negative: 1, Neutral: 2 };

        if (effectSort[a.effect] != effectSort[b.effect]) {
            return effectSort[a.effect] - effectSort[b.effect];
        }

        // sort by name
        return a.name.localeCompare(b.name);
    });
});

const followerTraitListFiltered = computed(() => {
    const filtered = allFollowerTraits.value.filter(trait => {
        if (t(trait.name).toLowerCase().includes(serachTrait.value.toLowerCase())) {
            return true;
        }

        return t(trait.description).toLowerCase().includes(serachTrait.value.toLowerCase());
    });

    return filtered;
});

const makeFormId = (name: string) => `follower-modal-edit-${name}-${props.followerData.ID}`;

const totalPositiveTraits = computed(() => {
    return formData.value.Traits.filter(traitID => followerTraitList.value?.find(trait => trait.id === traitID)?.effect === "Positive").length;
});

const totalNegativeTraits = computed(() => {
    return formData.value.Traits.filter(traitID => followerTraitList.value?.find(trait => trait.id === traitID)?.effect === "Negative").length;
});

const applyGreonPreset = () => {
    applyFollowerStatusPreset(formData.value, greonPreset.values);
    formData.value.Necklace = greonPreset.appearance.Necklace;
    presetApplied.value = true;
};

const reset = () => {
    presetApplied.value = false;
    for (const key of Object.keys(formData.value) as Array<keyof typeof formData.value>) {
        Reflect.set(formData.value, key, cloneDeep(props.followerData[key]));
    }
};

const isChanged = computed(() => {
    for (const [key, value] of Object.entries(formData.value)) {
        if (!isEqual(value, getPropertyCaseInsensitive(props.followerData, key))) {
            return true;
        }
    }

    return false;
});

onMounted(() => {
    if (!followerModalElement.value) return;

    followerModal.value = new Modal(followerModalElement.value, {
        keyboard: false
    });

    followerModalElement.value.addEventListener("show.bs.modal", () => showModal.value = true);
    followerModalElement.value.addEventListener("hide.bs.modal", () => showModal.value = false);
});

const updateSkin = () => {
    if (!followerSkinList.value) {
        return;
    }

    if (formData.value.SkinName.includes('Boss')) {
        return;
    }

    skinNotice.value = '';
    if (formData.value.SkinCharacter === props.followerData.SkinCharacter && formData.value.SkinVariation === props.followerData.SkinVariation) {
        formData.value.SkinName = props.followerData.SkinName;
        return;
    }
    const skinName = followerSkinList.value[formData.value.SkinCharacter]?.variant[formData.value.SkinVariation];

    if (!skinName || /^Unknown Skin/.test(skinName)) {
        skinNotice.value = 'Esta combinação de aparência e variante ainda não foi identificada. A aparência original foi preservada.';
        formData.value.SkinCharacter = props.followerData.SkinCharacter;
        formData.value.SkinVariation = props.followerData.SkinVariation;
        formData.value.SkinName = props.followerData.SkinName;
        formData.value.SkinColour = props.followerData.SkinColour;
        return;
    }

    formData.value.SkinName = skinName;
}

type RefData<T> = T extends Ref<infer U> ? U : T;
export type FollowerEditEvent = RefData<typeof formData>;

const saveEvent = defineEmits<{ save: [FollowerEditEvent, number] }>();


const save = () => {
    saveEvent("save", cloneDeep(formData.value), props.followerData.ID);
    showModal.value = false;
}

watch(() => formData.value?.SkinCharacter, updateSkin);
watch(() => formData.value?.SkinVariation, updateSkin);
watch(() => props.followerData, () => reset());
watch(showModal, (newValue) => {
    if (newValue) {
        followerModal.value?.show();
    } else {
        followerModal.value?.hide();
    }
});


defineExpose({
    modal: followerModal
});

</script>

<style scoped>
.trait-icon-original {
    filter: brightness(0);
}

.trait-icon-original.trait-icon-positive {
    filter: brightness(0) saturate(100%) invert(40%) sepia(57%) saturate(647%) hue-rotate(103deg) brightness(92%) contrast(87%);
}

.trait-icon-original.trait-icon-negative {
    filter: brightness(0) saturate(100%) invert(30%) sepia(88%) saturate(1565%) hue-rotate(331deg) brightness(93%) contrast(91%);
}
</style>
