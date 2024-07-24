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
        default: "https://ai.nero.com/blog/wp-content/uploads/2022/07/Banner-02-1-1560x900.png",
        set: (v) => v ===""?"https://ai.nero.com/blog/wp-content/uploads/2022/07/Banner-02-1-1560x900.png":v,
    },
    price:Number,
    location: String,
    country: String

});

const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;