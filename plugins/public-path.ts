import { configurePublicPath } from "~/utils/public-path";

export default defineNuxtPlugin(() => {
    configurePublicPath(useRuntimeConfig().app.baseURL);
});
