import { translateText, type EditorLanguage } from '~/utils/translate';
export function useLanguage() {
    const preference = useCookie<EditorLanguage>('cotl-editor-language', { default: () => 'pt-BR', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    const current = useState<EditorLanguage>('cotl-editor-language', () => preference.value === 'en' ? 'en' : 'pt-BR');
    const language = computed({ get: () => current.value, set: (value: EditorLanguage) => {
        current.value = value === 'en' ? 'en' : 'pt-BR'; preference.value = current.value;
    } });
    const t = (value: unknown, params?: Record<string, unknown>) => translateText(value, current.value, params);
    return { language, t };
}
