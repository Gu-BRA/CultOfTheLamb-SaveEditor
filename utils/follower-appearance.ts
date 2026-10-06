import { publicPath } from "./public-path";
import * as spine from '@pixi-spine/runtime-3.8';
import type { FollowerPreviews } from '~/types/follower-preview';

export type ClothingAppearance = Record<string, { variants: string[]; colors: Record<string, number[]>[] }>;
type Part = { image: string; width: number; height: number; originalWidth: number; originalHeight: number; offsetX: number; offsetY: number };
type Layer = { slot: string; image: string; vertices: number[]; uvs: number[]; triangles: number[]; color: number[] };
let native: Promise<{ data: spine.SkeletonData; parts: Record<string, Part>; clothing: ClothingAppearance }> | undefined;
const images = new Map<string, Promise<HTMLImageElement>>();
const outfits: Record<number, string> = {
    0: 'Clothes/Rags', 1: 'Clothes/Sherpa', 2: 'Clothes/Warrior', 3: 'Clothes/Robes_Lvl1',
    5: 'Clothes/Robes_Lvl3', 6: 'Clothes/Robes_Lvl1', 7: 'Other/Old',
    8: 'Clothes/Holiday', 9: 'Clothes/HorseTown', 10: 'Other/Ghost', 11: 'Clothes/Undertaker',
    12: 'Other/Dissenter', 13: 'Other/Brainwashed', 14: 'Other/Freezing', 15: 'Other/Overheated',
    16: 'Clothes/Naked_Base', 17: 'Other/Injured', 19: 'Other/Baby', 20: 'Other/Zombie',
};
async function checked(url: string) {
    const response = await fetch(publicPath(url));
    if (!response.ok) throw new Error('Não foi possível carregar os arquivos da aparência.');
    return response;
}
async function loadNative() {
    if (!native) native = (async () => {
        const [parts, binary, clothing] = await Promise.all([
            checked('/Follower_Renderer/regions.json').then(r => r.json()) as Promise<Record<string, Part>>,
            checked('/Follower_Renderer/Follower.skel').then(r => r.arrayBuffer()),
            checked('/data/followerClothingAppearance.json?v=2').then(r => r.json()) as Promise<ClothingAppearance>,
        ]);
        const atlas = { findRegion(path: string) {
            const part = parts[path];
            if (!part) throw new Error(`Imagem não catalogada: ${path}`);
            return { ...part, name: path, u: 0, v: 0, u2: 1, v2: 1, rotate: false };
        } };
        const loader = new spine.AtlasAttachmentLoader(atlas as any);
        const data = new spine.SkeletonBinary(loader).readSkeletonData(new Uint8Array(binary));
        return { data, parts, clothing };
    })().catch(error => { native = undefined; throw error; });
    return native;
}
function loadImage(url: string) {
    if (!images.has(url)) images.set(url, new Promise((resolve, reject) => {
        const image = new Image(); image.onload = () => resolve(image);
        image.onerror = () => { images.delete(url); reject(new Error('Imagem da aparência indisponível.')); };
        image.src = publicPath(url);
    }));
    return images.get(url)!;
}
export function composeAppearance(data: spine.SkeletonData, parts: Record<string, Part>, clothing: ClothingAppearance,
    follower: any, previews: FollowerPreviews, kind: 'outfit' | 'clothing') {
    const skeleton = new spine.Skeleton(data);
    const merged = new spine.Skin('preview');
    const notices: string[] = [];
    function add(name: string) {
        const skin = data.findSkin(name);
        if (!skin) throw new Error(`Aparência não catalogada: ${name}`);
        merged.addSkin(skin);
    }
    add(follower.SkinName);
    const definition = clothing[follower.Clothing ?? 0];
    let selected = follower.ClothingVariant || definition?.variants[0];
    if (selected === 'Clothes/Apple2' && !data.findSkin(selected)) selected = 'Clothes/Apple_2';
    if (selected && data.findSkin(selected)) add(selected);
    else if (selected) throw new Error(`Variante de roupa não catalogada: ${selected}`);
    else throw new Error(`Esta roupa é um valor legado sem imagem no jogo instalado (ID ${follower.Clothing}). Escolha uma roupa disponível na lista.`);
    // Outfit names follow the installed FollowerBrain.GetOutfitName mappings. None/Custom keep assigned clothing.
    if (kind === 'outfit') {
        const overlay = outfits[follower.Outfit];
        if (overlay) add(overlay);
        else if (![3, 4, 5, 6, 18].includes(follower.Outfit)) notices.push(`Outfit ID ${follower.Outfit} sem prévia especial.`);
    }
    skeleton.setSkin(merged); skeleton.setSlotsToSetupPose();
    const state = new spine.AnimationState(new spine.AnimationStateData(data));
    state.setAnimation(0, 'idle', false); state.apply(skeleton); skeleton.updateWorldTransform();
    const group = previews.characters?.find(c => c.id === follower.SkinCharacter && c.skins.includes(follower.SkinName))
        ?? previews.characters?.find(c => c.skins.includes(follower.SkinName));
    const skinPalette = group?.colors[follower.SkinColour];
    if (!skinPalette) notices.push('Cor da skin não catalogada — forma base.');
    // Clothing colours are global ClothingAssigned records, not Follower.Customisation.
    const clothingPalette = definition?.colors[follower.previewClothingColour ?? 0];
    if (definition?.colors.length && !clothingPalette) notices.push('Cor da roupa não catalogada — forma base.');
    const palette = { ...skinPalette, ...clothingPalette };
    const layers: Layer[] = [];
    for (const slot of skeleton.drawOrder) {
        const attachment = slot.getAttachment();
        if (!attachment || slot.color.a === 0) continue;
        let vertices: Float32Array, uvs: number[], triangles: number[], path: string, color: { r: number; g: number; b: number; a: number };
        if (attachment instanceof spine.RegionAttachment) {
            attachment.updateOffset(); vertices = new Float32Array(8);
            attachment.computeWorldVertices(slot.bone, vertices, 0, 2);
            uvs = [0, 1, 0, 0, 1, 0, 1, 1]; triangles = [0, 1, 2, 2, 3, 0];
            path = attachment.path; color = attachment.color;
        } else if (attachment instanceof spine.MeshAttachment) {
            vertices = new Float32Array(attachment.worldVerticesLength);
            attachment.computeWorldVertices(slot, 0, vertices.length, vertices, 0, 2);
            uvs = Array.from(attachment.regionUVs); triangles = Array.from(attachment.triangles);
            path = attachment.path; color = attachment.color;
        } else continue;
        if (!parts[path]) continue;
        const tint = palette[slot.data.name] ?? [1, 1, 1, 1];
        layers.push({ slot: slot.data.name, image: parts[path].image, vertices: Array.from(vertices), uvs, triangles,
            color: [slot.color.r * color.r * tint[0], slot.color.g * color.g * tint[1], slot.color.b * color.b * tint[2], slot.color.a * color.a * tint[3]] });
    }
    if (!layers.length) throw new Error('Esta aparência não tem imagens disponíveis.');
    return { layers, notice: notices.join(' ') };
}
export async function renderAppearance(canvas: HTMLCanvasElement, follower: any, previews: FollowerPreviews,
    kind: 'outfit' | 'clothing', isCurrent: () => boolean) {
    const { data, parts, clothing } = await loadNative();
    if (!isCurrent()) return '';
    const { layers, notice } = composeAppearance(data, parts, clothing, follower, previews, kind);
    const loaded = await Promise.all(layers.map(l => loadImage(l.image)));
    if (!isCurrent()) return '';
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Prévia indisponível neste navegador.');
    const points = layers.flatMap(l => l.vertices);
    const xs = points.filter((_, i) => i % 2 === 0), ys = points.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = canvas.width * 0.9 / Math.max(maxX - minX, maxY - minY);
    const dx = (canvas.width - (maxX - minX) * scale) / 2 - minX * scale;
    const dy = (canvas.height - (maxY - minY) * scale) / 2 - minY * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const buffer = document.createElement('canvas');
    for (let i = 0; i < layers.length; i++) {
        const l = layers[i], image = loaded[i];
        buffer.width = image.width; buffer.height = image.height;
        const scratch = buffer.getContext('2d', { willReadFrequently: true })!;
        scratch.drawImage(image, 0, 0);
        const pixels = scratch.getImageData(0, 0, buffer.width, buffer.height);
        for (let p = 0; p < pixels.data.length; p += 4)
            for (let c = 0; c < 4; c++) pixels.data[p + c] *= l.color[c];
        scratch.putImageData(pixels, 0, 0);
        for (let t = 0; t < l.triangles.length; t += 3) {
            const ids = l.triangles.slice(t, t + 3);
            const x = ids.map(n => l.vertices[n * 2] * scale + dx);
            const y = ids.map(n => l.vertices[n * 2 + 1] * scale + dy);
            const u = ids.map(n => l.uvs[n * 2] * buffer.width), v = ids.map(n => l.uvs[n * 2 + 1] * buffer.height);
            const det = (u[1] - u[0]) * (v[2] - v[0]) - (u[2] - u[0]) * (v[1] - v[0]);
            if (Math.abs(det) < 1e-8) continue;
            const a = ((x[1] - x[0]) * (v[2] - v[0]) - (x[2] - x[0]) * (v[1] - v[0])) / det;
            const c = ((u[1] - u[0]) * (x[2] - x[0]) - (u[2] - u[0]) * (x[1] - x[0])) / det;
            const b = ((y[1] - y[0]) * (v[2] - v[0]) - (y[2] - y[0]) * (v[1] - v[0])) / det;
            const d = ((u[1] - u[0]) * (y[2] - y[0]) - (u[2] - u[0]) * (y[1] - y[0])) / det;
            // Canvas antialiases each triangle separately; overlap the clip slightly to avoid mesh cracks.
            const cx = (x[0] + x[1] + x[2]) / 3, cy = (y[0] + y[1] + y[2]) / 3;
            const clip = x.map((px, n) => {
                const length = Math.hypot(px - cx, y[n] - cy) || 1;
                return [px + (px - cx) * 0.65 / length, y[n] + (y[n] - cy) * 0.65 / length];
            });
            ctx.save(); ctx.beginPath(); ctx.moveTo(clip[0][0], clip[0][1]);
            ctx.lineTo(clip[1][0], clip[1][1]); ctx.lineTo(clip[2][0], clip[2][1]); ctx.closePath(); ctx.clip();
            ctx.setTransform(a, b, c, d, x[0] - a * u[0] - c * v[0], y[0] - b * u[0] - d * v[0]);
            ctx.drawImage(buffer, 0, 0); ctx.restore();
        }
    }
    return notice;
}
