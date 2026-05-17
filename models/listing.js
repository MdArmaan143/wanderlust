const mongoose = require("mongoose");
const schema = mongoose.Schema;
const Review = require("./review.js");
const { ref } = require("joi");


const CATEGORIES = ["Trending", "Rooms", "Iconic cities", "Mountains", "Castles", "Swimming pool", "Farm", "Camping", "Arctic", "Domes", "Boats"];

const listingSchema = new schema ({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
       url: String,
       filename: String
    },
    price:Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: CATEGORIES,
        default: "Trending",
    },
    reviews: [
        {
            type: schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner : {
        type : schema.Types.ObjectId,
        ref: "User",
    },
    geometry: {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
    }

});
listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id : {$in : listing.reviews}});
    }
    
});
const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;
