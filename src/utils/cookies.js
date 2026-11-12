import { env } from "../config/env.js";

const common = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
};

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("ww_access", accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000
  });
  res.cookie("ww_refresh", refreshToken, {
    ...common,
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(res) {
  res.clearCookie("ww_access", common);
  res.clearCookie("ww_refresh", common);
}
