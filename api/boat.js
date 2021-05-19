const { Router } = require('express');
const { ds, getEntityId } = require('../datastore');
const { BOAT } = require('../datastoreConfig');
const { throwError, boatResponse } = require('./helpers');

const router = new Router();
const datastore = ds();

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

// Verify ID Token
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
  });

  const payload = ticket.getPayload();
  return payload;
}

// Get all public boats
const getPublicBoats = async () => {
  const query = datastore
    .createQuery(BOAT)
    .filter('public', '=', true);

  const [boats] = await datastore.runQuery(query);

  return boats.map(boat => {
    return boatResponse({
      id: getEntityId(boat),
      name: boat.name,
      type: boat.type,
      length: boat.length,
      owner: boat.owner,
      public: boat.public
    })
  });
};

// Check if jwt exists
const isJwtExist = () => {
  return (req, res, next) => {
    if (!req.headers.authorization) {
      res.status(401).send({
        Error: "Missing JWT"
      });
    } else {
      next();
    }
  };
};

// Check if jwt exists. 
const isJwtExistAndReturnPublic = () => {
  return async (req, res, next) => {
    if (!req.headers.authorization) {
      const boats = await getPublicBoats();

      res.status(200).send(boats);
    } else {
      next();
    }
  };
};

const isTokenValid = () => {
  return async (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const payload = await verify(token);
      req.payload = payload;

      next();
    } catch (error) {
      res.status(401).send({
        Error: "Invalid JWT"
      })
    }
  };
};

const isTokenValidAndReturnPublic = () => {
  return async (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const payload = await verify(token);
      req.payload = payload;

      next();
    } catch (error) {
      const boats = await getPublicBoats();

      res.status(200).send(boats);
    }
  };
};

// Create a boat
router.post('/', isJwtExist(), isTokenValid(), async (req, res, next) => {
  try {
    const { sub } = req.payload;

    // Create a boat
    const key = datastore.key(BOAT);
    const data = {
      ...req.body,
      owner: sub
    };

    const entity = { key, data };

    await datastore.save(entity);

    const boat = await datastore.get(key);
    const id = getEntityId(boat[0]);
    const { name, type, length, owner, public } = boat[0];

    res
      .status(201)
      .send(boatResponse({ id, name, type, length, owner, public }));
  } catch (error) {
    next(error);
  }
});

// Get boats
router.get('/', isJwtExistAndReturnPublic(), isTokenValidAndReturnPublic(), async (req, res, next) => {
  try {
    // if JWT is valid, return 200 and all boats for the specified owner
    const ownerId = req.payload.sub;

    // Match owner id
    const query = datastore
      .createQuery(BOAT)
      .filter('owner', '=', ownerId)

    const [boats] = await datastore.runQuery(query);

    const responseBoats = boats.map(boat => {
      return boatResponse({
        id: getEntityId(boat),
        name: boat.name,
        type: boat.type,
        length: boat.length,
        owner: boat.owner,
        public: boat.public
      })
    });

    res.status(200).send(responseBoats);
  } catch (error) {
    next(error);
  }
});

// Delete a boat
router.delete('/:boat_id', isJwtExist(), isTokenValid(), async (req, res, next) => {
  try {
    // Get loads to delete carrier info in load
    const boatKey = datastore.key([BOAT, parseInt(req.params.boat_id)]);
    const boatEntity = await datastore.get(boatKey);

    // Check if boat id is valid
    if (boatEntity[0] === undefined) {
      const error = new Error("Invalid Boat Id");
      error.statusCode = 403;

      throw error;
    }

    const { sub } = req.payload;
    // Check if the boat_id is owned by the user
    if (boatEntity[0].owner !== sub) {
      const error = new Error("This boat id is owned by someone else");
      error.statusCode = 403;

      throw error;
    }

    await datastore.delete(boatKey);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});


module.exports = router;