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
  var { originalUrl } = req.body;
  originalUrl = validateAndEncapsulateUrl(originalUrl);
  if (!originalUrl) {
    res.status(400).json({ error: 'Invalid URL.' });
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


function validateAndEncapsulateUrl(inputUrl) {
  // Check if URL is valid
  if (!inputUrl.includes('.'))
  {
    return null;
  }

  // Check if URL contains spaces
  if (inputUrl.includes(' ')) {
    return null;
  }  

  try {
      // Create a new URL object to validate the URL
      const url = new URL(inputUrl);
      
      // Check if the protocol is HTTPS
      if (url.protocol !== 'https:') {
          throw new Error('Invalid protocol');
      }
      
      // Return the valid URL
      return url.href;
  } catch (error) {
      // If the input is invalid, make it valid
      var sanitizedUrl = `https://www.${inputUrl.replace(/^(https?:\/\/)?(www\.)?/, '')}`;
      //recursion for the fun
      if (sanitizedUrl.includes('link.ktzr.lol'))
      {
        sanitizedUrl = sanitizedUrl.replace('www.',''); 
      }
      return sanitizedUrl;
  }
}

module.exports = router;
