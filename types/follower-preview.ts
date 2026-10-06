export interface FollowerPreviews {
    skins: Record<string, string>;
    outfits: Record<string, string>;
    clothing: Record<string, string>;
    characters?: { id: number; skins: string[]; lockColor: number; colors: Record<string, number[]>[] }[];
    layeredSkins?: Record<string, { slot: string; image: string }[]>;
}
