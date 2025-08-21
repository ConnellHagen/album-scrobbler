const { ipcRenderer, shell } = require("electron");
const keytar = require("keytar");

const API_ROOT = "http://ws.audioscrobbler.com/2.0/";

class LastFM {
    constructor() {
        this.token = "";
    }

    async getAPIKey() {
        return await keytar.getPassword("AlbumScrobbler", "APIKey");
    }

    async setAPIKey(key) {
        await keytar.setPassword("AlbumScrobbler", "APIKey", key);
    }

    async getAPISecret() {
        return await keytar.getPassword("AlbumScrobbler", "APISecret");
    }

    async setAPISecret(secret) {
        await keytar.setPassword("AlbumScrobbler", "APISecret", secret);
    }

    async getSessionKey() {
        return await keytar.getPassword("AlbumScrobbler", "SessionKey")
    }

    async setSessionKey(key) {
        await keytar.setPassword("AlbumScrobbler", "SessionKey", key);
    }

    /* for testing purposes only */
    async testSessionKeyValid() {
        const API_KEY = await this.getAPIKey();
        const SESSION_KEY = await this.getSessionKey();

        let params = {
            "method": "track.love",
            "api_key": API_KEY,
            "sk": SESSION_KEY,
            "artist": "J Dilla",
            "track": "Waves"
        }

        let sig = await this.createSignature(params);
        params["api_sig"] = sig;
        params["format"] = "json";

        let response = await ipcRenderer.invoke("fetchPOST", API_ROOT, params);
        let data = JSON.parse(response);
        console.log(data);
    }

    async getRequestToken() {
        const API_KEY = await this.getAPIKey();
        const endpoint = `${API_ROOT}?method=auth.gettoken&api_key=${API_KEY}&format=json`;

        const response = await ipcRenderer.invoke("fetchGET", endpoint);
        let obj = JSON.parse(response);
        this.token = obj["token"];
    }

    async requestAuth() {
        await this.getRequestToken();

        if (this.token === undefined || this.token == "") {
            throw new Error("Missing Last.fm Credentials. Please sign in and/or add API Keys.");
        }

        const API_KEY = await this.getAPIKey();

        const url = `http://www.last.fm/api/auth/?api_key=${API_KEY}&token=${this.token}`;
        shell.openExternal(url);
    }

    async createSession() {
        let API_KEY = await this.getAPIKey();

        let params = {
            "method": "auth.getSession",
            "token": this.token,
            "api_key": API_KEY
        };

        let sig = await this.createSignature(params);

        let endpoint = `${API_ROOT}?method=auth.getSession&api_key=${API_KEY}&token=${this.token}&api_sig=${sig}&format=json`;
        let response = await ipcRenderer.invoke("fetchGET", endpoint);
        let data = JSON.parse(response);
        const username = data.session.name;
        const key = data.session.key;

        endpoint = `${API_ROOT}?method=user.getInfo&user=${username}&api_key=${API_KEY}&format=json`;
        response = await ipcRenderer.invoke("fetchGET", endpoint);
        data = JSON.parse(response);
        let pfp = data.user.image[1]["#text"];

        await this.setSessionKey(key);
        return [username, pfp]
    }

    async isSession() {
        const sessionKey = await this.getSessionKey();
        return sessionKey != null;
    }

    async endSession() {
        await keytar.deletePassword("AlbumScrobbler", "SessionKey")
    }

    // pre-condition: all 4 parameter arrays must be the same length
    async sendScrobbles(tracks, artists, albums, albumArtists, timestamps) {
        let API_KEY = await this.getAPIKey();
        let SESSION_KEY = await this.getSessionKey();

        if (!SESSION_KEY) {
            throw new Error("Missing Last.fm Credentials. Please sign in with Last.fm.");
        }
        else if (!API_KEY) {
            throw new Error("Missing Last.fm Credentials. Please add API Keys.");
        }

        let arrayLength = artists.length;

        let params = {
            "method": "track.scrobble",
            "api_key": API_KEY,
            "sk": SESSION_KEY
        }

        for (let i = 0; i < arrayLength; i++) {
            let paramNames = [
                `track[${i}]`,
                `artist[${i}]`,
                `album[${i}]`,
                `albumArtist[${i}]`,
                `timestamp[${i}]`
            ];
            let values = [
                tracks[i],
                artists[i],
                albums[i],
                albumArtists[i],
                timestamps[i]
            ];

            for (let j = 0; j < paramNames.length; j++) {
                params[paramNames[j]] = values[j];
            }
        }

        let sig = await this.createSignature(params);
        params["api_sig"] = sig;
        params["format"] = "json";

        let response = await ipcRenderer.invoke("fetchPOST", API_ROOT, params);
        let data = JSON.parse(response);

        return true; // success
    }

    static async md5(input) {
        return await ipcRenderer.invoke("md5", input);
    }

    async createSignature(params) {
        let signature = "";
        Object.keys(params)
            .sort()
            .forEach((v, i) => {
                signature += v;
                signature += params[v];
            });
        signature += await this.getAPISecret();
        return LastFM.md5(signature);
    }
}

module.exports = LastFM;
