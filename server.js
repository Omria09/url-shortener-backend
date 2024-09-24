const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const mongoURI = process.env.MONGO_URI;

console.log('MongoDB URI:', mongoURI);

const app = express();

app.use(cors());
app.use(bodyParser.json());

// DB connection
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
const urlRoutes = require('./routes/url');
app.use('/api', urlRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
