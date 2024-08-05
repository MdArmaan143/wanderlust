const mongoose = require("mongoose");
const schema = mongoose.Schema;


const listingSchema = new schema ({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        type: String,
        default: "https://i.pinimg.com/originals/64/1f/29/641f29d2d22a6bd7ec74cb9be185b637.jpg",
        set: (v) => v ===""?"https://i.pinimg.com/originals/64/1f/29/641f29d2d22a6bd7ec74cb9be185b637.jpg":v,
    },
    price:Number,
    location: String,
    country: String,
    reviews: [
        {
            type: schema.Types.ObjectId,
            ref: "Review",
        },
    ],

});

const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;
