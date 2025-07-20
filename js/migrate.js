const DBMigrate = require('db-migrate');
const path = require('path');

async function migrateDatabase() {
    const dbmigrate = DBMigrate.getInstance(true, {
        env: 'dev',
        config: path.join(__dirname, '..', 'database.json'),
    });

    try {
        await dbmigrate.up();
    } catch (err) {
        console.error('Migration error:', err);
    }
}

module.exports = migrateDatabase;
