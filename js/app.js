// METAMASK CONNECTION
const TIMEOUT = 1000;
const COLLECTION_NAME = 'CodeCats';
let editions = [];
let dots = 1;

const DEBUG_XPLANE =
  new URLSearchParams(window.location.search).has('debug') ||
  window.localStorage.getItem('DEBUG_XPLANE') === '1';

window.addEventListener('DOMContentLoaded', () => {
  const onboarding = new MetaMaskOnboarding();
  const onboardButton = document.getElementById('connectWallet');
  let accounts;

  const updateButton = async () => {
    if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
      onboardButton.innerText = 'Install MetaMask!';
      onboardButton.onclick = () => {
        onboardButton.innerText = 'Connecting...';
        onboardButton.disabled = true;
        onboarding.startOnboarding();
      };
    } else if (accounts && accounts.length > 0) {
      onboardButton.innerText = `✔ ...${accounts[0].slice(-4)}`;
      onboardButton.disabled = true;
      onboarding.stopOnboarding();
      checkOwner(accounts[0]);
    } else {
      onboardButton.innerText = 'Connect MetaMask!';
      onboardButton.onclick = async () => {
        await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        .then(function(accounts) {
          onboardButton.innerText = `✔ ...${accounts[0].slice(-4)}`;
          onboardButton.disabled = true;
          checkOwner(accounts[0]);
        });
      };
    }
  };

  updateButton();
  if (MetaMaskOnboarding.isMetaMaskInstalled()) {
    window.ethereum.on('accountsChanged', (newAccounts) => {
      accounts = newAccounts;
      updateButton();
    });
  }
});

const checkOwner = async (account) => {
  if(account) {
    let isOwner = false;
    let page = 1
    
    const data = await fetchWithRetry(`/.netlify/functions/isowner/?wallet=${account}&page=${page}`);

    isOwner = !isOwner ? data.isOwner : isOwner;
    updateStatusText(isOwner, true)
    
    editions = [...data.editions]
    let nextPage = data.next_page

    while(nextPage) {
      page = nextPage
      const data = await fetchWithRetry(`/.netlify/functions/isowner/?wallet=${account}&page=${page}`);

      isOwner = !isOwner ? data.isOwner : isOwner;
      updateStatusText(isOwner, true)
      
      editions = [...editions, ...data.editions]
      nextPage = data.next_page
    }

    updateStatusText(isOwner, false)
  }
}

function updateStatusText(isOwner, checking) {
  const statusText = document.querySelector('.owner-status');
  if(checking) {
    if(isOwner) {
      statusText.innerText = `You do own ${COLLECTION_NAME}!! 😻 Let's see how many${renderDots(dots)}`;
    } else {
      statusText.innerText = `Checking to see if you own any ${COLLECTION_NAME} 😻${renderDots(dots)}`;
    }
  } else {
    if(isOwner) {
      statusText.innerText = `You own ${editions.length} ${COLLECTION_NAME}!! 😻`;
    } else {
      statusText.innerText = `You don't own any ${COLLECTION_NAME} 😿`;
    }
  }
  dots = dots === 3 ? 1 : dots + 1;
}

function renderDots(dots) {
  let dotsString = '';
  for (let i = 0; i < dots; i++) {
    dotsString += '.';
  }
  return dotsString;
}

function timer(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function createRequestId() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
  } catch (e) {
    // ignore
  }
  return `rid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function withDebugQuery(url) {
  if (!DEBUG_XPLANE) return url;
  const u = new URL(url, window.location.origin);
  u.searchParams.set('debug', '1');
  return u.pathname + u.search;
}

async function fetchWithRetry(url, { maxRetries = 8 } = {}) {
  const requestId = createRequestId();
  const debugUrl = withDebugQuery(url);
  let attempt = 0;

  // small initial delay so status messages animate
  await timer(TIMEOUT);

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(debugUrl, {
        headers: {
          'x-request-id': requestId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (DEBUG_XPLANE) {
          console.log('[xplane] isowner ok', {
            requestId: data.requestId || requestId,
            status: res.status,
            url: debugUrl,
          });
        }
        return data;
      }

      const retryable = res.status >= 500 || res.status === 429;
      const bodyText = await res.text().catch(() => '');
      const looksLikeMisconfig = bodyText.includes('Server misconfigured');
      const shouldRetry = retryable && !looksLikeMisconfig && attempt < maxRetries;

      if (DEBUG_XPLANE) {
        console.warn('[xplane] isowner non-200', {
          requestId,
          status: res.status,
          retryable: shouldRetry,
          url: debugUrl,
          body: bodyText.slice(0, 500),
        });
      }

      if (!shouldRetry) {
        const error = new Error(`isowner failed (status ${res.status}) [requestId=${requestId}]`);
        // Mark as non-retryable when we explicitly decided not to retry (e.g. 4xx except 429).
        error.retryable = false;
        error.status = res.status;
        throw error;
      }
    } catch (error) {
      // If we explicitly decided this isn't retryable, fail fast.
      if (error && error.retryable === false) throw error;
      if (attempt === maxRetries) throw error;
      if (DEBUG_XPLANE) console.warn('[xplane] isowner fetch error; retrying', { requestId, error });
    }

    attempt += 1;
    await timer(TIMEOUT * Math.min(6, attempt)); // backoff
  }

  throw new Error(`isowner failed after retries [requestId=${requestId}]`);
}