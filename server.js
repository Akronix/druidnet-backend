const express = require("express");
//~ const fs = require('fs');

const app = express();

const hostname = '0.0.0.0'; //const hostname = "backend.druidnet.es";
const port = 5555;

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
  host: 'localhost', // your host
  user: 'druidnet', // your username
  password: 'druidnet02042025', // your password
  database: 'druidnet',
  connectionLimit: 5
});

//~ app.get("/database/lastupdate", (req, res) => {
  //~ // SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA = 'druidnet' LIMIT 1; 
  //~ // Lo cambiaría para leer de un fichero con la última fecha o versión de datos que yo elija, que puede ser un entero con la fecha perfectamente y que también diga lo que hay que cambiar, tipo:
  //~ //   - databaseNo: 202403240027
  //~ //   - SQL: true o bien - SQL: - Plant
  //~ //   - images:
  //~ //      - gentiana_lutea
  
  //~ obj = readJSON('dbinfo.json');
  
  //~ res.json(obj);

//~ });

//~ function readJSON(fileName) {
    //~ try {
        //~ const data = fs.readFileSync(fileName, 'utf-8');
        //~ const jsonData = JSON.parse(data);
        //~ return(jsonData);
    //~ } catch (error) {
        //~ console.error('Error reading file:', error);
    //~ }
//~ }

// Make static dbinfo available
app.use('/dbinfo.json', express.static("static/dbinfo.json"))

// Make static images available
app.use('/images', express.static("static/images"));



app.get("/database/allplants", fetchAllPlants)


async function fetchAllPlants (req, res) {
  let conn;
    try {
      conn = await pool.getConnection();
      const plants = await conn.query("SELECT * FROM Plant as p ORDER BY plantId ASC");
      plants.forEach((plant) => plant.toxic = !!plant.toxic)
      const confusions = await conn.query("SELECT * FROM `Confusion`");
      const names = await conn.query("SELECT * FROM `Name`");
      names.forEach ((name) => name.isDisplayName = !!name.isDisplayName)
      const usages = await conn.query("SELECT * FROM `Usage`");
      
      const plantRes = {plants, confusions, names, usages}  
      
      res.json(plantRes)
        
    } catch (err) {
      console.error(err);
    } finally {
      if (conn) conn.release(); // Release the connection back to the pool
    }
}


app.get("/database/allbiblio", fetchAllBiblio)


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
