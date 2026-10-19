export const storage = {
    get<T = any>(key: string, defaultValue: T | null = null): T | null {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set<T = any>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('LocalStorage write error:', e);
        }
    },

    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('LocalStorage remove error:', e);
        }
    },

    clear(): void {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('LocalStorage clear error:', e);
        }
    },
};
