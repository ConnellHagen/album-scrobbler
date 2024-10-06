const { ipcRenderer, shell } = require('electron');
const keytar = require('keytar');

const API_ROOT = "http://ws.audioscrobbler.com/2.0/";

class LastFM {
    constructor() {
        this.token = "";
    }

    async getAPIKey() {
        return await keytar.getPassword('AlbumScrobbler', 'APIKey');
    }

    async setAPIKey(key) {
        await keytar.setPassword('AlbumScrobbler', 'APIKey', key);
    }
    
    async getAPISecret() {
        return await keytar.getPassword('AlbumScrobbler', 'APISecret');
    }

    async setAPISecret(secret) {
        await keytar.setPassword('AlbumScrobbler', 'APISecret', secret);
    }

    async getSessionKey() {
        return await keytar.getPassword('AlbumScrobbler', 'SessionKey')
    }

    async setSessionKey(key) {
        await keytar.setPassword('AlbumScrobbler', 'SessionKey', key);
    }
    
    async getRequestToken() {
        const API_KEY = await this.getAPIKey();
        const endpoint = `${API_ROOT}?method=auth.gettoken&api_key=${API_KEY}&format=json`;
        
        const response = await ipcRenderer.invoke("fetch", endpoint, "GET");
        let obj = JSON.parse(response);
        this.token = obj["token"];
    }

    async requestAuth() {
        await this.getRequestToken();

        if (this.token === undefined || this.token == "")
            throw "Token Missing"

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

        let endpoint = `${API_ROOT}?method=auth.getSession&api_key=${API_KEY}&token=${this.token}&api_sig=${sig}&format=json`;4
        let response = await ipcRenderer.invoke("fetch", endpoint, "GET");
        let data = JSON.parse(response);
        const username = data.session.name;
        const key = data.session.key;

        endpoint = `${API_ROOT}?method=user.getInfo&user=${username}&api_key=${API_KEY}&format=json`;
        response = await ipcRenderer.invoke("fetch", endpoint, "GET");
        data = JSON.parse(response);
        let pfp = data.user.image[1]["#text"];

        await this.setSessionKey(key);
        return [username, pfp]
    }

    async endSession() {
        await keytar.deletePassword('AlbumScrobbler', 'SessionKey')
    }

    async isSession() {
        const sessionKey = await this.getSessionKey();
        return sessionKey != null;
    }

    static async md5(input) {
        return await ipcRenderer.invoke('md5', input);
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
