const express = require('express');
const proxy = require('express-http-proxy');
const {URLSearchParams} = require('url');
const cors = require('cors');

function extractUrlParameters(urlString) {
  const parsedUrl = new URLSearchParams(urlString);
  const params = Object.fromEntries(parsedUrl.entries());
  return params;
}

function extractListingInfo(obj, n) {
  const listing = obj.listing;
  const url = obj.link;
  const images = obj.allPhotos && Array.isArray(obj.allPhotos) ? obj.allPhotos.slice(0, n).map(photo => photo.desktop) : undefined;
  const price = obj.displayRent;
  const billsIncluded = obj.displayBills && obj.displayBills !== "" ? true : false;
  const bedrooms = listing.number_bedrooms;
  const bathrooms = listing.number_bathrooms;
  const occupants = listing.number_occupants;
  const address = obj.displayAddress;
  const rooms = obj.listingSummary;
  const description = obj.subhead + ' ' + obj.description;

  return {
    url,
    ...(images && images.length > 0 && { images }),
    price,
    billsIncluded,
    bedrooms,
    bathrooms,
    occupants,
    address,
    rooms,
    description,
  };
}

function createSearchObject(
  locations,
  bathroomType,
  furnishings,
  parking,
  gender,
  lengthOfStay,
  allFemale,
  lgbtFriendly,
  retirees,
  students,
  smokers,
  backpackers,
  children,
  over40,
  pets,
  numberOfRooms,
  room,
  dateAvailable,
  minBudget,
  maxBudget,
  billsIncluded,
  keywordInput,
  wholeProperties,
  studios,
  oneBeds,
  grannyFlats,
  studentAccommodation,
  homestays,
  shareHouses
) {
  const preferences = [];
  if (lgbtFriendly) preferences.push("lgbt-friendly");
  if (retirees) preferences.push("retirees");
  if (students) preferences.push("students");
  if (smokers) preferences.push("smokers");
  if (backpackers) preferences.push("backpackers");
  if (children) preferences.push("children");
  if (over40) preferences.push("over-40");
  if (pets) preferences.push("pets");

  const searchObject = {
    search: {
      mode: "rooms",
      locations: [locations],
      bathroom_type: bathroomType,
      furnishings,
      parking,
      gender,
      all_female: allFemale,
      length_of_stay: lengthOfStay,
      preferences: preferences,
      number_of_rooms: numberOfRooms,
      room,
      date_available: dateAvailable,
      min_budget: minBudget,
      max_budget: maxBudget,
      bills_included: billsIncluded,
      keyword_input: keywordInput,
      "whole-properties": wholeProperties,
      studios,
      "1-beds": oneBeds,
      "granny-flats": grannyFlats,
      "student-accommodation": studentAccommodation,
      homestays,
      "share-houses": shareHouses
    },
  };

  return JSON.stringify(searchObject);
}

var imgParam = 2;
var descParam = 200;

const app = express();
app.use(cors());
app.use(express.static('public'));

app.use((req, res, next) => {
  const params = new URLSearchParams(req.url.replace('/?',''));
  if(params.get('images')){
    imgParam = parseInt(params.get('images'));
  }
  if(params.get('descriptionLength')){
    descParam = parseInt(params.get('descriptionLength'));
  }
  next();
});

app.use('/', proxy('https://flatmates.com.au', {
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    proxyReqOpts.headers["Accept"] = "application/json";
    proxyReqOpts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    proxyReqOpts.headers["Origin"] = "https://flatmates.com.au";
    proxyReqOpts.headers["Referer"] = "https://flatmates.com.au";
    proxyReqOpts.method = 'POST';
    const params = extractUrlParameters(srcReq.url.replace('/?',''));
    const paramObject = createSearchObject(
      params.locations,
	  params.bathroomType,
	  params.furnishings,
	  params.parking,
	  params.gender,
	  params.lengthOfStay,
	  params.allFemale,
	  params.lgbtFriendly,
	  params.retirees,
	  params.students,
	  params.smokers,
	  params.backpackers,
	  params.children,
	  params.over40,
	  params.pets,
	  params.numberOfRooms,
	  params.room,
	  params.dateAvailable,
	  params.minBudget,
	  params.maxBudget,
	  params.billsIncluded,
	  params.keywordInput,
	  params.wholeProperties,
	  params.studios,
	  params.oneBeds,
	  params.grannyFlats,
	  params.studentAccommodation,
	  params.homestays,
	  params.shareHouses
	);
    proxyReqOpts.json = JSON.stringify(paramObject);
	console.log(JSON.stringify(paramObject));
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    const data = JSON.parse(proxyResData.toString("utf8"));
    if (data.listings) {
      let trimmedData = {
        nextPage: data.nextPage,
        listings: []
      };
	  for (const id in data.listings) {
		let listingInfo = extractListingInfo(data.listings[id], imgParam);
	    if (descParam) {
		  if(descParam > 0){
			listingInfo.description = listingInfo.description.slice(0, descParam);
		  }
		}
		else{
			delete listingInfo.description;
		}
        trimmedData.listings.push(listingInfo);
	  }
      return JSON.stringify(trimmedData);
    }
	else {
      return proxyResData;
    }
  }
}));

const server = app.listen(443);