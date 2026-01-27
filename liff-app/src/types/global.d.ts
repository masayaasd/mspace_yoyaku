export { };

declare global {
    interface Window {
        __ENV__: {
            VITE_LIFF_ID?: string;
            VITE_API_BASE?: string;
        };
    }
}
