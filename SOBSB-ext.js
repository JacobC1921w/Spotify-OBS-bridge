
(async function lyric2serial() {
    const { Platform, Player } = Spicetify;

    // Don't do anything for 300ms if Spotify isn't ready
    if (!Player || !Platform) {
        setTimeout(lyric2serial, 300);
        return;
    }
    
    //region Variables
    // Initialize some variables
    let currentLyrics = [];
    let lastLyric;
    
    let artist;
    let album;
    let albumCover;
    let track;
    let currentLyric;
    let previousLyric;
    let nextLyric;
    let progress;
    let trackLength;
    //endregion Variables

    //region Main program logic
    Player.addEventListener("songchange", async () => {
        // Set some variables for data supplied by spicetify
        const data = Spicetify.Player.data.item;
        const query = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(data.artists[0].name)}&track_name=${encodeURIComponent(data.name)}`; // Synced lyric URL

        currentLyrics = [];
        artist = data.artists[0].name;
        album = data.album.name;
        albumCover = "https://i.scdn.co/image/" + data.album.images[0].url.slice(14);
        track = data.name;
        trackLength = Player.getDuration();
        
        try {
            const res = await fetch(query);
            // TODO - check if response is ok
            const json = await res.json();
            // Parse syncedLyrics into an array of {time, text} by iterating through each line
            let currentLyricsArray = json.syncedLyrics.split('\n');
            for (lyric of currentLyricsArray) {
                let timestamp = lyric.substring((lyric.indexOf('[') + 1), (lyric.indexOf(']')));

                const [minutes, seconds, ms] = timestamp.split(/[:.]/);
                timestamp = (parseInt(minutes) * 60000) + (parseInt(seconds) * 1000) + (parseInt((ms || '0').padEnd(3, '0')));

                lyric = lyric.substring((lyric.indexOf(']') + 1), lyric.length).trim();

                currentLyrics.push([timestamp, lyric]);
            }
        } catch {
            currentLyrics = [[0, "Couldn't find lyrics :p"]];
        }
    });
    //endregion Main program logic

    //region Request section
    setInterval(() => {
        if (!currentLyrics.length) return; // Don't do anything if there's no lyrics
        progress = Player.getProgress();

        // If we haven't encountered any lyrics yet, just send through some basic information first
        if (progress < currentLyrics[0][0]) {
            sendRequest(artist, album, albumCover, track, '♪', '♪', currentLyrics[0][1], progress, trackLength);
        } else {
            // Find the next lyric (cool!)
            const currentIndex = currentLyrics.findLastIndex(item => item[0] <= progress);

            if (currentIndex !== -1) {
                const match = currentLyrics[currentIndex];
                
                // Replace null lyrics with a nice music symbol like spotify does
                currentLyric = isEmptyOrWhiteSpace(match[1]) ? '♪' : match[1];
                
                const prevMatch = currentLyrics[currentIndex - 1];
                previousLyric = (!prevMatch || isEmptyOrWhiteSpace(prevMatch[1])) ? '♪' : prevMatch[1];

                const nextMatch = currentLyrics[currentIndex + 1];
                nextLyric = (!nextMatch || isEmptyOrWhiteSpace(nextMatch[1])) ? '♪' : nextMatch[1];

                sendRequest(artist, album, albumCover, track, currentLyric, previousLyric, nextLyric, progress, trackLength);
            }
        }
    }, 200); // Using websockets so this is fine :)

    //endregion Request section
    
})();
//endregion Request section

// Didn't want to type this twice so made it a function for ease :p
async function sendRequest(artist, album, albumCover, track, currentLyric, previousLyric, nextLyric, progress, trackLength) {
    await fetch(`http://127.0.0.1:5005/lyric?ar=${artist}&al=${album}&ac=${albumCover}&t=${track}&cl=${currentLyric}&pl=${previousLyric}&nl=${nextLyric}&p=${progress}&tl=${trackLength}`, {
        mode: "no-cors"
    }); // No-cors since we don't need a response
}

function isEmptyOrWhiteSpace(str) {
    const safeStr = String(str || ''); 
    return !safeStr || safeStr.trim().length === 0;
}