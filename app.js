const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");

const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");

const session = require("express-session");




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



const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires : Date.now() +  7*24*60*60*1000,
    maxAge:  7*24*60*60*1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));


app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);



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