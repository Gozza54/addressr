const debug = require('debug');
const {
  getAddress: _getAddress,
  getAddresses: _getAddresses,
} = require('../service/address-service.js'); // ✅ fixed missing parenthesis
const { writeJson } = require('../utils/writer.js');

const logger = debug('api');

function getAddress(request, response) {
  logger('IN getAddress');
  const addressId = request.swagger.params['addressId'].value;
  _getAddress(addressId).then(function (addressResponse) {
    if (addressResponse.statusCode) {
      response.setHeader('Content-Type', 'application/json');
      response.status(addressResponse.statusCode);
      response.json(addressResponse.json);
    } else {
      response.setHeader('link', addressResponse.link.toString());
      writeJson(response, addressResponse.json);
    }
    return;
  });
}

function getAddresses(request, response) {
  const q = request.swagger.params['q'].value;
  const p = request.swagger.params['p'].value;
  const url = new URL(
    request.url,
    `http://localhost:${process.env.port || 8080}`
  );

  _getAddresses(url.pathname, request.swagger, q, p).then(function (
    addressesResponse
  ) {
    if (addressesResponse.statusCode) {
      response.setHeader('Content-Type', 'application/json');
      response.status(addressesResponse.statusCode);
      response.json(addressesResponse.json);
    } else {
      response.setHeader('link', addressesResponse.link.toString());
      response.setHeader(
        'link-template',
        addressesResponse.linkTemplate.toString()
      );
      writeJson(response, addressesResponse.json);
    }
    return;
  });
}

// ✅ Export CommonJS style
module.exports = {
  getAddress,
  getAddresses,
};
