const { Router } = require('express');
const { ds, getEntityId } = require('../datastore');
const { BOAT } = require('../datastoreConfig');

const { throwError, boatResponse } = require('./helpers');

const router = new Router();
const datastore = ds();

router.get('/:owner_id/boats', async (req, res, next) => {
  try {
    // Get all boats for the specified owner_id regardless of JWT is valid or missing
    // Need to match owner_id and public=true
    // Zero boat also returns status code 201
    const ownerId = req.params.owner_id;

    // If no such owner exists
    // If owner doesn't have public boat => status 201

    // Match owner id and public true
    const query = datastore
      .createQuery(BOAT)
      .filter('owner', '=', ownerId)
      .filter('public', '=', true);

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
  } catch(error) {
    next(error);
  }
});



module.exports = router;