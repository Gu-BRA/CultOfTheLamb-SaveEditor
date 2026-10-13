<template>
    <div class="clothing-preview-art">
        <canvas ref="canvas" width="128" height="128" role="img" :aria-label="t('Clothing preview: {name}', { name })" />
        <small v-if="error" class="text-danger">{{ t('Preview unavailable') }}</small>
    </div>
</template>

<script setup lang="ts">
import { publicPath } from '~/utils/public-path';

const { t } = useLanguage();
const props = defineProps<{ clothingId: number; name: string }>();
const { data: previews } = useFetch(publicPath('/data/followerPreviews.json'));
const canvas = ref<HTMLCanvasElement>();
const error = ref(false);
let revision = 0;

async function draw() {
    const current = ++revision;
    if (!canvas.value || !previews.value) return;
    error.value = false;
    const follower = { Name: '', SkinName: '', Clothing: props.clothingId, ClothingVariant: '', Outfit: 4 };
    try {
        const { renderAppearance } = await import('~/utils/follower-appearance');
        await renderAppearance(canvas.value, follower, previews.value as any, 'clothing', () => current === revision);
    } catch {
        if (current === revision) error.value = true;
    }
}

watch([() => props.clothingId, previews], draw, { flush: 'post' });
onMounted(draw);
onBeforeUnmount(() => { ++revision; });
</script>

<style scoped>
.clothing-preview-art { display: grid; min-height: 144px; place-items: center; padding: .5rem; background: rgba(23, 27, 25, .04); }
.clothing-preview-art canvas { width: 128px; height: 128px; }
.clothing-preview-art small { font-size: .7rem; }
</style>
