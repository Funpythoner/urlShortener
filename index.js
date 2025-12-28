const express = require('express');
const path = require('path');
require('dotenv').config()
const postgres = require('postgres')
const sql = postgres(process.env.DATABASE_URL)
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'))
})
app.get('/urls',async(req,res)=>{
    try{
        const urls = await sql`SELECT * FROM urls ORDER BY created_at DESC;`;
        res.json(urls);
    }
    catch(error){
        console.error("Error: "+error)
        res.status(500).json({error:'Internal server error occurred'})
    }
});
app.get('/:shortcode',async (req,res)=>{
    try{
        const {shortcode} = req.params;
        const result = await sql`SELECT fullurl FROM urls WHERE shorturl=${shortcode}`; 
        if (result.length==0){
            return res.status(404).send('Not Found');
        }
        res.redirect(result[0].fullurl);
    } catch(error){
         console.error("Error: "+error)
        res.status(500).json({error:'Internal server error occurred'})
    }
})
const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`Server started on port ${port}`)
})