// cache.js
const fs = require('fs');
const NodeCache = require('node-cache');
const path = require('path');

// --- Cache Configuration ---
// Initialize NodeCache without a default TTL, so items persist until flushed
const myCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const VERSION_DB_FILE = path.join(__dirname, 'static/dbinfo.json');
let currentVersionDB = null; // To store the current version from the file

// --- Function to read versionDB from file ---
function readVersionDB () { 

    const fileContent = fs.readFileSync(VERSION_DB_FILE, 'utf8');

    if (fileContent === '') {
        return readVersionDB(); // If the file is empty, read it again
    }
        
    try {
        versionDB = JSON.parse(fileContent).versionDB;
        console.log(`[Cache] Initial versionDB: ${currentVersionDB}`);
    } catch (err) {
        console.error(`[Cache] Error reading versionDB file: ${err.message}`);
        // Default to a version if file doesn't exist or is unreadable
        versionDB = 0;
    }

    return versionDB
};

// Read initial version when the module is loaded
currentVersionDB = readVersionDB();

// --- Watch for changes in dbinfo.json ---
// This will set up the watch when the module is first required
fs.watch(VERSION_DB_FILE, (eventType, filename) => {

    if (eventType === 'change') {
        const newVersion = readVersionDB()
        
        if (newVersion !== currentVersionDB) {
            console.log(`[Cache] dbinfo.json changed from ${currentVersionDB} to ${newVersion}. Invalidating cache.`);
            myCache.flushAll(); // Clear the entire cache
            currentVersionDB = newVersion;
        }
    }
});


// --- Caching Middleware for JSON response ---
const cacheJsonMiddleware = () => {
    return (req, res, next) => {
        const key = '__express__' + req.originalUrl || req.url;
        const cachedBody = myCache.get(key);

        if (cachedBody) {
            console.log(`[Cache] HIT for ${key}`);
            return res.json(cachedBody);
        } else {
            console.log(`[Cache] MISS for ${key}. Fetching and caching...`);
            // Monkey patch res.json to intercept the response
            const originalSend = res.json;
            res.json = (body) => {
                // Cache the response
                myCache.set(key, body);
                originalSend.call(res, body); // Send the actual response
            };
            next(); // Continue to the route handler
        }
    };
};

// Export the middleware
module.exports = cacheJsonMiddleware;

// Optionally, you could also export the cache instance itself if you need to manually flush or inspect it
// module.exports = {
//     cacheMiddleware: cacheMiddleware,
//     myCache: myCache // If you ever need direct access to the cache instance
// };