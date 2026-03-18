const express = require('express');
const app = express();
const PORT = 3000;
const pgp = require('pg-promise')(/* options */);
const nodemailer = require('nodemailer');

app.use(express.json());

/*
@author: Tian
@creation_date: 2/28/26
@last_updated: 2/28/26
@description: This is what connects the backend to the database
*/
require('dotenv').config();

const db = pgp({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
})

/*
@author: Tian
@creation_date: 2/28/26
@last_updated: 2/28/26
@description: This is the patient intake form post with an experimental endpoint - may change afterwards
*/
app.post('/patient/intake', async (req, res) => {
    try {
        const { team, firstName, lastName, address, city, zip, state, startDate } = req.body;

        const result = await db.one(
            'INSERT INTO "Patient" ("Team", "First Name", "Last Name", "Address", "City", "ZIP", "State", "Start_Date") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "PID"',
            [team, firstName, lastName, address, city, zip, state, startDate]);

            res.status(201).json({ success: true, patientId: result.PID });
    } catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

////////////////////////////////////////////////////// Routes used to fetch items owned by a user /////////////////////////////////////////////////////////////////////////

/*
@author: Zachary
@creation_date: 3/18/26
@last_updated: 3/18/26
@description: This is used to generate a list of all the clothing that belongs to a particular user.
*/
app.get('/user/:userID/clothing', async (req, res) => {
    try{
        const { userID } = req.params;

        const shirts = await db.manyOrNone(
            `SELECT * FROM "Item" WHERE "Owner" = $1;`,
            [userID]
        );

        res.status(200).json({ success: true, shirts });
    }
    catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/*
@author: Zachary
@creation_date: 3/18/26
@last_updated: 3/18/26
@description: This is used to generate a list of all the shirts that belongs to a particular user.
*/
app.get('/user/:userID/shirts', async (req, res) => {
    try{
        const { userID } = req.params;

        const shirts = await db.manyOrNone(
            `SELECT * FROM "Item" WHERE "Owner" = $1 AND "Type" = 'Shirt';`,
            [userID]
        );

        res.status(200).json({ success: true, shirts });
    }
    catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/*
@author: Zachary
@creation_date: 3/18/26
@last_updated: 3/18/26
@description: This is used to generate a list of all the pants that belongs to a particular user.
*/
app.get('/user/:userID/pants', async (req, res) => {
    try{
        const { userID } = req.params;

        const pants = await db.manyOrNone(
            `SELECT * FROM "Item" WHERE "Owner" = $1 AND "Type" = 'Pants';`,
            [userID]
        );

        res.status(200).json({ success: true, pants });
    }
    catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/*
@author: Zachary
@creation_date: 3/18/26
@last_updated: 3/18/26
@description: This is used to generate a list of all the shoes that belongs to a particular user.
*/
app.get('/user/:userID/shoes', async (req, res) => {
    try{
        const { userID } = req.params;

        const pants = await db.manyOrNone(
            `SELECT * FROM "Item" WHERE "Owner" = $1 AND "Type" = 'Shoes';`,
            [userID]
        );

        res.status(200).json({ success: true, pants });
    }
    catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/*
@author: Zachary
@creation_date: 3/18/26
@last_updated: 3/18/26
@description: This is used to generate a list of all the shoes that belongs to a particular user.
*/
app.get('/user/:userID/outerwear', async (req, res) => {
    try{
        const { userID } = req.params;

        const pants = await db.manyOrNone(
            `SELECT * FROM "Item" WHERE "Owner" = $1 AND "Type" = 'Outerwear';`,
            [userID]
        );

        res.status(200).json({ success: true, pants });
    }
    catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/*
@author: Zachary
@creation_date: 3/18/26
@last_updated: 3/18/26
@description: This is used to generate a list of all the shoes that belongs to a particular user.
*/
app.get('/user/:userID/accessories', async (req, res) => {
    try{
        const { userID } = req.params;

        const pants = await db.manyOrNone(
            `SELECT * FROM "Item" WHERE "Owner" = $1 AND "Type" = 'Accessory';`,
            [userID]
        );

        res.status(200).json({ success: true, pants });
    }
    catch (error) {
        console.error('ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

////////////////////////////////////////////////////// Routes used to fetch items owned by a user /////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});