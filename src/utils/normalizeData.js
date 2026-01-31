/**
 * Normalizes API response data to always return an array.
 * Handles different response formats from the backend API.
 * 
 * @param {*} data - The API response data
 * @returns {Array} - Always returns an array
 */
export function normalizeData(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.$values)) return data.$values;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}
