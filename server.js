/**
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();

app.use(cors());

const redirect_uri =
  process.env.REDIRECT_URI || 'http://localhost:8888/callback';

app.get('/login', function(req, res) {
  let scope = 'user-read-private user-read-email';
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: process.env.CLIENT_ID,
        scope: scope,
        redirect_uri: redirect_uri,
      })
  );
});

app.get('/callback', function(req, res) {
  const code = req.query.code || null;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization:
        'Basic ' +
        new Buffer(
          process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET
        ).toString('base64'),
    },
    json: true,
  };

  request.post(authOptions, function(error, response, body) {
    const uri = process.env.FRONTEND_URI || 'http://localhost:3000';
    const access_token = body.access_token,
      refresh_token = body.refresh_token;

    if (!error && response.statusCode === 200) {
      const options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { Authorization: 'Bearer ' + access_token },
        json: true,
      };

      res.redirect(
        uri +
          '?access_token=' +
          access_token +
          '&refresh_token=' +
          refresh_token
      );
    } else {
      res.redirect(
        uri +
          querystring.stringify({
            error: 'invalid_token',
          })
      );
    }
  });
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  const refresh_token = req.query.refresh_token;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization:
        'Basic ' +
        new Buffer(
          process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET
        ).toString('base64'),
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.send({
        access_token: access_token,
      });
    }
  });
});

// process.env.PORT lets the port be set by Heroku
let port = process.env.PORT || 8888;
console.log('Listening on ' + port);
app.listen(port);
