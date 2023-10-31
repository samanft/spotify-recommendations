const recommendations = JSON.parse(localStorage.getItem('recommendations'));
console.log(recommendations);

const audio = new Audio(); // Create a single audio element

recommendations.tracks.forEach((track) => {
    const trackDiv = document.createElement('div');
    const trackName = document.createElement('p');
    const trackImage = document.createElement('img');
    const trackButton = document.createElement('button');

    trackDiv.classList.add('track');
    trackName.classList.add('track-name');
    trackImage.classList.add('track-image');
    trackButton.classList.add('track-button');

    trackImage.src = track.album.images[0].url;
    trackImage.setAttribute('width', '64px');
    trackName.innerHTML = `${track.artists[0].name} - ${track.name}`;
    trackButton.classList.add('btn', 'btn-success');
    trackButton.innerText = 'Preview';

    trackDiv.appendChild(trackImage);
    trackDiv.appendChild(trackName);
    trackDiv.appendChild(trackButton);

    trackDiv.classList.add('align-items-center', 'd-flex');

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
});

