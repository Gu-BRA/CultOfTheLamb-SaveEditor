<template>
    <div class="follower-preview text-center">
        <canvas v-if="canColour && !failed" ref="canvas" width="128" height="128"
            :style="{ width: `${size}px`, height: `${size}px` }" role="img" :aria-label="description" />
        <img v-else-if="source && !failed" :src="publicPath(source)" :alt="t(description)" :width="size" :height="size"
            class="follower-preview-image" @error="failed = true" />
        <div v-else class="text-muted small p-2" :style="{ minHeight: `${size}px` }"> {{ t("Prévia ainda não disponível") }} <br />{{ skinName }}
        </div>
        <small v-if="kind === 'skin' && source && !canColour" class="d-block text-muted"> {{ t("Cor não catalogada — forma base") }} </small>
    </div>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { getPropertyCaseInsensitive } from '~/utils/utility';
import type { FollowerPreviews } from '~/types/follower-preview';

const props = withDefaults(defineProps<{ follower: any; kind?: 'skin' | 'outfit'; size?: number }>(), {
    kind: 'skin', size: 128,
});
const { data: previews } = useFetch<FollowerPreviews>(publicPath('/data/followerPreviews.json'));
const failed = ref(false);
const canvas = ref<HTMLCanvasElement>();
const skinName = computed(() => String(getPropertyCaseInsensitive(props.follower, 'SkinName', '')));
const colour = computed(() => Number(getPropertyCaseInsensitive(props.follower, 'SkinColour', 0)));
const character = computed(() => {
    const groups = previews.value?.characters;
    const id = Number(getPropertyCaseInsensitive(props.follower, 'SkinCharacter'));
    return groups?.find(c => c.id === id && c.skins.includes(skinName.value))
        ?? groups?.find(c => c.skins.includes(skinName.value));
});
const palette = computed(() => character.value?.colors[colour.value]);
const layers = computed(() => previews.value?.layeredSkins?.[skinName.value]);
const canColour = computed(() => props.kind === 'skin' && !!palette.value && !!layers.value?.length);
const source = computed(() => {
    if (!previews.value) return undefined;
    if (props.kind === 'skin') return previews.value.skins[skinName.value];
    const outfit = getPropertyCaseInsensitive(props.follower, 'Outfit');
    if (outfit === 4) return previews.value.clothing[getPropertyCaseInsensitive(props.follower, 'Clothing')];
    return previews.value.outfits[outfit];
});
const description = computed(() => props.kind === 'skin'
    ? t('Form {name}, colour {id}', { name: t(skinName.value), id: colour.value }) : t('Clothing preview, base colour'));
let revision = 0;
const images = new Map<string, Promise<HTMLImageElement>>();
function loadImage(url: string) {
    if (!images.has(url)) images.set(url, new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => { images.delete(url); reject(new Error('Image unavailable')); };
        image.src = url;
    }));
    return images.get(url)!;
}
async function draw() {
    const current = ++revision;
    failed.value = false;
    await nextTick();
    if (!canColour.value || !canvas.value || !layers.value || !palette.value) return;
    const selectedLayers = layers.value;
    const selectedPalette = palette.value;
    const target = canvas.value;
    try {
        const loaded = await Promise.all(selectedLayers.map(layer => loadImage(layer.image)));
        if (current !== revision) return;
        const context = target.getContext('2d');
        if (!context) return;
        context.clearRect(0, 0, 128, 128);
        const buffer = document.createElement('canvas'); buffer.width = 128; buffer.height = 128;
        const scratch = buffer.getContext('2d', { willReadFrequently: true });
        if (!scratch) return;
        selectedLayers.forEach((layer, index) => {
            scratch.clearRect(0, 0, 128, 128);
            scratch.drawImage(loaded[index], 0, 0);
            const tint = selectedPalette[layer.slot];
            if (tint) {
                const pixels = scratch.getImageData(0, 0, 128, 128);
                for (let p = 0; p < pixels.data.length; p += 4)
                    for (let c = 0; c < 4; c++) pixels.data[p + c] *= tint[c];
                scratch.putImageData(pixels, 0, 0);
            }
            context.drawImage(buffer, 0, 0);
        });
    } catch {
        if (current === revision) failed.value = true;
    }
}
watch([source, colour, palette, layers], draw, { flush: 'post' });
onMounted(draw);
onBeforeUnmount(() => { ++revision; });
</script>

<style scoped>
.follower-preview-image { object-fit: contain; background: transparent; }
</style>
