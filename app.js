const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");


main()
.then(() => {console.log("connected to db");})

.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');

}

app.get("/testListing",async (req,res) =>{
    let sampleListing = new Listing({
        title: "my new villa",
        description: "By the beach",
        price: 1200,
        location: "new delhi",
        country: "india",

    });
    await sampleListing.save();
    console.log("sample was saved");
    res.send("succesful testing");


});



let port = 8080;


app.get("/",(req,res)=>{
    console.log("hi,i am root");
});

app.listen(port,()=>{
    console.log(`server is listning to port : ${port} `);
});