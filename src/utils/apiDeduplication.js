/**
 * ✅ API Request Deduplication Utility
 * Prevents duplicate API calls by caching in-flight requests
 * Reduces server load and improves performance
 */

const pendingRequests = new Map();

/**
 * Creates a unique key for an API request
 * @param {string} url - Request URL
 * @param {object} config - Request config (method, params, data)
 * @returns {string} Unique request key
 */
function createRequestKey(url, config = {}) {
  const method = config.method || "GET";
  const params = config.params ? JSON.stringify(config.params) : "";
  const data = config.data ? JSON.stringify(config.data) : "";
  return `${method}:${url}:${params}:${data}`;
}

/**
 * Deduplicates API requests - if same request is already in flight, returns the same promise
 * @param {Function} apiCall - The API call function
 * @param {string} url - Request URL
 * @param {object} config - Request config
 * @returns {Promise} The API call promise (shared if duplicate)
 */
export function deduplicateRequest(apiCall, url, config = {}) {
  const key = createRequestKey(url, config);

  // If request is already pending, return the existing promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Create new request promise
  const requestPromise = apiCall(url, config)
    .then((response) => {
      // Remove from pending requests on success
      pendingRequests.delete(key);
      return response;
    })
    .catch((error) => {
      // Remove from pending requests on error
      pendingRequests.delete(key);
      throw error;
    });

  // Store the promise
  pendingRequests.set(key, requestPromise);

  return requestPromise;
}

/**
 * Clears all pending requests (useful for testing or cleanup)
 */
export function clearPendingRequests() {
  pendingRequests.clear();
}

/**
 * Gets the number of pending requests
 * @returns {number} Number of pending requests
 */
export function getPendingRequestsCount() {
  return pendingRequests.size;
}
