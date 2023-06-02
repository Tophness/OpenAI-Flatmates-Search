const express = require('express');
const proxy = require('express-http-proxy');
const {URLSearchParams} = require('url');

function extractUrlParameters(urlString) {
  const parsedUrl = new URLSearchParams(urlString);
  const params = Object.fromEntries(parsedUrl.entries());
  return params;
}

const app = express();
app.use(express.static('public'));
app.use('/', proxy('https://flatmates.com.au', {
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    proxyReqOpts.headers["Access-Control-Allow-Origin"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Methods"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Headers"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Credentials"] = "true";
    proxyReqOpts.headers["Accept"] = "application/json";
    proxyReqOpts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    proxyReqOpts.headers["Origin"] = "https://flatmates.com.au";
    proxyReqOpts.headers["Referer"] = "https://flatmates.com.au";
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
      return proxyResData.toString('utf8');
  }
}));

const server = app.listen(443);