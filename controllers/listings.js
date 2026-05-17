const Listing = require("../models/listing");
const mbxGeoCoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geoCodingClient = mbxGeoCoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
  const { q, category, minPrice, maxPrice, country } = req.query;

  // Build MongoDB query
  let query = {};

  if (q && q.trim() !== "") {
    const regex = new RegExp(q.trim(), "i");
    query.$or = [
      { title: regex },
      { location: regex },
      { country: regex },
      { description: regex },
    ];
  }

  if (category && category.trim() !== "") {
    query.category = category.trim();
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (country && country.trim() !== "") {
    query.country = new RegExp(country.trim(), "i");
  }

  const allListings = await Listing.find(query);

  // Get distinct countries for the filter dropdown
  const allCountries = await Listing.distinct("country");

  res.render("listings/index.ejs", {
    allListings,
    searchQuery: q || "",
    selectedCategory: category || "",
    selectedCountry: country || "",
    minPrice: minPrice || "",
    maxPrice: maxPrice || "",
    allCountries,
    resultCount: allListings.length,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you request for does not exist!");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.creatListing = async (req, res, next) => {
  let response = await geoCodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = response.body.features[0].geometry;
  let saveListing = await newListing.save();
  console.log(saveListing);
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you request for does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let response = await geoCodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  listing.geometry = response.body.features[0].geometry;
  await listing.save();

  if (typeof req.file != "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deleteListing = await Listing.findByIdAndDelete(id);
  req.flash("success", " Listing Deleted!");
  res.redirect("/listings");
};