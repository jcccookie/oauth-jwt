const dotenv = require('dotenv');
dotenv.config();
const url = process.env.APP_URL;

exports.boatResponse = ({ id, name, type, length, owner, public }) => {
  return {
    id,
    name,
    type,
    length,
    owner,
    public,
    self: `${url}/boats/${id}`
  }
};

exports.throwError = ({ code, message }) => {
  const error = new Error(message);
  error.statusCode = code;

  throw error;
};

exports.verifyAccept = ({ req, type }) => {
  if (!req.accepts(type)) {
    throw this.throwError({
      code: 406,
      message: `Server only sends ${type} data`
    })
  }
};

exports.verifyContentType = ({ req, type }) => {
  if (!req.is(type)) {
    throw this.throwError({
      code: 415,
      message: `Server only accepts ${type} data`
    })
  }
  return;
};

exports.checkNumOfAttribute = ({ req, length, action }) => {
  switch (action) {
    case 'ne':
      if (Object.keys(req.body).length !== length) {
        throw this.throwError({
          code: 400,
          message: "The number of attributes is invalid"
        })
      }
      break;
    case 'gt':
      if (Object.keys(req.body).length > length) {
        throw this.throwError({
          code: 400,
          message: "The number of attributes is invalid"
        })
      }
      break;
    case 'lt':
      if (Object.keys(req.body).length < length) {
        throw this.throwError({
          code: 400,
          message: "The number of attributes is invalid"
        })
      }
      break;
    default:
      console.log("Something's gone wrong");
  }
};

exports.checkProperty = ({ req }) => {
  const properties = ["name", "type", "length"];

  for (const property in req.body) {
    const hasProperty = properties.includes(property);

    if (!hasProperty) {
      throw this.throwError({
        code: 400,
        message: `This property (${property}) is not allowed in a boat`
      })
    } 
  }
};

exports.hasId = ({ id }) => {
  if (id) {
    throw this.throwError({
      code: 400,
      message: "ID is not allowed to update"
    })
  }
};

exports.isUnique = ({ entities, value, attribute }) => {
  entities.forEach(entity => {
    if (entity[attribute] === value) {
      throw this.throwError({
        code: 403,
        message: "The name of boat is already existed"
      })
    }
  })
};

const lengthRegexp = ({ length }) => {
  // Test length
  // Integer
  // Length is between 1 and 200
  const regExp = /^([1-9][0-9]?|[1][0-9][0-9]|200)$/;
  
  return regExp.test(length);
};

const nameRegexp = ({ name }) => {
  // Test name
  // Length of name is less than 20
  // No symbols except space
  name = name.replace(/\s{2,}/g, ' ');
  const regExp = /^[a-zA-Z0-9 ]{1,20}$/;

  return regExp.test(name);
};

const typeRegexp = ({ type }) => {
  // Test type
  // Length of type is less than 10
  // No symbols except space
  // No numbers
  type = type.replace(/\s{2,}/g, ' ');
  const regExp = /^[a-zA-Z ]{1,10}$/;

  return regExp.test(type);
}

exports.validateData = ({ req }) => {
  let message = "Boat information is invalid in the following attribute: ";
  let properties = [];

  const isLengthValid = lengthRegexp({ length: req.body.length });
  if (!isLengthValid) {
    properties.push("Length");
  }

  const isNameValid = nameRegexp({ name: req.body.name });
  if (!isNameValid) {
    properties.push("Name");
  }

  const isTypeValid = typeRegexp({ type: req.body.type });
  if (!isTypeValid) {
    properties.push("Type");
  }

  if (properties.length > 0) {
    throw this.throwError({
      code: 400,
      message: message + properties.join(", ")
    });
  } else {
    return;
  }
};