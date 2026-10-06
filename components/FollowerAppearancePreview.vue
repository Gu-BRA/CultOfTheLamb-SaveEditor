<template>
    <div class="text-center">
        <canvas ref="canvas" width="256" height="256" :style="{ width: `${size}px`, height: `${size}px` }"
            :class="{ 'd-none': error }" role="img" :aria-label="t('Appearance of {name}', { name: follower.Name })" />
        <FollowerPreview v-if="error" :follower="follower" :size="size" />
        <small v-if="loading" class="d-block text-muted"> {{ t("Carregando aparência…") }} </small>
        <small v-if="error || notice" class="d-block text-muted">{{ t(error || notice) }}</small>
    </div>
</template>
<script setup lang="ts">
const { t } = useLanguage();
import { getPropertyCaseInsensitive } from '~/utils/utility';
import type { FollowerPreviews } from '~/types/follower-preview';
const props = withDefaults(defineProps<{ follower: any; kind: 'outfit' | 'clothing'; size?: number }>(), { size: 160 });
const { data: previews } = useFetch<FollowerPreviews>(publicPath('/data/followerPreviews.json'));
const store = useSaveData();
const appearance = computed(() => {
    const variants = getPropertyCaseInsensitive(store.saveData, 'ClothingVariants', []) as any[];
    const assigned = Array.isArray(variants) ? variants.find(v => v.ClothingType === props.follower.Clothing) : undefined;
    return { ...props.follower, ClothingVariant: props.follower.ClothingVariant || assigned?.Variant || '',
        previewClothingColour: assigned?.Colour ?? 0 };
});
const canvas = ref<HTMLCanvasElement>();
const loading = ref(false), error = ref(''), notice = ref('');
let revision = 0;
async function draw() {
    const current = ++revision;
    if (!canvas.value || !previews.value) return;
    loading.value = true; error.value = ''; notice.value = '';
    const follower = { ...appearance.value };
    try {
        const { renderAppearance } = await import('~/utils/follower-appearance');
        const message = await renderAppearance(canvas.value, follower, previews.value, props.kind, () => current === revision);
        if (current === revision) notice.value = message;
    } catch (e) {
        if (current === revision) error.value = e instanceof Error ? e.message : 'Prévia indisponível.';
    } finally { if (current === revision) loading.value = false; }
}
watch([appearance, previews], draw, { flush: 'post' });
onMounted(draw); onBeforeUnmount(() => { ++revision; });
</script>
