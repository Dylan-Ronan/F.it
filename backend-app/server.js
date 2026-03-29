const express = require('express');
const geoip = require('geoip-lite');                                // Used to get the current user's location

const session = require('express-session');                         // Used for Google OAuth
const passport = require('passport');                               // Used for Google OAuth
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Used for Google OAuth
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

////////////////////////////////////////////////////// Routes used to handle user information ////////////////////////////////////////////////////////////////////////////////

/*
@author: Zachary
@creation_date: 3/25/26
@last_updated: 3/18/26
@description: The methods below are all used for Google OAuth. This was low-key vibe-coded but at least it works.
*/
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            // pg-promise uses .oneOrNone() instead of .query()
            const existing = await db.oneOrNone(
                'SELECT * FROM "User" WHERE email = $1',
                [email]
            );

            let user;

            if (existing) {
                // User already exists
                user = existing;
            } else {
                // Insert new user
                user = await db.one(
                    'INSERT INTO "User" (google_id, email, name, photo) VALUES ($1, $2, $3, $4) RETURNING *',
                    [profile.id, email, profile.displayName, profile.photos[0].value]
                );
            }

            return done(null, user);
        } catch (err) {
            console.error('OAuth DB error:', err);
            return done(err, null);
        }
    }
));
// 1. Kick off the OAuth flow
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
// 2. Google redirects back here
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);
// 3. Logout
app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Not authenticated' });
}

/*
@author: Zachary
@creation_date: 3/28/26
@last_updated: 3/18/26
@description: This route is used to update a user's preferences, typically done during account creation
*/
app.put('/user/:userID/preferences', async (req, res) => {
    try {
        const { userID } = req.params;
        const { colors, styles } = req.body;

        const result = await db.oneOrNone(
            `UPDATE "User" SET "favorite_colors" = $1, "favorite_styles" = $2 WHERE "UID" = $3 RETURNING "UID"`,
            [colors, styles, parseInt(userID)]
        );

        res.status(200).json({ success: true, user: result });
    }
    catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

////////////////////////////////////////////////////// Routes used to handle user information ////////////////////////////////////////////////////////////////////////////////

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

        // Check to see if the program is running on a local host. Use Lehigh University's IP as a default if it is
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
            AND "Type" = 'shirt'
            AND "Minimum_Temperature" <= $2
            AND "Maximum_Temperature" >= $2
            AND "Styles" like '%' || $3 || '%'
            ORDER BY RANDOM()
            LIMIT 1;
            `,
            [parseInt(userID), avgTemp, style]
        );

        const pants = await db.one(
            `
            SELECT "Name", "Image_url" FROM "Item"
            WHERE "Owner" = $1
            AND "Type" = 'pants'
            AND "Minimum_Temperature" <= $2
            AND "Maximum_Temperature" >= $2
            AND "Styles" like '%' || $3 || '%'
            ORDER BY RANDOM()
            LIMIT 1;
            `,
            [parseInt(userID), avgTemp, style]
        );

        const shoes = await db.one(
            `
            SELECT "Name", "Image_url"
            FROM "Item"
            WHERE "Owner" = $1
            AND "Type" = 'shoe'
            AND "Minimum_Temperature" <= $2
            AND "Maximum_Temperature" >= $2
            AND "Styles" like '%' || $3 || '%'
            ORDER BY RANDOM()
            LIMIT 1;
            `,
            [parseInt(userID), avgTemp, style]
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