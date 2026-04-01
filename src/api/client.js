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
        token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlE3ZWlHV2Z4ZE5oejI3WXllZWRZSCJ9.eyJpc3MiOiJodHRwczovL2Rldi1qYTBtdGplem91cmNtbHNtLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw2NzIwYmQ1ZTk4NDMwMmI4ODYyYTQ0YjQiLCJhdWQiOiJodHRwczovL3NvY2lhbC1hcGkvIiwiaWF0IjoxNzc1MDQxNzMxLCJleHAiOjE3NzUxMjgxMzEsInNjb3BlIjoib2ZmbGluZV9hY2Nlc3MiLCJndHkiOiJwYXNzd29yZCIsImF6cCI6IjIzODBXM0pIOGZreTFWQXBhdkdDdDFTa3dlcnJWRlROIiwicGVybWlzc2lvbnMiOlsiY3JlYXRlOmJvb2siXX0.nNNft5kWlzckzcTbuSlVBqNvIgBqvdH5u_xPvTlY-md6vIBTzVfEt8_HrinymVYagKn1krHnjZyLwhS7W-TEa35uSYGk0k74Lq162wcYWEX5yO3fVxl6fMPpnTx1T9-j9dvfNh-vDAJ9taW82EWZ4Y-cstGYDDeZgunZmRrS58ee_bcjU5DyuGeteTNCb1cCfVVcnRPQMV6kfnuiw9rk7ueD26wkxyOUajjpG8KpxoRRpnxMRfzvABmp7lxBGavmNYGIRlJsgjsOUziRCb-L7LG1D04eVi5WqnUj45TIR4O3TUSBa-E18mV8lOwjFYue3-5fqZYzY1WtYlLceVp-BQ";
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
