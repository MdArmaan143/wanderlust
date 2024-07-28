const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");




main()
.then(() => {console.log("connected to db");})

.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');

}
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

// app.get("/testListing",async (req,res) =>{
//     let sampleListing = new Listing({
//         title: "my new villa",
//         description: "By the beach",
//         price: 1200,
//         location: "new delhi",
//         country: "india",

//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("succesful testing");


// });

// index route


app.get("/listings",async (req,res)=>{
  const allListings = await  Listing.find({});
  res.render("listings/index.ejs",{allListings});

});
// New route
app.get("/listings/new",(req,res)=>{
  res.render("listings/new.ejs");

});



//show route

app.get("/listings/:id", async (req,res) =>{
    let {id} = req.params ;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
});
//create
app.post("/listings",async (req,res)=>{
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");

});

//edit route
app.get("/listings/:id/edit",async (req,res)=>{
  let {id} = req.params ;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs",{listing});

});

//update route
app.put("/listings/:id",async (req,res)=>{
  let {id} = req.params ;
  await Listing.findByIdAndUpdate(id,{ ...req.body.listing});
  res.redirect(`/listings/${id}`);

});

//Delete route
app.delete("/listings/:id",async (req,res)=>{
  let  {id} = req.params ;
 const deleteListing =  await Listing.findByIdAndDelete(id);
 res.redirect("/listings");
});

let port = 8080;


app.get("/",(req,res)=>{
    res.send("hi,i am root");
});

app.listen(port,()=>{
    console.log(`server is listning to port : ${port} `);
});