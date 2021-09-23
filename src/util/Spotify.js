const clientId = "6a1fabbc6c964914bc9162c946ec6393";
const redirectUri = "http://localhost:3000";
let accessToken;

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }

        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);

            // this clears the parameters, allowing us to grab a new access token when it expires.
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            // window.location = accessUrl
        }
    },

    search(term) {
        return fetch(`https://api.spotify.com/v1/search?type=track,artist,album&q=${term}&limit=50`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
        .then(response => {
            return response.json();
        })
        .then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                ID: track.id,
                Name: track.name,
                Artist: track.artists[0].name,
                Album: track.album.name,
                URI: track.uri
            }));
        })
    },

    savePlaylist(playlistName, tracksURI) {
        if (!playlistName || !tracksURI) {
            return;
        }
        const header = {
            Authorization: `Bearer ${accessToken}`
        };
        let userId;

        return fetch(`https://api.spotify.com/v1/me`, {headers: header})  //to get user id
        .then(response => {
            return response.json();
        })
        .then(jsonResponse => {
            userId = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, //to get playlist id
            {
                headers: header,
                method: 'POST',
                body: JSON.stringify({name: playlistName})
            })
            .then(response => response.json())
            .then(jsonResponse => {
                const playlistID = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistID}/tracks`, //to add tracks to playlist
                {
                    headers: header,
                    method: 'POST',
                    body: JSON.stringify({ uris: tracksURI})
                })
            })
        })
    }
};
Spotify.getAccessToken();

export default Spotify; 