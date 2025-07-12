const Disconnect = require("disconnect").Client;
const keytar = require("keytar");

class Discogs {
    constructor() {
        this.initPromise = this.createAuthConnection();
    }

    async createAuthConnection() {
        const token = await keytar.getPassword("AlbumScrobbler", "DiscogsToken");
        if (token) {
            this.discogs = new Disconnect({
                userToken: token,
                userAgent: "AlbumScrobbler/0.2.0"
            });
        } else {
            this.discogs = new Disconnect("AlbumScrobbler/0.2.0");
        }
        this.db = this.discogs.database();
    }

    async setPersonalAccessToken(token) {
        console.log("token:", token);
        if (!token) {
            await keytar.deletePassword("AlbumScrobbler", "DiscogsToken");
        } else {
            await keytar.setPassword("AlbumScrobbler", "DiscogsToken", token);
        }
        this.createAuthConnection();
    }

    async getPersonalAccessToken() {
        return await keytar.getPassword("AlbumScrobbler", "DiscogsToken");
    }

    async searchByQuery(query) {
        await this.initPromise;

        let params = {
            type: "release",
            format: "album",
            per_page: 20,
            pages: 1
        };

        let result = await this.db.search(query, params, (err, data) => {
            if (err) {
                console.log(`err`, err);
            }
            console.log(`data`, data);
            return data;
        });

        return result;
    }
}

module.exports = Discogs;
