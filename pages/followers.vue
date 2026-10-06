<template>
    <div v-if="saveStore.saveData">
        <section class="card p-3 mb-3">
            <h2 class="h5 mb-2">{{ t('Create random follower') }}</h2>
            <form class="row g-2 align-items-end" @submit.prevent="createFollower">
                <div class="col-12 col-md">
                    <label for="new-follower-name" class="form-label">{{ t('Follower name') }}</label>
                    <input id="new-follower-name" v-model="newFollowerName" class="form-control" type="text"
                        maxlength="40" :placeholder="t('Leave blank to generate a game-style name.')">
                </div>
                <div class="col-12 col-md-auto">
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-outline-secondary" @click="generateName">
                            {{ t('Generate name') }}
                        </button>
                        <button type="submit" class="btn btn-primary">{{ t('Create follower') }}</button>
                    </div>
                </div>
            </form>
            <p v-if="creationNotice" class="small text-success mt-2 mb-0" role="status">{{ creationNotice }}</p>
            <p v-if="creationError" class="small text-danger mt-2 mb-0" role="alert">{{ creationError }}</p>
        </section>

        <FollowerModalEdit v-if="selectedFollower" ref="followerModalEdit" :follower-data="selectedFollower" show-greon-preset
            v-model="shouldShowModal" @save="saveFollower" />
        <div v-if="followers.length > 0">
            <div class="row mb-3">
                <div class="col-12 col-lg-6 offset-lg-6">
                    <input type="text" class="form-control" id="searchFollower" v-model="searchFollower"
                        :placeholder="t('Search follower')">
                </div>
            </div>
            <div class="follower-list">
                <div v-for="follower in filteredFollowers" :key="follower.ID" class="card follower-card">
                    <div class="center-container">
                        <FollowerPreview :follower="follower" :size="80" />
                    </div>
                    <div class="card-body">
                        <p class="card-title h6">
                            {{ getPropertyCaseInsensitive(follower, 'Name') }}
                        </p>
                        <p class="card-text"> {{ t("Level:") }} <span class="fw-bold">{{ getPropertyCaseInsensitive(follower, 'XPLevel') }}</span>
                        </p>
                        <div class="follower-card-actions">
                            <button type="button" class="btn btn-danger"
                                @click="() => deleteFollower(getPropertyCaseInsensitive(follower, 'ID'))"> {{ t("Delete") }} </button>
                            <button type="button" class="btn btn-primary" @click="() => editFollower(follower)"> {{ t("Edit") }} </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p v-else> {{ t("You have no follower!") }} </p>
    </div>
    <p v-else> {{ t("Load a save file!") }} </p>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { getPropertyCaseInsensitive, setPropertyCaseInsensitive } from '~/utils/utility';
import { useSaveData } from '~/stores/saveData';
import type { Follower } from '~/types/save';
import type { FollowerEditEvent } from '~/components/FollowerModalEdit.vue';
import followerSkinCatalog from '~/public/data/followerSkin.json';
import followerPreviewCatalog from '~/public/data/followerPreviews.json';
import { createRandomFollower } from '~/utils/new-follower';
import { generateFollowerName } from '~/utils/follower-name';

const selectedFollower = ref<any>();
const followerModalEdit = ref<HTMLElement & { modal: any | undefined }>();
const shouldShowModal = ref(false);
const searchFollower = ref("");
const saveStore = useSaveData();
const newFollowerName = ref('');
const creationNotice = ref('');
const creationError = ref('');
const followers = computed(() => getPropertyCaseInsensitive(saveStore.saveData, 'Followers') ?? []);

const existingFollowerNames = () => {
    if (!saveStore.saveData) return [];
    return ['Followers', 'Followers_Recruit', 'Followers_Dead']
        .flatMap(key => getPropertyCaseInsensitive(saveStore.saveData, key) ?? [])
        .map(follower => getPropertyCaseInsensitive(follower, 'Name'));
};

const generateName = () => {
    newFollowerName.value = generateFollowerName(existingFollowerNames());
};

const createFollower = () => {
    creationNotice.value = '';
    creationError.value = '';
    if (!saveStore.saveData) return;
    const name = newFollowerName.value.trim() || generateFollowerName(existingFollowerNames());

    try {
        const follower = createRandomFollower(
            saveStore.saveData,
            name,
            followerSkinCatalog,
            followerPreviewCatalog.characters,
        );
        setPropertyCaseInsensitive(saveStore.saveData, 'Followers', [...followers.value, follower as unknown as Follower]);
        creationNotice.value = t('Follower {name} created with ID {id}.', { name, id: follower.ID });
        newFollowerName.value = '';
    } catch (error) {
        creationError.value = error instanceof Error ? t(error.message) : t('Could not create the follower.');
    }
};

const editFollower = async (followerData: Follower) => {
    selectedFollower.value = followerData;

    await new Promise<void>(async (resolve) => {
        while (!followerModalEdit.value) {
            await new Promise<void>((r) => setTimeout(r, 1));
        }
        resolve();
    });

    shouldShowModal.value = true;
}

const filteredFollowers = computed(() => {
    if (!searchFollower.value) {
        return followers.value;
    }

    const search = searchFollower.value.toLowerCase();

    return followers.value
        .filter((follower) => getPropertyCaseInsensitive(follower, "Name").toLowerCase().includes(search));
});

const deleteFollower = (id: number) => {
    if (!saveStore.saveData) return;
    setPropertyCaseInsensitive(saveStore.saveData, "Followers", getPropertyCaseInsensitive(saveStore.saveData, "Followers").filter((follower: any) => getPropertyCaseInsensitive(follower, "ID") !== id));
}

const saveFollower = (followerData: FollowerEditEvent, oldID: number) => {
    if (!saveStore.saveData) {
        console.error("No save data found ?");
        return;
    }

    const followers = getPropertyCaseInsensitive(saveStore.saveData, "Followers");
    const index = followers.findIndex((follower: any) => getPropertyCaseInsensitive(follower, "ID") === oldID);
    if (index === -1) {
        console.error("Follower with ID " + oldID + " not found ?");
        return;
    }

    // copy the follower data
    for (const key in followerData) {
        setPropertyCaseInsensitive(followers[index], key, followerData[key as keyof typeof followerData]);
    }

    saveStore.checkCultTraits(followerData.ID);
}

</script>
