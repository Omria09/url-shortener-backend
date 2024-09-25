const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {encode} = require('./base62');
const host = 'https://url-shortener-production-a61e.up.railway.app/';
const fronted = 'https://main--willowy-sunshine-0aa9f4.netlify.app/';

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  date: {type: String, default: Date.now},
  clicks: { type: Number, default: 0 },
});

const Url = mongoose.model('Url', urlSchema);


router.delete('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    //check if URL exists.
    const url = await Url.findOne({ shortUrl });
    if (!url){
      return res.status(404).json({error: 'Short URL not found.'});
    }

    await Url.deleteOne({ shortUrl });
    res.status(200).json({message: 'Short URL deleted successfully.'});
  }catch(error){
    console.error('Error deleting URL:', error);
    res.status(500).json({message: 'An error occured while trying to delete the specified URL.'});
  }
});

// Create short URL
router.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  if (!originalUrl.includes('.'))
  {
    res.status(201).json({ error: 'Invalid URL.' });
    return;
  }
  const existingUrl = await Url.findOne({ originalUrl });

  if (existingUrl) {
    return res.json(existingUrl); // Return existing URL if it already exists
  }

  const newUrl = new Url({ originalUrl });
  await newUrl.save(); // Save the document first to get the _id

  // Convert ObjectId to a number
  const idAsNumber = newUrl._id.getTimestamp().getTime(); // Convert to timestamp to get a numeric value
  newUrl.shortUrl = encode(idAsNumber); // Encode the numeric value
  await newUrl.save(); // Save again with the short URL

  res.json(newUrl); // Respond with the complete URL object
});

router.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

// Get original URL
router.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const urlEntry = await Url.findOne({ shortUrl });

  if (urlEntry) {
    urlEntry.clicks++;
    await urlEntry.save();
    
    const referer = req.headers['referer']; // Get the referer header

    // Check if the request is from localhost
    if (referer && referer.startsWith('http://localhost')) {
      return res.redirect(urlEntry.originalUrl); // Redirect to the original URL
    } else {
      return res.json({ originalUrl: urlEntry.originalUrl }); // Return JSON response if not from localhost
    }
  } else {
    const userAgent = req.headers['user-agent'];
    // Check if the request is from a browser
    if (userAgent && userAgent.includes('Mozilla')) {
      return res.redirect(`${fronted}?message=Invalid URL.. URL expired or did not exist.`); // If browser, redirect to default page
    } else {
      return res.status(404).json({ error: 'Invalid URL.' }); // If not a browser, send error message (for Postman etc.)
    }
  }
});

module.exports = router;
