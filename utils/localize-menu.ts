// Translate the JSON editor's supported menu model without touching JSON content or callbacks.
export function localizeMenu<T>(value: T, t: (text: string) => string): T {
    if (Array.isArray(value)) return value.map(item => localizeMenu(item, t)) as T;
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
        (key === 'text' || key === 'title') && typeof item === 'string' ? t(item)
            : item && typeof item === 'object' ? localizeMenu(item, t) : item,
    ])) as T;
    return value;
}
