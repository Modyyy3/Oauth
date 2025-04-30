const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

let userSession = {
    provider: null,
    access_token: null
};

// --- GitHub OAuth ---
app.get('/auth/github', (req, res) => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&scope=user&prompt=consent`;
    res.redirect(githubAuthUrl);
});

app.get('/auth/github/callback', async (req, res) => {
    const code = req.query.code;
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    
    try {
        const response = await axios.post(tokenUrl, {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code,
            redirect_uri: process.env.GITHUB_CALLBACK_URL
        }, {
            headers: { Accept: 'application/json' }
        });

        userSession = {
            provider: 'GitHub',
            access_token: response.data.access_token
        };

        res.redirect('/?login=success');
    } catch (error) {
        console.error(error);
        res.send('Error during GitHub OAuth');
    }
});

// --- Google OAuth ---
app.get('/auth/google', (req, res) => {
    console.log('>>> HIT /auth/google');    // <<–– our debug print
    const googleAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth'
      + `?client_id=${process.env.GOOGLE_CLIENT_ID}`
      + `&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}`
      + `&response_type=code`
      + `&scope=email%20profile`
      + `&prompt=consent`;
    res.redirect(googleAuthUrl);
  });

app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    try {
        const response = await axios.post(tokenUrl, {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.GOOGLE_CALLBACK_URL
        });

        userSession = {
            provider: 'Google',
            access_token: response.data.access_token
        };

        res.redirect('/?login=success');
    } catch (error) {
        console.error(error);
        res.send('Error during Google OAuth');
    }
});
// --- Logout ---
app.get('/logout', (req, res) => {
    userSession = {
        provider: null,
        access_token: null
    };
    res.redirect('/');
});

// --- API to check session ---
app.get('/session', (req, res) => {
    res.json(userSession);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
