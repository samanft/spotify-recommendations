const btnEnergy = document.querySelectorAll('input[type=radio][name=btnEnergy]');
const btnMood = document.querySelectorAll('input[type=radio][name=btnMood]');
const btnPopularity = document.querySelectorAll('input[type=radio][name=btnPopularity]');
let energyChecked = null;
let moodChecked = null;
let popularityChecked = null;

function handleRadioClick(radioButtons, checkedRadioButton) {
    for (let i = 0; i < radioButtons.length; i++) {
        radioButtons[i].addEventListener('click', function () {
            if (checkedRadioButton == this) {
                this.checked = false;
                checkedRadioButton = null;
            } else {
                checkedRadioButton = this;
            }
        });
    }
    return checkedRadioButton;
}

function getSelectedEnergyId(radioButtons) {
    for (let i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked) {
            return radioButtons[i].id;
        }
    }
    return null;
}

energyChecked = handleRadioClick(btnEnergy, energyChecked);
moodChecked = handleRadioClick(btnMood, moodChecked);
popularityChecked = handleRadioClick(btnPopularity, popularityChecked);

const time_range = sessionStorage.getItem('time_range') || null;
const type = sessionStorage.getItem('type') || null;
const country = localStorage.getItem('country') || null;
const access_token = localStorage.getItem('access_token') || null;
console.log(JSON.parse(localStorage.getItem('topArtistsOrTracks')));
const topArtistsOrTracks = JSON.parse(localStorage.getItem('topArtistsOrTracks')) || null;

async function getRecommendations() {
    const market = country;
    const energy = getSelectedEnergyId(btnEnergy) || '';
    const mood = getSelectedEnergyId(btnMood) || '';
    const popularity = getSelectedEnergyId(btnPopularity) || '';

    const response = await fetch(`https://api.spotify.com/v1/recommendations?seed_${type}=${topArtistsOrTracks}&market=${market}&limit=100${energy}${mood}${popularity}`, {
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

const getRecommendationsBtn = document.getElementById('getRecommendationsBtn');

getRecommendationsBtn.addEventListener('click', async function () {
    await getRecommendations();
    window.location.href = 'filter.html';
});