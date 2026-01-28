const USER_ID = "915185879788683305";
const localAudio = document.getElementById('local-audio');

function startProfile() {
    document.getElementById('entry-screen').classList.add('hidden');
    document.getElementById('card').classList.add('visible');
    localAudio.play().catch(err => console.log("Audio play blocked:", err));
}

async function updateLanyard() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
        const { data } = await res.json();

        // Debugging: Right-click page -> Inspect -> Console to see this
        console.log("Current Spotify Data:", data.spotify);

        // 1. Profile Sync
        if (data.discord_user.avatar) {
            document.getElementById('discord-pfp').src = `https://cdn.discordapp.com/avatars/${USER_ID}/${data.discord_user.avatar}.png?size=512`;
        }
        document.getElementById('display-name').innerText = data.discord_user.display_name || data.discord_user.username;

        // 2. Status Sync
        const colors = { online: '#43b581', idle: '#faa61a', dnd: '#f04747', offline: '#747f8d' };
        document.getElementById('status-dot').style.background = colors[data.discord_status] || '#747f8d';

        // 3. Spotify Logic
        const spot = document.getElementById('spotify');
        const progress = document.getElementById('progress');

        if (data.listening_to_spotify && data.spotify) {
            spot.classList.remove('not-playing');
            
            // Lanyard usually stores the title in .song, but some versions use .track
            // We use || to try every possibility
            const songName = data.spotify.song || data.spotify.track || "Unknown Song";
            const artistName = data.spotify.artist || "Unknown Artist";

            document.getElementById('album-art').src = data.spotify.album_art_url;
            document.getElementById('track').innerText = songName;
            document.getElementById('artist').innerText = artistName;
            
            // Progress Calculation
            const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
            const elapsed = Date.now() - data.spotify.timestamps.start;
            const prc = Math.max(0, Math.min(100, (elapsed / total) * 100));
            progress.style.width = prc + "%";
        } else {
            spot.classList.add('not-playing');
            document.getElementById('track').innerText = "Nothing Playing";
            document.getElementById('artist').innerText = "Spotify is idle";
            progress.style.width = "0%";
        }
    } catch (err) { 
        console.error("Lanyard connection failed:", err); 
    }
}

setInterval(updateLanyard, 1000);
updateLanyard();