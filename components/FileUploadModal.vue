<template>
    <div class="modal fade" ref="fileUploadModal" tabindex="-1" aria-labelledby="fileUploadModalLabel">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header flex-column gap-2">
                    <img :src="publicPath('/lamb.gif')" :alt="t('lamb')" width="64" height="64" style="object-fit: contain" />
                    <h5 class="modal-title"> {{ t("Upload your save file") }} </h5>
                </div>
                <div class="modal-body">
                    <h1 class="text-center"> {{ t("Cult of the Lamb - Save File Editor") }} </h1>
                    <p class="mb-4 text-muted text-center"> {{ t("Upload your save file below and start editing your save file to your liking.") }} <span class="text-danger"> {{ t("Make sure you always backup your original save file.") }} </span> {{ t("After you are done, replace your old save file with the new one.") }} </p>
                    <p class="mb-4 text-muted text-center"> {{ t("Supports encrypted saves, .mp saves, JSON saves, and macOS slot_0 files using the ZB + GZIP format.") }} </p>

                    <form>
                        <input type='file' class="form-control mb-5" ref="fileInputForm" />
                    </form>

                    <hr />

                    <p class="mb-4 text-muted text-center"> {{ t("If you don't know where your save file is located, copy the below path and paste in your file explorer top bar or, if you are on Windows, hit Windows key + R and paste the path in the Run dialog box.") }} </p>
                    <label> {{ t("Save file location Windows:") }} </label>
                    <div class="input-group mb-5">
                        <input type="text" class="form-control"
                            value="%USERPROFILE%\AppData\LocalLow\Massive Monster\Cult Of The Lamb\saves"
                            :aria-label="t('Windows Save File Location')" disabled>
                        <div class="input-group-append">
                            <button class="btn btn-primary"
                                @click="(event) => copyToClipboard(((event.target! as HTMLButtonElement).parentElement!.parentElement!.querySelector('input.form-control') as HTMLInputElement).value)"
                                type="button"> {{ t("Copy") }} </button>
                        </div>
                    </div>


                    <label> {{ t("Save file location MacOS:") }} </label>
                    <div class="input-group mb-5">
                        <input type="text" class="form-control"
                            value="~/Library/Application Support/Massive Monster/Cult Of The Lamb/saves"
                            :aria-label="t('macOS Save File Location')" disabled>
                        <div class="input-group-append">
                            <button class="btn btn-primary"
                                @click="(event) => copyToClipboard(((event.target! as HTMLButtonElement).parentElement!.parentElement!.querySelector('input.form-control') as HTMLInputElement).value)"
                                type="button"> {{ t("Copy") }} </button>
                        </div>
                    </div>

                    <label>Apple Arcade Save file location MacOS:</label>
                    <div class="input-group mb-5">
                        <input type="text" class="form-control"
                            value="~/Library/Containers/com.devolverdigital.cultofthelamb/Data/Library/Application Support/com.devolverdigital.cultofthelamb/user/"
                            aria-label="Apple Arcade Save file location MacOS" disabled>
                        <div class="input-group-append">
                            <button class="btn btn-primary"
                                @click="(event) => copyToClipboard(((event.target! as HTMLButtonElement).parentElement!.parentElement!.querySelector('input.form-control') as HTMLInputElement).value)"
                                type="button"> {{ t("Copy") }} </button>
                        </div>
                    </div>
                    <p class="small text-muted mt-n4 mb-4">Para carregar o save editado, desative a internet antes de abrir o jogo. Depois que o save carregar, você pode ativar a internet novamente.</p>

                    <hr />

                    <div class="text-center">
                        <p class="mb-4 text-muted text-center"> {{ t("If you don't have a save file, or want to try out the application first before editing your real save file, click the button below to load a test save file.") }} </p>
                        <button class="btn btn-outline-secondary me-1" @click="$emit('testData')" type="button"> {{ t("Load test data") }} </button>
                        <button class="btn btn-secondary" v-if="saveStore.$state.fileData" @click="uploadModal?.hide()"> {{ t("Cancel") }} </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { Modal } from "bootstrap";
import { useSaveData } from "~/stores/saveData";

const saveStore = useSaveData();

export type Data = {
    name: string;
    data: Uint8Array
}

const fileUploadModal = ref<HTMLDivElement>();
const fileInputForm = ref<HTMLInputElement>();

const emit = defineEmits<{
    (e: 'data', data: Data): void
    (e: 'testData'): void
}>();

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};

let uploadModal = ref<Modal>();

onMounted(() => {
    if (!fileUploadModal.value || !fileInputForm.value) return;

    uploadModal.value = new Modal(fileUploadModal.value, {
        keyboard: false,
        backdrop: "static",
    });

    fileUploadModal.value.onchange = (ev: Event) => {
        const file = (ev.target as any).files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsArrayBuffer((ev.target as any).files[0]);

        reader.onloadend = () => {
            const data = new Uint8Array(reader.result as ArrayBuffer);
            emit('data', { name: file.name, data });
        };
    };
});

defineExpose({
    modal: uploadModal
})
</script>
