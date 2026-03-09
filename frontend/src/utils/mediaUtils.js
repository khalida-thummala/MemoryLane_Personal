export const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    // Get the base API URL from environment variables, prioritizing localhost in dev
    const baseUrl = import.meta.env.DEV ? 'http://localhost:5000' : (import.meta.env.VITE_API_URL || '');

    // Remove leading slash and handle backslashes (Windows-style)
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\//, '');

    return `${baseUrl}/${normalizedPath}`;
};
