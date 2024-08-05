const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema,reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");





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


const validateListing = (req,res,next)=>{
  let {error} = listingSchema.validate(req.body);
  
  if(error){
    let errMsg = error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
};

const validateReview = (req,res,next)=>{
  let {error} = reviewSchema.validate(req.body);
  
  if(error){
    let errMsg = error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
};

// index route


app.get("/listings",wrapAsync(async (req,res)=>{
  const allListings = await  Listing.find({});
  res.render("listings/index.ejs",{allListings});

}));
// New route
app.get("/listings/new",(req,res)=>{
  res.render("listings/new.ejs");

});



//show route

app.get("/listings/:id", wrapAsync(async (req,res) =>{
    let {id} = req.params ;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
}));
//create route
app.post("/listings",validateListing,wrapAsync(async (req,res,next)=>{
  
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  
  

}));

//edit route
app.get("/listings/:id/edit",wrapAsync(async (req,res)=>{
  let {id} = req.params ;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs",{listing});

}));

//update route
app.put("/listings/:id",validateListing,wrapAsync(async (req,res)=>{
  let {id} = req.params ;
  if(!req.body.listing){
    throw new ExpressError(400,"Send Valid data for listing");
  }
  await Listing.findByIdAndUpdate(id,{ ...req.body.listing});
  res.redirect(`/listings/${id}`);

}));

//Delete route
app.delete("/listings/:id",wrapAsync(async (req,res)=>{
  let  {id} = req.params ;
 const deleteListing =  await Listing.findByIdAndDelete(id);
 res.redirect("/listings");
}));

//reviews
//post route
app.post("/listings/:id/reviews",validateReview,wrapAsync(async(req,res)=>{
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review (req.body.review);
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  res.redirect(`/listings/${listing._id}`);

}));

let port = 8080;


app.get("/",(req,res)=>{
    res.send("hi,i am root");
});

app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"Page Not Found!"));
});

app.use((err,req,res,next)=>{
  let {statusCode = 500,message = "Somthing went wrong!"} = err;
 
   res.status(statusCode).render("error.ejs",{err});
  
});

app.listen(port,()=>{
    console.log(`server is listning to port : ${port} `);
});