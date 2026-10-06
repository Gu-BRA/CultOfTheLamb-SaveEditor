<template>
    <div class="app-shell">
        <NuxtLoadingIndicator />
        <FileUploadModal ref="fileUploadModal" @data="onFileData" @test-data="loadTestData" />
        <header class="app-header">
            <div class="app-credit">
                <a href="https://github.com/Gu-BRA" target="_blank" rel="noopener noreferrer">Made by Gu-BRA</a>
            </div>
            <Navbar />
        </header>
        <form id="form" @submit.prevent>
                <p v-if="catalog" class="catalog-note mt-2 mb-3"> {{ t("Catálogo do jogo instalado:") }}  {{ catalog.gameVersion }}  {{ t(". Textos e ícones do jogo instalado. IDs internos ficam nas opções avançadas.") }} </p>
            <main class="app-main">
                <slot />
            </main>
        </form>
    </div>
    <Footer @loadNewFile="fileUploadModal?.modal?.toggle()" />
</template>

<script setup lang="ts">
const { t, language } = useLanguage();
useHead(() => ({ htmlAttrs: { lang: language.value } }));
import { type Data } from "../components/FileUploadModal.vue";
import { useSaveData } from "~/stores/saveData";
import { type Modal } from "bootstrap";

const { data: testSave } = useFetch<any>(publicPath('/data/testSave.json?v=20261006-2'));
const saveStore = useSaveData();
const { data: catalog } = useFetch<{ gameVersion: string }>(publicPath('/data/installedCatalog.json'));

const fileUploadModal = ref<HTMLDivElement & { modal: Modal | undefined }>();
onMounted(() => {
    fileUploadModal.value?.modal?.show();
});

const applyFileData = async (data: Data) => {
        await saveStore.importSave(data.data);
        const isMp = data.name.endsWith('.mp');
        const isZb = data.data.length >= 4 &&
            data.data[0] === 0x5a && data.data[1] === 0x42 &&
            data.data[2] === 0x1f && data.data[3] === 0x8b;
        saveStore.setFileData({
            name: data.name,
            encrypted: data.data[0] === 69,
            format: isMp ? 'mp' : isZb ? 'zb' : 'json',
        })
        fileUploadModal.value?.modal?.hide();
};

const onFileData = async (data: Data) => {
    try {
        await applyFileData(data);
    } catch (error) {
        alert(t('An error occurred while importing the save file.'));
        console.error('An error occurred while importing the save file.', error);
    }
}

const loadTestData = async () => {
    saveStore.setSaveData(testSave.value);
    saveStore.setFileData({
        name: 'testSave.json',
        encrypted: false,
        format: 'json',
    });
    fileUploadModal.value?.modal?.hide();
}
</script>

<style scoped>
.app-credit { display: flex; justify-content: flex-end; margin-bottom: .5rem; }
.app-credit a { color: var(--cotl-muted); font-size: .75rem; text-decoration: none; }
.app-credit a:hover { color: var(--cotl-red); text-decoration: underline; }
</style>
