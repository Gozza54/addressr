// const debug = require('debug');
const { getApiRoot: _getApiRoot } = require('../service/DefaultService');
const { writeJson } = require('../utils/writer.js');
// const logger = debug('api');

function getApiRoot(request, res) {
  _getApiRoot()
    .then(function (response) {
      res.setHeader('link', response.link.toString());
      res.setHeader('link-template', response.linkTemplate.toString());
      writeJson(res, response.body);
    })
    .catch(function (error) {
      writeJson(res, error.body);
    });
}

module.exports = {
  getApiRoot
};
