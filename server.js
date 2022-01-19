import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import { Parser } from 'json2csv';
import path from 'path';
const app = express();
const convert = new Parser();
app.use(cors());
app.use(express.json());
/*
* TABLE Items (
    ItemID int PRIMARY KEY AUTO_INCREMENT,
    ItemName varchar(255),
    ItemCount int
)
*/
const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DBNAME
});

db.connect();

app.get('/export', (req, res) => {
    db.query('SELECT * FROM Items', (err, rows, fields) => {
        if(err) next(err);
        const csv = convert.parse(rows);
        res.header('Content-Type', 'text/csv');
        res.attachment("Inventory_List.csv");
        return res.send(csv);
    });
})

app.get('/items', (req, res) => {
    db.query('SELECT * FROM Items', (err, rows, fields) => {
        if(err) next(err);
        res.send(rows);
    });
});

app.post('/delete', (req, res) => {
    const { id } = req.body;
    if(!Number.isInteger(id) || parseInt(id) < 0){
        res.status(400);
        return res.send('Invalid input data');
        
    }
    db.query(`DELETE FROM Items WHERE ItemID = ?`, [id], (err) => {
        if (err) return res.status(500).send({error: err.message});
        res.sendStatus(200);
    });
});

/*
* Expects json with name and count values
*/
app.post('/create', (req, res) => {
    const data = req.body;
    console.log(data);
    if( !data['name'] || !data['count'] || !Number.isInteger(data['count']) || parseInt(data['count']) < 0){
        res.status(400);
        return res.send('Invalid input data');
    }   
    db.query(`INSERT INTO Items (ItemName, ItemCount) VALUES (?, ?)`, [data['name'], data['count']], (err, rows) => {
        if (err) return res.status(500).send({error: err.message})
        res.send(rows);
    });
});

/*
* Expects json with name,id and count values
*/
app.post('/edit', (req, res) => {
    const data = req.body;
    if( !data['name'] || !data['count'] || !Number.isInteger(data['count']) || parseInt(data['count']) < 0 || !Number.isInteger(data['id']) || parseInt(data['id']) < 0){
        res.status(400);
        return res.send('Invalid input data');
    }
    db.query(`UPDATE Items SET ItemName = ?, ItemCount = ? WHERE ItemID = ?`, [data['name'], data['count'], data['id']], (err) => {
        if (err) return res.status(500).send({error: err.message})
        res.sendStatus(200);
    });
});

app.use(express.static('build'))

app.listen(process.env.PORT, () =>
  console.log(`App listening on port ${process.env.PORT}!`),
);