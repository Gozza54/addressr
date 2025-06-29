const debug = require('debug');
const { esConnect } = require('./client/elasticsearch.js');
const { printVersion } = require('./service/printVersion.js');
const { startServer } = require('./swagger.js');

const logger = debug('api');

startServer().then(() => {
  logger('connecting es client');
  const p1 = esConnect().then(esClient => {
    global.esClient = esClient;
    logger('es client connected');
  });

  p1.then(() => {
    console.log('=====================');
    console.log('Addressr - API Server');
    console.log('=====================');

    printVersion();
  });
});
