<template>
    <footer class="app-footer">
        <div class="app-footer__actions">
            <button class="btn btn-success" type="button" :disabled="!saveStore.saveData || !saveStore.fileData"
                @click="downloadEditedSave">{{ t('Download Edited Save') }}</button>
            <button type="button" class="btn btn-primary" @click="loadNewFile">{{ t('Load A New File') }}</button>
        </div>
        <div class="app-footer__status">
            <span>{{ t('Keep a backup of the original save before replacing it.') }}</span>
            <span v-if="message" role="status" class="d-block" :class="failed ? 'text-danger' : 'text-success'">{{ t(message) }}</span>
        </div>
    </footer>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { useSaveData } from '~/stores/saveData';

const saveStore = useSaveData();
const message = ref('');
const failed = ref(false);

const downloadEditedSave = async () => {
    const fileData = saveStore.fileData;
    if (!saveStore.saveData || !fileData) return;

    failed.value = false;
    message.value = '';
    try {
        const blob = new Blob([await saveStore.exportSave()], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileData.name || 'savegame';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        message.value = 'Edited save downloaded. Replace your original file manually after backing it up.';
    } catch (error) {
        failed.value = true;
        message.value = 'The edited save could not be downloaded.';
        console.error('Could not download edited save.', error);
    }
};

const emit = defineEmits();
const loadNewFile = () => emit('loadNewFile');
</script>
