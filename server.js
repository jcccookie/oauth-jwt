const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.enable('trust proxy');
app.use(express.static(path.join(__dirname, "/views")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
dotenv.config();
app.use(cors());

const boatRouter = require('./api/boat');
const ownerRouter = require('./api/owner');
app.use('/boats', boatRouter);
app.use('/owners', ownerRouter);

app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '/views/index.html'));
  } catch (error) {
    next(error);
  }
});

// Get OAuth from google
app.get('/oauth', async (req, res, next) => {
  try {
    // Check if state from google server is matched to generated state from client
    if (req.query.state !== req.cookies.sid) {
      res.sendFile(path.join(__dirname, '/views/error.html'));
    } else {
      const options = {
        expire: Date.now() + 3600000,
        httpOnly: false,
        encode: String
      };
  
      res.cookie("state", req.query.state, options);
      res.cookie("code", req.query.code, options);
      
      res.sendFile(path.join(__dirname, '/views/info.html'));
    }
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).send({
    Error: err.message
  });
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});