require('dotenv').config(); // Load .env file variables into process.env

const express = require("express");

const cacheJsonMiddleware = require('./cache'); // Import the cache middleware

const app = express();

const hostname = process.env.HOSTNAME;
const port = process.env.PORT;

//~ const server = createServer((req, res) => {
  //~ res.statusCode = 200;
  //~ res.setHeader('Content-Type', 'text/plain');
  //~ res.end('Hello World');
//~ });

app.get("/", function (req, res) {
  res.send("Hola soy Druidnet!");
});

app.listen(port, hostname, () => {
  console.log(`DruidNet server running at http://${hostname}:${port}/`);
});

const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '5')
});

// Make static dbinfo available
app.use('/dbinfo.json', express.static("static/dbinfo.json"))

// Make static images available
app.use('/images', express.static("static/images"));

// Make static credits.md available
app.use('/credits.md', express.static("static/credits.md"))


app.get("/database/allplants", cacheJsonMiddleware(), fetchAllPlants)


async function fetchAllPlants (req, res) {
  let conn;
    try {
      conn = await pool.getConnection();
      const plants = await conn.query("SELECT * FROM Plant as p ORDER BY plantId ASC");
      plants.forEach((plant) => plant.toxic = !!plant.toxic)
      let confusions = await conn.query("SELECT * FROM `Confusion`");
      confusions = confusions.map((confusion) => {
        confusion.latin_name = convertPlantLinks(confusion.latin_name);
        confusion.text = convertPlantLinks(confusion.text);
        confusion.caption_text = convertPlantLinks(confusion.caption_text);
        return confusion})
      const names = await conn.query("SELECT * FROM `Name`");
      names.forEach ((name) => name.isDisplayName = !!name.isDisplayName)
      let usages = await conn.query("SELECT * FROM `Usage`");
      usages = usages.map((usage) => {usage.text = convertPlantLinks(usage.text); return usage});
      
      const plantRes = {plants, confusions, names, usages}  
      
      res.json(plantRes)
        
    } catch (err) {
      console.error(err);
    } finally {
      if (conn) conn.release(); // Release the connection back to the pool
    }
}


/**
 * Converts internal wiki-like links to Druidnet deep links.
 * Normalizes the plant name for the URL: spaces are converted to underscores.
 * The display text uses spaces.
 *
 * @param {string} text The input string containing the markdown-like links.
 * @returns {string} The string with converted links.
 */
function convertPlantLinks(text) {
  if (text) {
    // Updated Regex: Added '-' and '.' to the allowed characters in the plant name capture group
    // Group 1: 'Plant_Name', 'Plant Name', or 'Plant-Name' (can contain spaces, underscores, hyphens or dots.)
    const simpleLinkRegex = /\[\[\s*([A-Za-z0-9\s_\.-]+)\s*\]\]/g;

    // Updated Regex: Added '-' and '.' to the allowed characters in the plant name capture group
    // Group 1: 'Plant_Name', 'Plant Name', or 'Plant-Name' Or 'Plant spp.'
    // Group 2: 'Display Name'
    const aliasedLinkRegex = /\[\[\s*([A-Za-z0-9\s_\.-]+)\s*\|\s*([^\]]+?)\s*\]\]/g;

    let convertedText = text;

    // IMPORTANT: Process aliased links first, as they are more specific
    convertedText = convertedText.replace(aliasedLinkRegex, (match, plantNameRaw, displayName) => {
        // 1. For the URL: Replace spaces with underscores, then ensure underscores are encoded.
        const urlSafePlantName = plantNameRaw.trim().replace(/\s/g, '_');

        // 2. For the Display Name: Use the provided displayName, trimmed.
        return `[${displayName.trim()}](druidnet://druidanet.org/plant_sheet/${encodeURIComponent(urlSafePlantName)})`;
    });

    // Process simple links next
    convertedText = convertedText.replace(simpleLinkRegex, (match, plantNameRaw) => {
        // 1. For the URL: Replace spaces with underscores, then ensure underscores are encoded.
        const urlSafePlantName = plantNameRaw.trim().replace(/\s/g, '_');

        // 2. For the Display Name: Replace underscores with spaces for readability.
        const displayText = plantNameRaw.trim().replace(/_/g, ' ');

        return `[${displayText}](druidnet://druidanet.org/plant_sheet/${encodeURIComponent(urlSafePlantName)})`;
    });

    return convertedText;
  } else {
    return text; // Return the original text if it's falsy
  }
}


app.get("/database/allbiblio", cacheJsonMiddleware(), fetchAllBiblio)


async function fetchAllBiblio (req, res) {
  let conn;
    try {
      conn = await pool.getConnection();
      const biblio = await conn.query("SELECT * FROM `Bibliography` ORDER BY refId ASC");      
      
      res.json(biblio) // or res.sendFile(dbdump)
        
    } catch (err) {
      console.error(err);
    } finally {
      if (conn) conn.release(); // Release the connection back to the pool
    }
}

