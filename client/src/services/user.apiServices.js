import { axios, baseURL, getHeaders } from "./AuthHeader.js";

function loginAPI(data) {
  return axios.post(baseURL + "api/users/login", data);
}

function registerAPI(data) {
  return axios
    .post(baseURL + "api/users/register", data);
}

function getUserInfoAPI() {
  return axios
    .get(baseURL + "api/users/me", getHeaders);
}

function updateUserInfoAPI(data) {
  return axios
    .put(baseURL +
      "api/users/edit",
      data,
      getHeaders
    );
}

function getUserAuthAPI() {
  return axios
    .get(baseURL + "api/users/auth", getHeaders);
}

function feedBackAPI(message) {
  return axios.post(baseURL + "api/system/feedback", message, getHeaders);
}

export { loginAPI, registerAPI, getUserInfoAPI, updateUserInfoAPI, getUserAuthAPI, feedBackAPI, };
