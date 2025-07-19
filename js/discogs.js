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
                userAgent: "AlbumScrobbler/0.2.1"
            });
        } else {
            this.discogs = new Disconnect("AlbumScrobbler/0.2.1");
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
            type: "master",
            format: "album",
            per_page: 20,
            pages: 1
        };

        return new Promise((resolve, reject) => {
            this.db.search(query, params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    async getMaster(masterId) {
        await this.initPromise;

        return new Promise((resolve, reject) => {
            this.db.getMaster(masterId, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}

module.exports = Discogs;
