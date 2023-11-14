const client_id = 'f377f138da0f425d81a343fdbbda63db';
// const redirect_uri = 'https://deft-kheer-59b818.netlify.app/';
const redirect_uri = 'http://127.0.0.1:5173/';

let access_token = localStorage.getItem('access_token') || null;
let refresh_token = localStorage.getItem('refresh_token') || null;
let expires_at = localStorage.getItem('expires_at') || null;
let country = localStorage.getItem('country') || null;
let id = localStorage.getItem('id') || null;
localStorage.removeItem("recommendations");

const loginButton = document.getElementById('login-button');

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