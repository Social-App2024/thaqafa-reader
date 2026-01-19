import axios from "axios";

const API_URL = "http://localhost:9092/";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Needed to access the HttpOnly secure refresh token :3
});

let isRefreshing = false;
let deferQueue = [];

// Helper functions to manage access token
const getAccessToken = () => {
  let token = localStorage.getItem('access_token');
  if(!token)
    {
        token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlE3ZWlHV2Z4ZE5oejI3WXllZWRZSCJ9.eyJpc3MiOiJodHRwczovL2Rldi1qYTBtdGplem91cmNtbHNtLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw2NzUyZWEzZGQ0ZGYyMzkzODBjMjM2YmIiLCJhdWQiOiJodHRwczovL3NvY2lhbC1hcGkvIiwiaWF0IjoxNzY4ODIxOTEwLCJleHAiOjE3Njg5MDgzMTAsInNjb3BlIjoib2ZmbGluZV9hY2Nlc3MiLCJndHkiOiJwYXNzd29yZCIsImF6cCI6IjIzODBXM0pIOGZreTFWQXBhdkdDdDFTa3dlcnJWRlROIiwicGVybWlzc2lvbnMiOlsiY3JlYXRlOmJvb2siXX0.TH6EnfgrBor1gKguhGbTlfJaFKawG39Lrt8wCh83BxWbxj28JL5DobKtWbrniKoDl7Lpj92p_GMDIGqFRA4XHPUidbLAHYiDrrCsi4_i-jrSCVMeQmUpnFRdh8QPPoV3tPwQP2jY6WKcjg4k8d1UofBTpuVJEGNTA-E9gZsR4ZIySbAVgmglF1_3SSGBZRq789XXMNPleBAcH9Rh8zQ4NW84X8WMPDf7OJBCyfJIj3n3ftKyoE8Ql60LPJwY9XpYfcUgXVRxtzJ5T_V4rxO4YDEDjpfdMHQQST3-LB-_iQkSkD0ftfjbN26_w7jl0mvKq4QzxCTSzMuFUi2SSQIL3g";
    }  
  return token;
};

const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem('access_token', token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('access_token');
    delete api.defaults.headers.common["Authorization"];
  }
};

// Load any existing token on startup
const existingToken = getAccessToken();
if (existingToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${existingToken}`;
}

// Request interceptor to ensure authorization header is present
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const errorStatus = err.response?.status;

    // Error isn't unauthorized? does not concern us; just forward the rejection!
    if (!originalRequest || errorStatus !== 401) return Promise.reject(err);

    // If the unauthorized error happens on the refresh endpoint itself, then there's no point retrying.
    if (originalRequest.url?.includes("/auth/refresh"))
      return Promise.reject(err);

    // Prevent infinite looping (a retry fails and keeps procing the interceptor, hence why a guard boolean is in place!)
    if (originalRequest._retry) return Promise.reject(err);

    if (isRefreshing) {
      return new Promise((res, rej) => {
        deferQueue.push({ res, rej });
      }).then((token) => {
        // Fresh new access token acquired, retry the original request!
        originalRequest.headers["Authorization"] = "Bearer " + token;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh"); // "data" is the new access token
      console.log("acquired access: " + data);

      let accessToken = data;

      // Store the new token
      setAccessToken(accessToken);

      processQueue(null, accessToken);
      return api(originalRequest);
    } catch (error) {
      // Clear token on refresh failure
      setAccessToken(null);
      processQueue(error, null);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

const processQueue = (error, token = null) => {
  deferQueue.forEach((req) => {
    if (error) req.reject(error);
    else req.resolve(token);
  });
  deferQueue = [];
};

// Export helper functions for authentication management
export { setAccessToken, getAccessToken };
