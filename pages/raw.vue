<template>
    <div v-if="saveStore.saveData">
        <JsonEditorVue v-model="saveStore.saveData" class="jse-theme-dark cotl-json-editor" :on-render-menu="menuTranslator" :on-render-context-menu="menuTranslator" />
    </div>
    <p v-else> {{ t("Load a save file!") }} </p>
</template>

<script setup lang="ts">
const { t, language } = useLanguage();
import { localizeMenu } from '~/utils/localize-menu';
import { translateText } from '~/utils/translate';
const menuTranslator = computed(() => {
    const locale = language.value;
    return (items: any) => localizeMenu(items, text => translateText(text, locale));
});
import JsonEditorVue from 'json-editor-vue'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import { useSaveData } from "~/stores/saveData";

const saveStore = useSaveData();
</script>

<style>
.jse-theme-dark.cotl-json-editor {
    --jse-theme-color: var(--cotl-red);
    --jse-theme-color-highlight: #a81e16;
    --jse-background-color: var(--cotl-ink);
    --jse-text-color: var(--cotl-paper);
    --jse-menu-color: #fff4dd;
    --jse-key-color: #e9dec5;
    --jse-value-color-number: #b5c7a0;
    --jse-value-color-boolean: #ef9b83;
    --jse-value-color-null: #ef9b83;
    --jse-value-color-string: #d9b587;
    --jse-value-color-url: #d9b587;
    --jse-a-color: #ef9b83;
    --jse-a-color-highlight: #ffc3ac;
    --jse-panel-background: var(--cotl-ink-soft);
    --jse-modal-background: var(--cotl-ink-soft);
    --jse-modal-code-background: var(--cotl-ink);
    --jse-selection-background-color: #54332c;
    --jse-selection-background-inactive-color: #39382d;
    --jse-hover-background-color: #343b32;
    --jse-edit-outline: 2px solid #ef9b83;
}
</style>
