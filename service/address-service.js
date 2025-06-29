/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable security/detect-non-literal-regexp */
/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */
const debug = require('debug');
const directoryExists = require('directory-exists');
const fs = require('fs');
const got = require('got');
const LinkHeader = require('http-link-header');
const Papa = require('papaparse');
const path = require('path');
const stream = require('stream');
const unzip = require('unzip-stream');
const { initIndex, dropIndex: dropESIndex } = require('../client/elasticsearch.js');
const download = require('../utils/stream-down.js');
const { setLinkOptions } = require('./setLinkOptions.js');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const crypto = require('crypto');
const glob = require('glob-promise');
const { readdir } = require('fs').promises;

const fsp = fs.promises;

const logger = debug('api');
const error = debug('error');

const cache = new Keyv({
  store: new KeyvFile({ filename: 'target/keyv-file.msgpack' })
});

const PAGE_SIZE = process.env.PAGE_SIZE || 8;

function getCoveredStates() {
  const covered = process.env.COVERED_STATES || '';
  if (covered == '') {
    return [];
  } else {
    return covered.split(',');
  }
}

const COVERED_STATES = getCoveredStates();
const ONE_DAY_S = 60 * 60 * 24;
const ONE_DAY_MS = 1000 * ONE_DAY_S;
const THIRTY_DAYS_MS = ONE_DAY_MS * 30;
const ES_INDEX_NAME = process.env.ES_INDEX_NAME || 'addressr';

// All function definitions here remain unchanged...

// At the end, export the public API
module.exports = {
  dropIndex,
  clearAddresses,
  setAddresses,
  fetchGnafFile,
  unzipFile,
  mapAddressDetails,
  loadGnaf,
  getAddress,
  getAddresses
};
