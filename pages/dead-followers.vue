<template>
    <div v-if="saveStore.saveData">
        <div v-if="getPropertyCaseInsensitive(saveStore.saveData, 'Followers_Dead')?.length > 0">
            <FollowerModalEdit v-if="selectedFollower" ref="followerModalEdit" :follower-data="selectedFollower"
                :is-dead="true" />
            <div class="follower-list">
                <div v-for="follower in getPropertyCaseInsensitive(saveStore.saveData, 'Followers_Dead')" class="card follower-card">
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
                        <div class="py-1" />
                        <div class="row">
                            <div class="col center-container">
                                <button type="button" class="btn btn-success"
                                    @click="() => reviveFollower(getPropertyCaseInsensitive(follower, 'ID'))"> {{ t("Revive") }} </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p v-else> {{ t("You have no dead follower! Go kill some!") }} </p>
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
    console.log('followerData = ', followerData);
    selectedFollower.value = followerData;

    await new Promise<void>(async (resolve) => {
        while (!followerModalEdit.value) {
            await new Promise<void>((r) => setTimeout(r, 1));
        }
        resolve();
    });

    followerModalEdit.value?.modal?.toggle();
}

const reviveFollower = async (id: number) => {
    if (!saveStore.saveData) return;
    getPropertyCaseInsensitive(saveStore.saveData, "Followers").push(getPropertyCaseInsensitive(saveStore.saveData, "Followers_Dead").find((follower: any) => getPropertyCaseInsensitive(follower, "ID") === id)!);
    deleteFollower(id);
}

const deleteFollower = (id: number) => {
    if (!saveStore.saveData) return;
    setPropertyCaseInsensitive(saveStore.saveData, "Followers_Dead", getPropertyCaseInsensitive(saveStore.saveData, "Followers_Dead").filter((follower: any) => getPropertyCaseInsensitive(follower, "ID") !== id));
}

const saveStore = useSaveData();
</script>
