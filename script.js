const client_id = 'f377f138da0f425d81a343fdbbda63db';
// const redirect_uri = 'https://deft-kheer-59b818.netlify.app/';
const redirect_uri = 'http://127.0.0.1:5173/';

let access_token = localStorage.getItem('access_token') || null;
let refresh_token = localStorage.getItem('refresh_token') || null;
let expires_at = localStorage.getItem('expires_at') || null;
let country = localStorage.getItem('country') || null;
let id = localStorage.getItem('id') || null;
localStorage.removeItem("recommendations");

let playlistId = '';
let type = '';
let time_range = '';
let topArtistsOrTracks = [''];
let recommendedTrackURIs = [''];

const loginButton = document.getElementById('login-button');
const topButtons = document.getElementsByClassName('topButton');
const loginReminder = document.getElementById('loginReminder');

loginButton.addEventListener('click', redirectToSpotifyAuthorizeEndpoint);

Array.from(topButtons).forEach((topButton) => {
  topButton.addEventListener('click', () => {
    handleTopButtonClick(topButton);
  });
});

// Check if the token has expired
if (expires_at && Date.now() >= expires_at) {
  // Token has expired, clear local storage
  localStorage.clear();
  access_token = null;
  refresh_token = null;
  expires_at = null;
  country = null;
  id = null;
}

async function handleTopButtonClick(topButton) {
  const classList = topButton.classList;
  console.log(topButton.textContent + ' button clicked');

  if (classList.contains('short')) {
    time_range = 'short_term';
  } else if (classList.contains('medium')) {
    time_range = 'medium_term';
  } else if (classList.contains('long')) {
    time_range = 'long_term';
  } else {
    console.log("Button clicked with no specific class");
  }

  sessionStorage.setItem('time_range', time_range);

  if (classList.contains('tracks')) {
    type = 'tracks';
  } else if (classList.contains('artists')) {
    type = 'artists';
  } else {
    console.log("Button clicked with no specific class");
  }

  sessionStorage.setItem('type', type);
  
  await getTopArtistsOrTracks();
  window.location.href = 'parameters.html';
}

async function getUser() {
  const response = await fetch(`https://api.spotify.com/v1/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    country = data.country;
    localStorage.setItem('country', country);
    id = data.id;
    localStorage.setItem('id', id);
    console.log(id);
  }
}

async function getTopArtistsOrTracks() {
  const response = await fetch(`https://api.spotify.com/v1/me/top/${type}?time_range=${time_range}&limit=5`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    topArtistsOrTracks = data.items.map((item) => item.id);
    console.log(topArtistsOrTracks);
    localStorage.setItem('topArtistsOrTracks', JSON.stringify(topArtistsOrTracks));
  }
}

async function getRecommendations() {
  await getTopArtistsOrTracks();
  const market = country;
  const response = await fetch(`https://api.spotify.com/v1/recommendations?seed_${type}=${topArtistsOrTracks}&market=${market}&limit=100`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.log(data);
    sessionStorage.setItem('recommendations', JSON.stringify(data));
    recommendedTrackURIs = data.tracks.map(track => track.uri);
    console.log(recommendedTrackURIs);
  }
}

function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateUrlWithSearchParams(url, params) {
  const urlObject = new URL(url);
  urlObject.search = new URLSearchParams(params).toString();
  return urlObject.toString();
}

function redirectToSpotifyAuthorizeEndpoint() {
  const codeVerifier = generateRandomString(64);

  generateCodeChallenge(codeVerifier).then((code_challenge) => {
    window.localStorage.setItem('code_verifier', codeVerifier);
    const queryParams = {
      response_type: 'code',
      client_id,
      scope: 'user-top-read playlist-modify-public playlist-modify-private user-read-email user-read-private',
      code_challenge_method: 'S256',
      code_challenge,
      redirect_uri,
    };
    window.location = generateUrlWithSearchParams('https://accounts.spotify.com/authorize', queryParams);
  });
}

async function exchangeToken(code) {
  const code_verifier = localStorage.getItem('code_verifier');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({
      client_id,
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      code_verifier,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    processTokenResponse(data);
    window.history.replaceState({}, document.title, '/');
  }
}

function processTokenResponse(data) {
  console.log(data);
  access_token = data.access_token;
  refresh_token = data.refresh_token;
  const t = new Date();
  expires_at = t.setSeconds(t.getSeconds() + data.expires_in);
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
  localStorage.setItem('expires_at', expires_at);
  console.log(access_token);
  getUser();
  setupLogoutListener();
  enableAllButtons();
}

function setupLogoutListener() {
  loginButton.textContent = 'Log out';
  loginReminder.innerText = "Give me recommendations! Based on my..."
  loginButton.removeEventListener('click', redirectToSpotifyAuthorizeEndpoint);
  loginButton.addEventListener('click', () => localStorage.clear());
  console.log('Log out listener set up');
  enableAllButtons();
}

const args = new URLSearchParams(window.location.search);
const code = args.get('code');

if (code) {
  exchangeToken(code);
} else if (access_token && refresh_token && expires_at) {
  console.log('test124');
  setupLogoutListener();
}

function enableAllButtons() {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => button.disabled = false);
}
