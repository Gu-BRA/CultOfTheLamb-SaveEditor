<template>
    <div class="modal fade" id="DeathCatBeatenWarning" tabindex="-1" aria-labelledby="DeathCatBeatenWarningLabel"
        aria-hidden="true" ref="warningModalElement">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="DeathCatBeatenWarningLabel"> {{ t("Warning") }} </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('Close')"></button>
                </div>
                <div class="modal-body">
                    <p> {{ t("If you indoctrinate The One Who Waits, it will always have the ID \"666\".") }} <span class="fw-bold text-danger"> {{ t("Having multiple followers with the same ID can lead to softlocks or save file corruption.") }} </span> {{ t("Make sure you have a back up of your save file and don't have more than one Follower sharing the same ID.") }} </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal"> {{ t("Got it boss") }} </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { Modal } from "bootstrap";

const warningModalElement = ref<HTMLDivElement>();
const warningModal = ref<Modal>();

onMounted(() => {
    if (!warningModalElement.value) return;

    warningModal.value = new Modal(warningModalElement.value, {
        keyboard: false,
        backdrop: "static",
    });
});

defineExpose({
    modal: warningModal
})
</script>