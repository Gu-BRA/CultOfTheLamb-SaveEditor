import ui from '~/locales/ui.json';
import catalog from '~/locales/catalog.json';
import extra from '~/locales/extra.json';
import upgrades from '~/locales/upgrades.json';
import buildings from '~/locales/buildings.json';
export type EditorLanguage = 'pt-BR' | 'en';
const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
const pairs = [...catalog, ...extra, ...upgrades, ...buildings, ...ui];
const lookup = new Map<string, string[]>();
const canonical = new Map(pairs.map(pair => [normalize(pair[0]), pair]));
for (const pair of pairs) for (const source of pair) lookup.set(normalize(source), canonical.get(normalize(pair[0]))!);
const patterns = pairs.filter(pair => pair.some(s => /\{\w+\}/.test(s))).flatMap(pair => pair.map(source => {
    const names: string[] = [];
    const escaped = normalize(source).replace(/[.*+?^$()|[\]\\]/g, '\\$&');
    const pattern = escaped.replace(/\{(\w+)\}/g, (_, name) => { names.push(name); return '(.+?)'; });
    return { regex: new RegExp(`^${pattern}$`), pair, names };
})).sort((a, b) => b.regex.source.length - a.regex.source.length);
export function translateText(value: unknown, language: EditorLanguage, params: Record<string, unknown> = {}): string {
    if (value === undefined || value === null) return '';
    const source = String(value), key = normalize(source);
    let pair = lookup.get(key), variables = params;
    if (!pair) for (const pattern of patterns) {
        const match = key.match(pattern.regex);
        if (match) { pair = pattern.pair; variables = { ...Object.fromEntries(pattern.names.map((name, i) => [name, match[i + 1]])), ...params }; break; }
    }
    if (!pair) {
        // Native skin variants keep their numeric identity, while the animal name is localized.
        const match = key.match(/^(.+?)(\d+)$/);
        if (match && lookup.has(match[1])) return `${translateText(match[1], language)} ${match[2]}`;
        return source;
    }
    return pair[language === 'pt-BR' ? 1 : 0].replace(/\{(\w+)\}/g, (all, name) => String(variables[name] ?? all));
}
