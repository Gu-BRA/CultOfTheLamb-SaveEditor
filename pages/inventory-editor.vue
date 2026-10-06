<template>
    <div v-if="saveStore.saveData">
        <div class="row">
            <div class="col-12 col-md-4 offset-md-8">
                <input type="text" class="form-control" v-model="search" :placeholder="t('Search')" />
            </div>
        </div>
        <label class="small my-2 form-check form-switch inline-switch">
            <input type="checkbox" role="switch" v-model="showInternal" class="form-check-input" />
            <span class="form-check-label">{{ t("Mostrar IDs internos (avançado)") }}</span>
        </label>
        <hr />
        <div v-for="itemList in filteredItems" :key="`inventory-group-${itemList.name}`">
            <h2>{{ t(itemList.name) }}</h2>
            <hr />
            <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-xl-5 g-3 mb-4">
                <div v-for="item in itemList.items" class="col" :key="`inventory-item-${item.id}`">
                    <div class="card inventory-card">
                        <div class="inventory-card__main">
                            <div class="inventory-card__icon" aria-hidden="true">
                                <NuxtImg v-if="item.image" loading="eager" class="image-inner"
                                    :alt="t('Image not available')" :src="item.image" width="64px" height="64px" fit="inside" />
                                <span v-else class="inventory-card__fallback">◇</span>
                            </div>
                            <div class="inventory-card__copy">
                                <h3 class="inventory-card__title">{{ t(item.name) }}</h3>
                                <p v-if="item.description" class="inventory-card__description">{{ t(item.description) }}</p>
                                <span v-if="item.imageIsPlaceholder" class="inventory-card__placeholder">{{ t("Ícone genérico") }}</span>
                                <span v-if="item.internal" class="inventory-card__placeholder">{{ t("ID interno do jogo") }}</span>
                            </div>
                        </div>
                        <div class="inventory-card__quantity">
                            <label class="inventory-card__quantity-label" :for="`inventory-quantity-${item.id}`">{{ t("Quantity") }}</label>
                            <div class="input-group inventory-card__input-group">
                                <span class="input-group-text" aria-hidden="true">×</span>
                                <input :id="`inventory-quantity-${item.id}`" :value="itemQuantity(item.id)" type="number" class="form-control" min="0"
                                    @input="(e) => setItemQuantity(item.id, parseInt((e.target as HTMLInputElement)?.value) ?? 0)" :max="item.max" :aria-label="`${t('Quantity')}: ${t(item.name)}`">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <p v-else> {{ t("Load a save file!") }} </p>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { getPropertyCaseInsensitive, setPropertyCaseInsensitive } from '~/utils/utility';
import { useSaveData } from '~/stores/saveData';

const { data: itemData } = useFetch<{ name: string, items: { id: number, image: string, name: string, max?: number, description?: string, internal?: boolean, imageIsPlaceholder?: boolean }[] }[]>('/data/itemData.json');

const saveStore = useSaveData();
const search = ref('');
const showInternal = ref(false);

const filteredItems = computed(() => {
    const groups = (itemData.value ?? []).map(group => ({ ...group, items: [...group.items] }));
    const known = new Set(groups.flatMap(group => group.items.map(item => item.id)));
    const unknown = (getPropertyCaseInsensitive(saveStore.saveData, "items") ?? [])
        .filter((item: any) => !known.has(item.type))
        .map((item: any) => ({ id: item.type, name: `Item ID ${item.type}`, image: '' }));
    if (unknown.length) groups.push({ name: 'Itens presentes no save sem descrição', items: unknown });
    return groups.map(group => ({ ...group, items: group.items.filter(item => (!item.internal || showInternal.value || itemQuantity(item.id) > 0) && (t(item.name) + ' ' + item.name).toLowerCase().includes(search.value.toLowerCase())) })).filter(group => group.items.length);
});

const itemQuantity = (id: number) => getPropertyCaseInsensitive(saveStore.saveData, "items")?.find((item: any) => item.type === id)?.quantity ?? 0;

const setItemQuantity = (id: number, quantity: number) => {
    if (!saveStore.saveData || !Number.isFinite(quantity) || quantity < 0) return;
    let items = getPropertyCaseInsensitive(saveStore.saveData, "items");
    if (!items) {
        items = [];
        setPropertyCaseInsensitive(saveStore.saveData, "items", items);
    }
    const item = items.find((entry: any) => entry.type === id);
    if (item) {
        item.quantity = quantity;
        item.QuantityReserved = Math.min(Math.max(item.QuantityReserved ?? 0, 0), quantity);
        item.UnreservedQuantity = quantity - item.QuantityReserved;
    } else if (quantity > 0) {
        items.push({ type: id, quantity, QuantityReserved: 0, UnreservedQuantity: quantity });
    }
}
</script>

<style scoped>
.inventory-card { height: 100%; overflow: hidden; }
.inventory-card__main { display: flex; align-items: flex-start; gap: .8rem; flex: 1; padding: .9rem; }
.inventory-card__icon { display: grid; width: 4.25rem; height: 4.25rem; flex: 0 0 4.25rem; place-items: center; border: 1px solid rgba(201, 37, 26, .18); border-radius: .75rem; background: linear-gradient(145deg, #f2e8d1, #e8dcc1); }
.inventory-card__icon img { width: 3.5rem; height: 3.5rem; object-fit: contain; }
.inventory-card__fallback { color: var(--cotl-red); font-size: 2rem; }
.inventory-card__copy { min-width: 0; }
.inventory-card__title { margin: .1rem 0 .35rem; font-size: 1rem; line-height: 1.25; overflow-wrap: anywhere; }
.inventory-card__description { display: -webkit-box; margin: 0; overflow: hidden; color: var(--cotl-muted); font-size: .82rem; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.inventory-card__placeholder { display: inline-block; margin-top: .4rem; color: var(--cotl-muted); font-size: .72rem; }
.inventory-card__quantity { padding: .65rem .85rem .8rem; border-top: 1px solid var(--cotl-line); background: rgba(233, 222, 197, .58); }
.inventory-card__quantity-label { display: block; margin-bottom: .35rem; color: var(--cotl-muted); font-size: .72rem; font-weight: 650; }
.inventory-card__input-group { max-width: 11rem; }
.inventory-card__input-group .input-group-text { min-width: 2.4rem; justify-content: center; color: var(--cotl-red); font-weight: 750; }
.inventory-card__input-group .form-control { font-variant-numeric: tabular-nums; }
@media (max-width: 575.98px) {
    .inventory-card__main { gap: .6rem; padding: .7rem; }
    .inventory-card__icon { width: 3.4rem; height: 3.4rem; flex-basis: 3.4rem; }
    .inventory-card__icon img { width: 2.8rem; height: 2.8rem; }
    .inventory-card__title { font-size: .9rem; }
    .inventory-card__description { font-size: .76rem; }
    .inventory-card__quantity { padding: .55rem .7rem .7rem; }
}
</style>
