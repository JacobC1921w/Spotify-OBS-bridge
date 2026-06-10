(async function SOBSB() {
    const { Platform, Player } = Spicetify;

    // We want to make sure the player and platform are ready for us
    if (!Player || !Platform) {
        setTimeout(SOBSB, 300);
        return;
    }
    
    //region Websocket setup
    const ws = new WebSocket("ws://127.0.0.1:5005/ws");
    let wsReady = false;

    ws.onopen = () => { wsReady = true; };
    ws.onclose = () => { wsReady = false; };
    //endregion Websocket setup

    //region Variable decs
    let currentLyrics = [];
    let lastLyricIndex = -1;
    
    let artist, album, albumCover, track, trackLength;
    //endregion Variable decs

    //region Song change listener
    Player.addEventListener("songchange", async () => {
        const data = Spicetify.Player.data.item;
        if (!data) return;

        // We use lrclib for timestamped lyrics :)
        const query = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(data.artists[0].name)}&track_name=${encodeURIComponent(data.name)}`;

        // Various variables
        currentLyrics = [];
        lastLyricIndex = -1;
        artist = data.artists[0].name;
        album = data.album.name;
        albumCover = "https://i.scdn.co/image/" + data.album.images[0].url.slice(14);
        track = data.name;
        trackLength = Player.getDuration();
        
        try {
            const res = await fetch(query);
            const json = await res.json();
            
            //region Lyric parsing
            // This is just seperating the json data from lrclib, and making a multidimensional array for lyric and timestamp
            if (json && json.syncedLyrics) {
                const currentLyricsArray = json.syncedLyrics.split('\n');
                const parsedLyrics = [];

                for (const line of currentLyricsArray) {
                    if (!line.trim()) continue;
                    
                    const openBracket = line.indexOf('[');
                    const closeBracket = line.indexOf(']');
                    if (openBracket === -1 || closeBracket === -1) continue;

                    let timestampStr = line.substring(openBracket + 1, closeBracket);
                    const [minutes, seconds, ms] = timestampStr.split(/[:.]/);
                    const timestamp = (parseInt(minutes, 10) * 60000) + 
                                      (parseInt(seconds, 10) * 1000) + 
                                      (parseInt((ms || '0').padEnd(3, '0'), 10));

                    const lyricText = line.substring(closeBracket + 1).trim();
                    parsedLyrics.push([timestamp, lyricText]);
                }
                currentLyrics = parsedLyrics;
            }
        } catch (e) {
            currentLyrics = [[0, "Couldn't find lyrics :p"]];
        }
        //endregion Lyric parsing
    });
    //endregion Song change listener

    //region Progress listener
    Player.addEventListener("onprogress", (event) => {
        if (!currentLyrics.length || !wsReady) return;

        // Without this there is considerable lag between whats display on the widget and whats being sung in the song
        const APILagCompensation = 200;
        const progress = event.data + APILagCompensation;
        
        if (progress < currentLyrics[0][0]) {
            if (lastLyricIndex !== -2) { 
                lastLyricIndex = -2;
                sendWsRequest(artist, album, albumCover, track, '♪', '♪', currentLyrics[0][1], progress, trackLength);
            }
            return;
        }

        // Find the next lyric (cool!)
        const currentIndex = currentLyrics.findLastIndex(item => item[0] <= progress);

        if (currentIndex !== -1 && currentIndex !== lastLyricIndex) {
            lastLyricIndex = currentIndex;

            const match = currentLyrics[currentIndex];
            const currentLyric = isEmptyOrWhiteSpace(match[1]) ? '♪' : match[1];
            
            const prevMatch = currentLyrics[currentIndex - 1];
            const previousLyric = (!prevMatch || isEmptyOrWhiteSpace(prevMatch[1])) ? '♪' : prevMatch[1];

            const nextMatch = currentLyrics[currentIndex + 1];
            const nextLyric = (!nextMatch || isEmptyOrWhiteSpace(nextMatch[1])) ? '♪' : nextMatch[1];

            sendWsRequest(artist, album, albumCover, track, currentLyric, previousLyric, nextLyric, progress, trackLength);
        }
    });
    //endregion Progress listener

    function sendWsRequest(artist, album, albumCover, track, currentLyric, previousLyric, nextLyric, progress, trackLength) {
        const payload = {
            type: "lyricUpdate",
            ar: artist, al: album, ac: albumCover, t: track,
            cl: currentLyric, pl: previousLyric, nl: nextLyric,
            p: progress, tl: trackLength
        };
        ws.send(JSON.stringify(payload));
    }
})();

// This is for when lyrics don't have anything associated with them, like when its just an instrumental section in a song.
function isEmptyOrWhiteSpace(str) {
    const safeStr = String(str || ''); 
    return !safeStr || safeStr.trim().length === 0;
}