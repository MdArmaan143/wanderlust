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


const listings = require("./routes/listing.js");




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



const validateReview = (req,res,next)=>{
  let {error} = reviewSchema.validate(req.body);
  
  if(error){
    let errMsg = error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
};

app.use("/listings",listings)

//post reviews route
app.post("/listings/:id/reviews",validateReview,wrapAsync(async(req,res)=>{
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review (req.body.review);
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  res.redirect(`/listings/${listing._id}`);

}));
//delete review route
app.delete("/listings/:id/reviews/:reviewId",wrapAsync(async(req,res) =>{
  let {id,reviewId} = req.params;
await Listing.findByIdAndUpdate(id, {$pull: {review: reviewId }});
    await Review.findByIdAndDelete(reviewId);
  res.redirect(`/listings/ ${id}`);

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