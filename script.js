(function () {
  document
    .getElementById('login-button')
    .addEventListener('click', redirectToSpotifyAuthorizeEndpoint, false);

  document
    .getElementById('recommendationsButton')
    .addEventListener('click', getRecommendations, false);
  // Get the radio buttons by their name
  const radioButtons = document.getElementsByName('flexRadioDefault');

  // Initialize a variable to store the selected value
  let time_range = 'medium_term';

  // Add a change event listener to each radio button
  radioButtons.forEach((radioButton) => {
    radioButton.addEventListener('change', (event) => {
      // Update the time_range variable when a radio button is checked
      if (event.target.checked) {
        time_range = event.target.id;
        console.log(`Selected Value: ${time_range}`);
      }
    });
  });

  let topTracks = [];
  let topArtists = [];
  let country = '';
  let id = '';
  let playlistId = ''; 

  function getUser() {
    return fetch(`https://api.spotify.com/v1/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then(addThrowErrorToFetch)
      .then((data) => {
        country = data.country;
        id = data.id;
      });
  }

  function getTopArtistsOrTracks() {
    console.log(access_token);
    return fetch(`https://api.spotify.com/v1/me/top/${type}?time_range=${time_range}&limit=5`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then(addThrowErrorToFetch)
      .then((data) => {
        topArtistsOrTracks = data.items.map((item) => item.id);
      });
  }
  function getRecommendations() {
    // Assume you have already obtained the `topTracks`, `access_token`, and `country`.
    getTopArtistsOrTracks()
      .then(() => {
        // Get recommendations based on the seed tracks.
        return fetch(`https://api.spotify.com/v1/recommendations?seed_${type}=${topArtists}&market=${country}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
      })
      .then(addThrowErrorToFetch)
      .then((data) => {
        // Extract the URIs of the recommended tracks from the response.
        const recommendedTrackURIs = data.tracks.map(track => track.uri);

        // Create a new playlist.
        return fetch(`https://api.spotify.com/v1/users/${id}/playlists`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Nah bc this playlist is so fire...', // Set the name of the playlist
          }),
        })
          .then(addThrowErrorToFetch)
          .then((playlistData) => {
            console.log(playlistData);
            playlistId = playlistData.id;

            // Add the recommended tracks to the newly created playlist.
            return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uris: recommendedTrackURIs, // Add the URIs of the recommended tracks
              }),
            });
          })
          .then(addThrowErrorToFetch)
          .then(() => {
            console.log('Playlist created and tracks added successfully.');
            const iframe = document.createElement('iframe');
            iframe.src = `https://open.spotify.com/embed/playlist/${playlistId}`;
            iframe.frameBorder = '0';
            iframe.allow = 'encrypted-media';
            document.querySelector('body').append(iframe);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }



  function generateRandomString(length) {
    let text = '';
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async function generateCodeChallenge(codeVerifier) {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(codeVerifier),
    );

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

      // Redirect to example:
      // GET https://accounts.spotify.com/authorize?response_type=code&client_id=77e602fc63fa4b96acff255ed33428d3&redirect_uri=http%3A%2F%2Flocalhost&scope=user-follow-modify&state=e21392da45dbf4&code_challenge=KADwyz1X~HIdcAG20lnXitK6k51xBP4pEMEZHmCneHD1JhrcHjE1P3yU_NjhBz4TdhV6acGo16PCd10xLwMJJ4uCutQZHw&code_challenge_method=S256

      window.location = generateUrlWithSearchParams(
        'https://accounts.spotify.com/authorize',
        {
          response_type: 'code',
          client_id,
          scope: 'user-top-read playlist-modify-public playlist-modify-private user-read-email user-read-private',
          code_challenge_method: 'S256',
          code_challenge,
          redirect_uri,
        },
      );

      // If the user accepts spotify will come back to your application with the code in the response query string
      // Example: http://127.0.0.1:8080/?code=NApCCg..BkWtQ&state=profile%2Factivity
    });
  }

  function exchangeToken(code) {
    const code_verifier = localStorage.getItem('code_verifier');

    fetch('https://accounts.spotify.com/api/token', {
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
    })
      .then(addThrowErrorToFetch)
      .then((data) => {
        processTokenResponse(data);

        // clear search query params in the url
        window.history.replaceState({}, document.title, '/');
      })
  }

  async function addThrowErrorToFetch(response) {
    if (response.ok) {
      return response.json();
    } else {
      throw { response, error: await response.json() };
    }
  }

  function logout() {
    localStorage.clear();
    window.location.reload();
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
  }

  // function getRecommendations {
  //   fetch('https://api.spotify.com/v1/recommendations', {)
  // }

  // Your client id from your app in the spotify dashboard:
  // https://developer.spotify.com/dashboard/applications
  const client_id = 'f377f138da0f425d81a343fdbbda63db';
  const redirect_uri = 'http://127.0.0.1:5500/'; // Your redirect uri

  // Restore tokens from localStorage
  let access_token = localStorage.getItem('access_token') || null;
  let refresh_token = localStorage.getItem('refresh_token') || null;
  let expires_at = localStorage.getItem('expires_at') || null;

  function setupLogoutListener() {
    document.getElementById('login-button').textContent = 'Log out';
    document.getElementById('login-button').removeEventListener('click', redirectToSpotifyAuthorizeEndpoint, false);
    document.getElementById('login-button').addEventListener('click', logout, false);
    console.log('Log out listener set up');
  }

  // If the user has accepted the authorize request spotify will come back to your application with the code in the response query string
  // Example: http://127.0.0.1:8080/?code=NApCCg..BkWtQ&state=profile%2Factivity
  const args = new URLSearchParams(window.location.search);
  const code = args.get('code');

  if (code) {
    // we have received the code from spotify and will exchange it for a access_token
    exchangeToken(code);
  } else if (access_token && refresh_token && expires_at) {
    // we are already authorized and reload our tokens from localStorage
    console.log('bruh123');

    setupLogoutListener();

  }

})();