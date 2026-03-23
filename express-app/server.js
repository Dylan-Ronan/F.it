const express = require('express');
const geoip = require('geoip-lite'); // Used to get the current user's location
const app = express();
const PORT = 3000;
const pgp = require('pg-promise')(/* options */);

app.use(express.json());

/*
@author: Zachary
@creation_date: 3/18/26
@last_updated: 3/18/26
@description: This is what connects the backend to the database
*/
require('dotenv').config();

const db = pgp({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

////////////////////////////////////////////////////// Routes used for Google oAuth //////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////// Routes used for Google oAuth //////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////// Route used to fetch items belonging to a user /////////////////////////////////////////////////////////////////////////

/*
@author: Zachary
@creation_date: 3/18/26
@last_updated: 3/18/26
@description: This is used to generate a list of all the clothing that belongs to a particular user, filtered by the clothing type.
*/
app.get('/user/:userID/:type', async (req, res) => {
    try{
        const { userID, type } = req.params;

        const shirts = await db.manyOrNone(
            `SELECT * FROM "Item" WHERE "Owner" = $1 AND "Type" = $2;`,
            [userID, type]
        );

        res.status(200).json({ success: true, shirts });
    }
    catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

////////////////////////////////////////////////////// Routes used to fetch items belonging to a user /////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////// Routes used to generate an outfit for the user //////////////////////////////////////////////////////////////////////

app.get('/location', (req, res) => {
    try {
        // Get the client's IP (handle proxies with x-forwarded-for)
        ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Check to see if the program is running on a local host. If it use, use Lehigh University's IP
        if (ip === '::ffff:127.0.0.1') {
            ip = process.env.TEST_IP_ADDRESS;
        }

        const geo = geoip.lookup(ip);

        if (!geo) {
            return res.status(404).json({ error: 'Location not found' });
        }

        res.status(200).json({
            success: true,
            ip,
            country: geo.country,
            region: geo.region,
            city: geo.city,
            coordinates: geo.ll, // [latitude, longitude]
            timezone: geo.timezone,
        });
    }
    catch(error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/weather', async (req, res) => {
    try {
        // Get the client's IP (handle proxies with x-forwarded-for)
        ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Check to see if the program is running on a local host. If it use, use Lehigh University's IP
        if (ip === '::ffff:127.0.0.1') {
            ip = process.env.TEST_IP_ADDRESS;
        }

        const geo = geoip.lookup(ip);

        if (!geo) {
            return res.status(404).json({ error: 'Location not found' });
        }

        const response = await fetch(
            `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_DOT_COM_KEY}&q=${geo.ll[0]},${geo.ll[1]}`
        );

        const data = await response.json();
        minTemp = data.forecast.forecastday[0].day.mintemp_f;
        maxTemp = data.forecast.forecastday[0].day.maxtemp_f;
        avgTemp = (maxTemp + minTemp) / 2;

        res.status(200).json({ success: true, avgTemp });
    }
    catch(error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/generateOutfit/:userID/:style', async(req, res) => {
    const { userID , style } = req.params;
    try {
        // Get the client's IP (handle proxies with x-forwarded-for)
        ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Check to see if the program is running on a local host. If it is, use Lehigh University's IP
        if (ip === '::ffff:127.0.0.1') {
            ip = process.env.TEST_IP_ADDRESS;
        }

        const geo = geoip.lookup(ip);

        if (!geo) {
            return res.status(404).json({ error: 'Location not found' });
        }

        const response = await fetch(
            `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_DOT_COM_KEY}&q=${geo.ll[0]},${geo.ll[1]}`
        );

        const data = await response.json();
        minTemp = data.forecast.forecastday[0].day.mintemp_f;
        maxTemp = data.forecast.forecastday[0].day.maxtemp_f;
        avgTemp = (maxTemp + minTemp) / 2 + 15;

        const shirt = await db.one(
            `
            SELECT "Name", "Image_url"
            FROM "Item"
            WHERE "Owner" = $1
            AND "Type" = 'Shirt'
            AND "Minimum Temperature" <= $2
            AND "Maximum Temperature" >= $2
            AND "Styles" like '%' || $3 || '%'
            ORDER BY RANDOM()
            LIMIT 1;
            `,
            [userID, avgTemp, style]
        );

        const pants = await db.one(
            `
            SELECT "Name", "Image_url" FROM "Item"
            WHERE "Owner" = $1
            AND "Type" = 'Pants'
            AND "Minimum Temperature" <= $2
            AND "Maximum Temperature" >= $2
            AND "Styles" like '%' || $3 || '%'
            ORDER BY RANDOM()
            LIMIT 1;
            `,
            [userID, avgTemp, style]
        );

        const shoes = await db.one(
            `
            SELECT "Name", "Image_url"
            FROM "Item"
            WHERE "Owner" = $1
            AND "Type" = 'Shoes'
            AND "Minimum Temperature" <= $2
            AND "Maximum Temperature" >= $2
            AND "Styles" like '%' || $3 || '%'
            ORDER BY RANDOM()
            LIMIT 1;
            `,
            [userID, avgTemp, style]
        );

        res.status(200).json({ success: true, avgTemp, shirt , pants, shoes});
    }
    catch(error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

////////////////////////////////////////////////////// Routes used to generate an outfit for the user //////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});