<template>
    <div v-if="saveStore.saveData">
        <div v-if="getPropertyCaseInsensitive(saveStore.saveData, 'Followers_Recruit').length > 0">
            <FollowerModalEdit v-if="selectedFollower" ref="followerModalEdit" :follower-data="selectedFollower" />
            <div class="follower-list">
                <div v-for="follower in getPropertyCaseInsensitive(saveStore.saveData, 'Followers_Recruit')"
                    class="card follower-card">
                    <div class="center-container">
                        <FollowerPreview :follower="follower" :size="80" />
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">
                            {{ getPropertyCaseInsensitive(follower, 'Name') }}
                        </h5>
                        <p class="card-text"> {{ t("Level:") }} <b>{{ getPropertyCaseInsensitive(follower, 'XPLevel') }}</b>
                        </p>
                        <div class="follower-card-actions">
                            <button type="button" class="btn btn-danger"
                                @click="() => deleteFollower(getPropertyCaseInsensitive(follower, 'ID'))"> {{ t("Delete") }} </button>
                            <button type="button" class="btn btn-primary" @click="() => editFollower(follower as any)"> {{ t("Edit") }} </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p v-else> {{ t("You have no recruiting follower!") }} </p>
    </div>
    <p v-else> {{ t("Load a save file!") }} </p>
</template>

<script setup lang="ts">
const { t } = useLanguage();
import { getPropertyCaseInsensitive, setPropertyCaseInsensitive } from '~/utils/utility';
import { useSaveData } from '~/stores/saveData';

const selectedFollower = ref<any>();
const followerModalEdit = ref<HTMLElement & { modal: any | undefined }>();

const editFollower = async (followerData: number) => {
    selectedFollower.value = followerData;

    await new Promise<void>(async (resolve) => {
        while (!followerModalEdit.value) {
            await new Promise<void>((r) => setTimeout(r, 1));
        }
        resolve();
    });

    followerModalEdit.value?.modal?.toggle();
}

const deleteFollower = (id: number) => {
    if (!saveStore.saveData) return;
    setPropertyCaseInsensitive(saveStore.saveData, "Followers_Recruit", getPropertyCaseInsensitive(saveStore.saveData, "Followers_Recruit").filter((follower: any) => getPropertyCaseInsensitive(follower, "ID") === id));
}

const saveStore = useSaveData();
</script>
