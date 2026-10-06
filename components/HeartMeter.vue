<template>
    <section class="heart-meter" :aria-label="label">
        <div class="heart-meter__heading">
            <div>
                <h3 class="heart-meter__label">{{ label }}</h3>
                <p v-if="hint" class="heart-meter__hint">{{ hint }}</p>
            </div>
            <div class="heart-meter__actions">
                <span class="badge text-bg-secondary">{{ displayCount }}</span>
                <button type="button" class="btn btn-sm btn-outline-secondary" :aria-label="t('Clear {label}', { label })"
                    @click="emit('update:modelValue', 0)">
                    {{ t('Clear') }}
                </button>
            </div>
        </div>
        <div class="heart-meter__icons" role="group" :aria-label="t('Choose heart amount for {label}', { label })">
            <button v-for="index in 10" :key="index" type="button" class="heart-meter__slot"
                :aria-label="slotLabel(index - 1)" :aria-valuetext="slotLabel(index - 1)"
                :title="slotLabel(index - 1)" @click="setFromPointer($event, index - 1)"
                @keydown.left.prevent="adjust(-1)" @keydown.right.prevent="adjust(1)">
                <img :src="emptyIcon && !isFull(index - 1) && !isHalf(index - 1) ? emptyIcon : fullIcon" alt="" class="heart-meter__heart"
                    :class="[isFull(index - 1) ? 'is-active' : 'is-muted', `heart-meter__heart--${type}`]">
                <img v-if="halfHearts && isHalf(index - 1)" :src="halfIcon || fullIcon" alt=""
                    class="heart-meter__heart heart-meter__heart--half heart-meter__heart--active"
                    :class="[`heart-meter__heart--${type}`, { 'heart-meter__heart--clipped-half': halfIcon === fullIcon }]">
            </button>
        </div>
        <p v-if="overflow" class="heart-meter__overflow small text-warning-emphasis">
            {{ t('The save contains {count} units, more than the 10 displayed hearts.', { count: value }) }}
        </p>
    </section>
</template>

<script setup lang="ts">
type HeartType = 'red' | 'spirit' | 'diseased' | 'blue' | 'fire' | 'ice';

const props = defineProps<{
    label: string;
    modelValue: number;
    fullIcon: string;
    emptyIcon?: string;
    halfIcon?: string;
    type: HeartType;
    halfHearts?: boolean;
    hint?: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const { t } = useLanguage();

const value = computed(() => Math.max(0, Math.round(Number(props.modelValue) || 0)));
const displayCount = computed(() => props.halfHearts
    ? `${value.value} ${t('units')} · ${(value.value / 2).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${t('hearts')}`
    : `${value.value} ${value.value === 1 ? t('heart') : t('hearts')}`);
const overflow = computed(() => value.value > (props.halfHearts ? 20 : 10));

function isFull(index: number) {
    return value.value >= (index + 1) * (props.halfHearts ? 2 : 1);
}

function isHalf(index: number) {
    return props.halfHearts && value.value === index * 2 + 1;
}

function slotLabel(index: number) {
    const unitsPerHeart = props.halfHearts ? 2 : 1;
    const firstTarget = index * unitsPerHeart + 1;
    const fullTarget = (index + 1) * unitsPerHeart;
    const current = value.value >= fullTarget
        ? t('full heart')
        : isHalf(index) ? t('half heart')
        : t('empty heart');
    const instruction = props.halfHearts
        ? t('Click left for {count}; right for {countFull} units.', {
            count: `${firstTarget} ${firstTarget === 1 ? t('unit') : t('units')}`,
            countFull: fullTarget,
        })
        : t('Set heart amount to {count}.', { count: index + 1 });
    return `${props.label} ${index + 1}: ${current}. ${instruction}`;
}

function setFromPointer(event: MouseEvent, index: number) {
    if (!props.halfHearts) {
        const next = index + 1;
        emit('update:modelValue', next === value.value ? next - 1 : next);
        return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const half = event.detail === 0 || event.clientX - rect.left < rect.width / 2;
    const next = index * 2 + (half ? 1 : 2);
    emit('update:modelValue', next === value.value ? next - 1 : next);
}

function adjust(amount: number) {
    emit('update:modelValue', Math.min(props.halfHearts ? 20 : 10, Math.max(0, value.value + amount)));
}
</script>

<style scoped>
.heart-meter {
    min-width: 0;
    padding: .9rem 1rem;
    margin-bottom: 1rem;
    border: 1px solid var(--cotl-line);
    border-radius: .8rem;
    background: #fff9e9;
    box-shadow: 0 6px 18px rgba(59, 44, 21, .08);
}

.heart-meter__heading,
.heart-meter__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .65rem;
}

.heart-meter__label { margin: 0; font-size: 1rem; font-weight: 700; }
.heart-meter__hint { margin: .2rem 0 0; color: var(--cotl-muted); font-size: .76rem; }
.heart-meter__icons { display: flex; flex-wrap: wrap; gap: .12rem; margin-top: .6rem; }
.heart-meter__slot {
    position: relative;
    display: block;
    width: 1.8rem;
    height: 2rem;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: .35rem;
    background: transparent;
    cursor: pointer;
}
.heart-meter__slot:focus-visible { outline: 2px solid var(--cotl-red); outline-offset: 1px; }
.heart-meter__heart {
    position: absolute;
    inset: .08rem;
    width: calc(100% - .16rem);
    height: calc(100% - .16rem);
    object-fit: contain;
    pointer-events: none;
    transition: filter .12s ease, transform .12s ease;
}
.heart-meter__heart.is-muted { filter: grayscale(1) brightness(.58); opacity: .82; }
.heart-meter__heart.is-active,
.heart-meter__heart--active { filter: none; opacity: 1; }
.heart-meter__heart--clipped-half { clip-path: inset(0 50% 0 0); }
.heart-meter__slot:hover .heart-meter__heart { transform: scale(1.08); }
.heart-meter__overflow { margin: .4rem 0 0; }

@media (max-width: 500px) {
    .heart-meter { padding: .75rem; }
    .heart-meter__slot { width: 1.7rem; height: 1.9rem; }
    .heart-meter__hint { max-width: 16rem; }
}
</style>
