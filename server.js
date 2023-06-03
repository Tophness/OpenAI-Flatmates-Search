const express = require('express');
const proxy = require('express-http-proxy');
const {URLSearchParams} = require('url');

function extractUrlParameters(urlString) {
  const parsedUrl = new URLSearchParams(urlString);
  const params = Object.fromEntries(parsedUrl.entries());
  return params;
}

function extractListingInfo(obj, n) {
  const listing = obj.listing;
  const link = obj.link;
  const allPhotos = n > 0 ? obj['0'].allPhotos.slice(0, n).map(photo => photo.desktop) : [];
  const displayRent = obj.displayRent + ' ' + obj.displayBills;
  const { number_bedrooms, number_bathrooms, number_occupants } = listing;
  const displayAddress = obj.displayAddress;
  const listingSummary = obj.listingSummary;
  const subhead = obj.subhead + ' ' + obj.description;

  return {
    link,
    allPhotos,
    displayRent,
    number_bedrooms,
    number_bathrooms,
    number_occupants,
    displayAddress,
    listingSummary,
    subhead,
  };
}

var imgParam = 2;

const app = express();
app.use(express.static('public'));

app.use((req, res, next) => {
  const params = new URLSearchParams(req.url.replace('/?',''));
  if(params.get('images')){
    imgParam = parseInt(params.get('images'));
  }
  next();
});

app.use('/', proxy('https://flatmates.com.au', {
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    proxyReqOpts.headers["Accept"] = "application/json";
    proxyReqOpts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    proxyReqOpts.headers["Origin"] = "https://flatmates.com.au";
    proxyReqOpts.headers["Referer"] = "https://flatmates.com.au";
    proxyReqOpts.headers["Access-Control-Allow-Origin"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Methods"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Headers"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Credentials"] = "true";
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    const data = JSON.parse(proxyResData.toString("utf8"));
    if (data.listings) {
      let trimmedData = {
        nextPage: data.nextPage,
        listings: []
      };
	  for (const id in trimmedData) {
        trimmedData.listings.push(extractListingInfo(data.listings[id], imgParam));
	  }
      return JSON.stringify(trimmedData);
    }
	else {
      return proxyResData;
    }
  }
}));

const server = app.listen(443);