const express = require('express');
const proxy = require('express-http-proxy');
const {URLSearchParams} = require('url');
const cors = require('cors');

function extractUrlParameters(urlString) {
  const parsedUrl = new URLSearchParams(urlString);
  const params = Object.fromEntries(parsedUrl.entries());
  return params;
}

function extractFlatmatesListingInfo(obj, n) {
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
  let description = '';
  if (descParam > 0) {
    description = obj.subhead + ' ' + obj.description;
    if (description.length > descParam) {
      description = description.slice(0, descParam);
    }
  }

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
    ...(description && { description }),
  };
}

function generateFlatmatesURL(baseUrl,locations,bathroomType,furnishings,parking,gender,lengthOfStay,allFemale,lgbtFriendly,retirees,students,smokers,backpackers,children,over40,pets,numberOfRooms,room,dateAvailable,minBudget,maxBudget,billsIncluded,keywordInput,wholeProperties,studios,oneBeds,grannyFlats,studentAccommodation,homestays,shareHouses) {
  let url = baseUrl + locations + "/";
  
  if (numberOfRooms > 1) {
    url += numberOfRooms + "-rooms+";
  }
  
  if (allFemale) {
    url += "all-female+";
  }
  
  if (lengthOfStay) {
    url += lengthOfStay.replace(" ", "-") + "+";
  }
  
  if (backpackers) {
    url += "backpackers+";
  }
  
  if (children) {
    url += "children+";
  }
  
  if (lgbtFriendly) {
    url += "lgbt-friendly+";
  }
  
  if (over40) {
    url += "over-40+";
  }
  
  if (pets) {
    url += "pets+";
  }
  
  if (retirees) {
    url += "retirees+";
  }
  
  if (smokers) {
    url += "smokers+";
  }
  
  if (students) {
    url += "students+";
  }
  
  if (billsIncluded) {
    url += "bills-included+";
  }
  
  if (furnishings) {
    url += furnishings + "+";
  }
  
  if (bathroomType) {
    url += bathroomType + "+";
  }
  
  if (keywordInput) {
    url += "keywords-" + keywordInput.replace(" ", "-") + "+";
  }
  
  if (gender) {
    url += gender + "+";
  }
  
  if (parking) {
    url += parking + "+";
  }
  
  if (room) {
    url += room + "+";
  }
  
  if (shareHouses) {
    url += "share-houses+";
  }
  
  if (dateAvailable) {
    url += "available-" + dateAvailable + "+";
  }
  
  if (minBudget){
    url += "min-" + minBudget + "+";
  }
  
  if (maxBudget) {
    url += "max-" + maxBudget + "+";
  }
  
  if (wholeProperties) {
    url += "whole-properties+";
  }
  
  if (studios) {
    url += "studios+";
  }
  
  if (oneBeds) {
    url += "one-beds+";
  }
  
  if (grannyFlats) {
    url += "granny-flats+";
  }
  
  if (studentAccommodation) {
    url += "student-accommodation+";
  }
  
  if (homestays) {
    url += "homestays+";
  }
  
  if (room) {
    url += room + "+";
  }
  if(url.endsWith('+')){
    url.slice(0, -1);
  }
  url += "?search_source=search_function";
  
  return url;
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
    const flatmatesURL = generateFlatmatesURL(
	  'https://flatmates.com.au/rooms/',
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
	srcReq.url = flatmatesURL;
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
		let listingInfo = extractFlatmatesListingInfo(data.listings[id], imgParam);
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