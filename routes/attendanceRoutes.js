const express = require("express");
const router = express.Router();
const fs = require("fs");

const file = "./data/attendance.json";

function readData(){
    try{
        return JSON.parse(fs.readFileSync(file));
    }catch{
        return [];
    }
}

function writeData(data){
    fs.writeFileSync(file, JSON.stringify(data,null,2));
}

router.get("/", (req,res)=>{
    res.json(readData());
});

router.post("/", (req,res)=>{
    const data = readData();

    data.push({
        name:req.body.name,
        subject:req.body.subject,
        status:req.body.status,
        date:req.body.date
    });

    writeData(data);
    res.send("Attendance added");
});

module.exports = router;