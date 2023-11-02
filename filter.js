let recommendations = JSON.parse(sessionStorage.getItem('recommendations'));

if (!recommendations) {
    window.location.href = 'index.html';
}

const ogRecs = recommendations;
const errorMessage = document.getElementById('errorMessage');
const audio = new Audio(); // Create a single audio element

const createPlaylistButton = document.getElementById('createPlaylistButton');
const namePlaylist = document.getElementById('namePlaylist');
let playlistName = null;
const selectAll = document.getElementById('selectAll');
let recommendedTrackURIs = recommendations.tracks.map(track => track.uri);

selectAll.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.form-check-input');
    if (selectAll.checked) {
        checkboxes.forEach((checkbox) => {
            checkbox.checked = true;
            recommendedTrackURIs = recommendations.tracks.map(track => track.uri);
        });
    } else {
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = false;
            recommendedTrackURIs[index] = null;
        });
    }
}
);

namePlaylist.addEventListener('change', () => {
    if (namePlaylist.value === '') {
        playlistName = null;
    } else {
        playlistName = namePlaylist.value;
    }
})

createPlaylistButton.addEventListener('click', () => {
    const filteredTrackURIs = recommendedTrackURIs.filter(uri => uri !== null);
    if (filteredTrackURIs.length === 0) {
        errorMessage.innerHTML = 'Please select at least one track.';
        errorMessage.classList.add('text-danger', 'fw-semibold');
    } else {
        createPlaylistAndAddTracks(filteredTrackURIs);
    }
});

recommendations.tracks.forEach((track, index) => {
    const trackDiv = document.createElement('div');
    const trackName = document.createElement('p');
    const trackImage = document.createElement('img');
    const trackButton = document.createElement('button');
    const trackLength = document.createElement('p');
    const trackCheckbox = document.createElement('input');
    const leftSide = document.createElement('div');
    const rightSide = document.createElement('div');

    trackDiv.classList.add('track');
    trackName.classList.add('track-name', 'text-wrap');
    trackImage.classList.add('track-image');
    trackLength.classList.add('track-length');
    trackButton.classList.add('track-button');

    trackImage.src = track.album.images[0].url;
    trackImage.setAttribute('width', '64px');
    trackName.innerHTML = `${track.artists[0].name} - ${track.name}`;
    trackButton.classList.add('btn', 'btn-success');
    trackButton.innerText = 'Preview';
    trackLength.innerHTML = `${Math.floor(track.duration_ms / 60000)}:${(track.duration_ms % 60000 / 1000).toFixed(0).padStart(2, '0')}`;
    trackCheckbox.type = 'checkbox';
    trackCheckbox.classList.add('form-check-input', 'otherCheckBoxes', 'ms-3');
    trackCheckbox.checked = true;

    leftSide.appendChild(trackImage);
    leftSide.appendChild(trackName);
    if (track.preview_url !== null) {
        rightSide.appendChild(trackButton);
    }
    rightSide.appendChild(trackLength);
    rightSide.appendChild(trackCheckbox);

    trackDiv.appendChild(leftSide);
    trackDiv.appendChild(rightSide);

    trackDiv.classList.add('justify-content-between', 'd-flex', 'bg-black', 'my-3', 'p-3', 'rounded');
    leftSide.classList.add('d-flex', 'align-items-center');
    rightSide.classList.add('d-flex', 'align-items-center');
    trackImage.classList.add('me-3');
    trackLength.classList.add('ms-3');

    document.querySelector('.tracks').appendChild(trackDiv);

    // Add event listener to play track preview when button is clicked
    trackButton.addEventListener('click', () => {
        if (audio.src === track.preview_url) {
            if (!audio.paused) {
                audio.pause();
            } else {
                audio.play();
            }
        } else {
            // If a different track is clicked, pause the current audio and play the new one
            audio.src = track.preview_url;
            audio.play();
        }
    });

    // Add event listener to remove track from recommendations array if unchecked and re-add it if rechecked
    trackCheckbox.addEventListener('click', () => {
        if (!trackCheckbox.checked) {
            recommendedTrackURIs[index] = null;
        } else {
            recommendedTrackURIs[index] = track.uri;
        }
        console.log(recommendedTrackURIs.filter(uri => uri !== null).length);

        if (recommendedTrackURIs.filter(uri => uri !== null).length === recommendations.tracks.length) {
            selectAll.checked = true;
        } else {
            selectAll.checked = false;
        }
    });
});

const client_id = 'f377f138da0f425d81a343fdbbda63db';
const redirect_uri = 'http://127.0.0.1:5500/';

let access_token = localStorage.getItem('access_token') || null;
let refresh_token = localStorage.getItem('refresh_token') || null;
let expires_at = localStorage.getItem('expires_at') || null;
let country = localStorage.getItem('country') || null;
let id = localStorage.getItem('id') || null;

let playlistId = '';
let type = '';
let time_range = '';
let topArtistsOrTracks = [''];

const recommendationsButton = document.getElementById('recommendationsButton');
const topButtons = document.getElementsByClassName('topButton');

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
        localStorage.setItem('recommendations', JSON.stringify(data));
        recommendedTrackURIs = data.tracks.map(track => track.uri);
        // createPlaylistAndAddTracks(recommendedTrackURIs);
    }
}

async function createPlaylistAndAddTracks(recommendedTrackURIs) {
    const playlistData = await createPlaylist();
    console.log(playlistData);
    playlistId = playlistData.id;
    await addTracksToPlaylist(playlistId, recommendedTrackURIs);
    console.log('Playlist created and tracks added successfully.');
    console.log(recommendedTrackURIs);
    // window.location.href = playlistData.external_urls.spotify;
}

async function createPlaylist() {
    const response = await fetch(`https://api.spotify.com/v1/users/${id}/playlists`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: playlistName || 'My SpotiRecs Playlist',
        }),
    });

    if (response.ok) {
        const jsonResponse = await response.json();
        console.log(jsonResponse);
        return jsonResponse;
    }
}

async function addTracksToPlaylist(playlistId, recommendedTrackURIs) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uris: recommendedTrackURIs,
        }),
    });

    if (!response.ok) {
        console.error('Error:', response);
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
}

const args = new URLSearchParams(window.location.search);
const code = args.get('code');

if (code) {
    exchangeToken(code);
} else if (access_token && refresh_token && expires_at) {
}