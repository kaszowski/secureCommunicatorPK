const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes
const REFRESH_URL = '/refresh/token';

let refreshTimer = null;

function getCookieValue(cookieName) {
    const cookies = document.cookie.split('; ');
    for (let cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null; // Cookie not found
}  

async function refreshToken() {
    try {
        const response = await fetch(REFRESH_URL, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('[Auth] Token refreshed');
            scheduleNextRefresh();
        } else {
            console.warn('[Auth] Refresh failed', data.error);
            window.location.href = '/';
        }
    } catch (err) {
        console.error('[Auth] Error during token refresh:', err);
    }
}

function scheduleNextRefresh() {
    nextRefresh = Date.now() + REFRESH_INTERVAL;
    console.log("Next refresh at"+ (new Date(nextRefresh)).toString())

    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(refreshToken, REFRESH_INTERVAL);
}

function checkIfRefreshNeeded() {
    console.log("Check", getCookieValue("token_expiry"))
    const now = Date.now();
    const nextRefresh = getCookieValue("token_expiry")
    if(nextRefresh==null)
    {
        return;
    }
    if (now >= nextRefresh - 15 * 1000)
    {
        console.log('[Auth] Refreshing on page load...');
        refreshToken();
    } 
    else
    {
        const delay = nextRefresh - now;
        console.log(`[Auth] Scheduling refresh in ${Math.round(delay / 1000)} seconds`);
        refreshTimer = setTimeout(refreshToken, delay);
    }
}

checkIfRefreshNeeded();