import { computed, ref } from "vue";
import type { User } from "../types";
import { ApiError, getApi, postApi, putApi } from "../services/api";

export interface WechatProfileInput {
  nickname?: string;
  avatarUrl?: string;
}

interface WechatLoginResponse {
  token: string;
  user: User;
  expiresIn: number;
  [key: string]: unknown;
}

interface CurrentUserResponse {
  user: User;
}

const USER_STORAGE_KEY = "ahang_current_user";
const TOKEN_STORAGE_KEY = "ahang_session_token";
const SESSION_EXPIRES_AT_STORAGE_KEY = "ahang_session_expires_at";
const DEFAULT_SESSION_SECONDS = 7 * 24 * 60 * 60;

const guestUser: User = {
  id: "guest",
  nickname: "未登录",
  avatarUrl: "",
  role: "guest",
  status: "active",
  createdAt: "",
};

function loadStoredUser(): User {
  try {
    const token = uni.getStorageSync(TOKEN_STORAGE_KEY);
    const expiresAt = Number(uni.getStorageSync(SESSION_EXPIRES_AT_STORAGE_KEY) || 0);
    const stored = uni.getStorageSync(USER_STORAGE_KEY);
    if (token && (!expiresAt || expiresAt > Date.now()) && stored && typeof stored === "object" && stored.id) {
      return stored as User;
    }
  } catch {
    // Storage may be unavailable during SSR/build-time evaluation.
  }
  return guestUser;
}

const currentUser = ref<User>(loadStoredUser());
const wechatLoginLoading = ref(false);

function persistUser(user: User) {
  currentUser.value = user;
  uni.setStorageSync(USER_STORAGE_KEY, user);
}

function persistSession(token: string, user: User, expiresIn = DEFAULT_SESSION_SECONDS) {
  uni.setStorageSync(TOKEN_STORAGE_KEY, token);
  uni.setStorageSync(
    SESSION_EXPIRES_AT_STORAGE_KEY,
    Date.now() + Math.max(1, Number(expiresIn) || DEFAULT_SESSION_SECONDS) * 1000,
  );
  persistUser(user);
}

async function initializeAuth(): Promise<User> {
  const token = uni.getStorageSync(TOKEN_STORAGE_KEY);
  let expiresAt = Number(uni.getStorageSync(SESSION_EXPIRES_AT_STORAGE_KEY) || 0);
  if (!token) {
    persistUser(guestUser);
    return guestUser;
  }
  // 旧版本登录记录没有客户端到期时间，从升级后的首次启动起保留一周。
  if (!expiresAt) {
    expiresAt = Date.now() + DEFAULT_SESSION_SECONDS * 1000;
    uni.setStorageSync(SESSION_EXPIRES_AT_STORAGE_KEY, expiresAt);
  }
  if (expiresAt && expiresAt <= Date.now()) {
    logout();
    return guestUser;
  }
  try {
    const response = await getApi<CurrentUserResponse>("/api/auth/me");
    persistUser(response.user);
    return response.user;
  } catch (error) {
    // 临时断网或后端短暂不可用时保留缓存会话；只有服务端明确拒绝令牌才退出。
    if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
      logout();
      return guestUser;
    }
    return currentUser.value.role === "guest" ? guestUser : currentUser.value;
  }
}

function logout() {
  uni.removeStorageSync(TOKEN_STORAGE_KEY);
  uni.removeStorageSync(SESSION_EXPIRES_AT_STORAGE_KEY);
  persistUser(guestUser);
}

function getLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: UniApp.LoginOptions = {
      provider: "weixin",
      timeout: 15000,
      success(result) {
        if (result.code) {
          resolve(result.code);
          return;
        }
        reject(new Error("微信未返回可用的登录凭证"));
      },
      fail(error) {
        reject(new Error(error.errMsg || "微信授权失败"));
      },
    };

    // #ifdef APP-PLUS
    options.onlyAuthorize = true;
    // #endif

    uni.login(options);
  });
}

async function loginWithWechat(profile: WechatProfileInput = {}): Promise<User> {
  wechatLoginLoading.value = true;
  try {
    let platform: "mp-weixin" | "app" = "mp-weixin";

    // #ifdef H5
    throw new Error("H5 预览不支持 uni.login 微信授权，请在微信小程序或 App 中体验");
    // #endif

    // #ifdef APP-PLUS
    platform = "app";
    // #endif

    const code = await getLoginCode();
    const response = await postApi<WechatLoginResponse>("/api/auth/wechat", {
      code,
      platform,
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl,
    });

    persistSession(response.token, response.user, response.expiresIn);
    return response.user;
  } finally {
    wechatLoginLoading.value = false;
  }
}

async function updateWechatProfile(profile: WechatProfileInput): Promise<User> {
  const response = await putApi<CurrentUserResponse>("/api/auth/profile", profile);
  persistUser(response.user);
  return response.user;
}

export function useAuthStore() {
  return {
    currentUser,
    isGuest: computed(() => currentUser.value.role === "guest"),
    wechatLoginLoading,
    initializeAuth,
    loginWithWechat,
    updateWechatProfile,
    logout,
  };
}
