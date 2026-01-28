const USER_ID = "915185879788683305";
const card = document.getElementById('card');
const localAudio = document.getElementById('local-audio');
const volumeSlider = document.getElementById('volume-slider');
let isEntered = false;

// 1. IMPROVED GYRO LOGIC FOR ANDROID 16
function handleOrientation(event) {
    if (!isEntered) return;
    
    // Beta: front-to-back tilt (-180 to 180)
    // Gamma: left-to-right tilt (-90 to 90)
    let x = event.beta; 
    let y = event.gamma;

    // Normalizing for a natural holding angle (approx 45 degrees)
    let tiltX = (x - 45) * 0.5; 
    let tiltY = y * 0.5;

    // Constrain tilt so it doesn't flip over
    tiltX = Math.max(Math.min(tiltX, 25), -25);
    tiltY = Math.max(Math.min(tiltY, 25), -25);

    card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
}

// 2. DESKTOP MOUSE FALLBACK
document.addEventListener('mousemove', (e) => {
    if (!isEntered || ('ontouchstart' in window)) return;
    const tiltX = (e.clientY / window.innerHeight - 0.5) * -30; 
    const tiltY = (e.clientX / window.innerWidth - 0.5) * 30;
    card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
});

async function requestMotion() {
    // Check if it's iOS or modern Android requiring permission
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation, true);
                document.getElementById('motion-btn').style.display = 'none';
            }
        } catch (err) {
            console.error("Permission request failed", err);
        }
    } else {
        // Standard Android/Desktop listener
        window.addEventListener('deviceorientation', handleOrientation, true);
        document.getElementById('motion-btn').style.display = 'none';
    }
}

function startProfile() {
    if (isEntered) return;
    isEntered = true;
    document.getElementById('entry-screen').classList.add('hidden');
    card.classList.add('visible');
    
    localAudio.volume = volumeSlider.value;
    localAudio.play().catch(e => console.log("Audio play failed"));

    // Auto-trigger motion for Android if permission isn't needed
    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
            window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
            document.getElementById('motion-btn').style.display = 'block';
        }
    }
}

// Volume Slider
volumeSlider.addEventListener('input', (e) => { localAudio.volume = e.target.value; });

// API Sync (Lanyard)
async function updateData() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
        const { data } = await res.json();
        if (data.discord_user.avatar) {
            document.getElementById('discord-pfp').src = `https://cdn.discordapp.com/avatars/${USER_ID}/${data.discord_user.avatar}.png?size=512`;
        }
        if (data.listening_to_spotify && data.spotify) {
            document.getElementById('track-name').innerText = data.spotify.song || data.spotify.track;
            document.getElementById('artist-name').innerText = data.spotify.artist;
            document.getElementById('album-art').src = data.spotify.album_art_url;
            const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
            const elapsed = Date.now() - data.spotify.timestamps.start;
            document.getElementById('progress-bar').style.width = Math.min(100, (elapsed / total) * 100) + "%";
        }
    } catch (e) {}
}
setInterval(updateData, 1000);
updateData();