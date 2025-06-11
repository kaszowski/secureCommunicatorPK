const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes
const REFRESH_URL = "/refresh/token";

let refreshTimer = null;

function getCookieValue(cookieName) {
  const cookies = document.cookie.split("; ");
  for (let cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === cookieName) {
      return decodeURIComponent(value);
    }
  }
  return null; // Cookie not found
}

async function refreshToken() {
  try {
    const response = await fetch(REFRESH_URL, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();

    if (response.ok && data.success) {
      scheduleNextRefresh();
    } else {
      window.location.href = "/";
    }
  } catch (err) {
    // Silent error handling
  }
}

function scheduleNextRefresh() {
  nextRefresh = Date.now() + REFRESH_INTERVAL;

  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  refreshTimer = setTimeout(refreshToken, REFRESH_INTERVAL);
}

function checkIfRefreshNeeded() {
  const now = Date.now();
  const nextRefresh = getCookieValue("token_expiry");
  if (nextRefresh == null) {
    return;
  }
  if (now >= nextRefresh - 15 * 1000) {
    refreshToken();
  } else {
    const delay = nextRefresh - now;
    refreshTimer = setTimeout(refreshToken, delay);
  }
}

checkIfRefreshNeeded();
