const waitport = require('wait-port');
const { Client } = require('@opensearch-project/opensearch');
const debug = require('debug');

const logger = debug('api');
const error = debug('error');

const ES_INDEX_NAME = process.env.ES_INDEX_NAME || 'addressr';
const ELASTIC_PORT = Number.parseInt(process.env.ELASTIC_PORT || '9200');
const ELASTIC_HOST = process.env.ELASTIC_HOST || '127.0.0.1';
const ELASTIC_USERNAME = process.env.ELASTIC_USERNAME || undefined;
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD || undefined;
const ELASTIC_PROTOCOL = process.env.ELASTIC_PROTOCOL || 'http';

async function dropIndex(esClient) {
  let exists = await esClient.indices.exists({ index: ES_INDEX_NAME });
  if (exists.body) {
    const deleteIndexResult = await esClient.indices.delete({ index: ES_INDEX_NAME });
    logger({ deleteIndexResult });
  }
  logger('checking if index exists');
  exists = await esClient.indices.exists({ index: ES_INDEX_NAME });
  logger('index exists:', exists);
}

async function initIndex(esClient, clear, synonyms) {
  if (clear) {
    await dropIndex(esClient);
  }

  logger('checking if index exists');
  const exists = await esClient.indices.exists({ index: ES_INDEX_NAME });
  logger('index exists:', exists.body);

  const indexBody = {
    settings: {
      index: {
        analysis: {
          filter: {
            my_synonym_filter: {
              type: 'synonym',
              lenient: true,
              synonyms
            },
            comma_stripper: {
              type: 'pattern_replace',
              pattern: ',',
              replacement: ''
            }
          },
          analyzer: {
            my_analyzer: {
              tokenizer: 'whitecomma',
              filter: [
                'uppercase',
                'asciifolding',
                'my_synonym_filter',
                'comma_stripper',
                'trim'
              ]
            }
          },
          tokenizer: {
            whitecomma: {
              type: 'pattern',
              pattern: '[\\W,]+',
              lowercase: false
            }
          }
        }
      }
    },
    aliases: {},
    mappings: {
      properties: {
        structured: {
          type: 'object',
          enabled: false
        },
        sla: {
          type: 'text',
          analyzer: 'my_analyzer',
          fields: {
            raw: {
              type: 'keyword'
            }
          }
        },
        ssla: {
          type: 'text',
          analyzer: 'my_analyzer',
          fields: {
            raw: {
              type: 'keyword'
            }
          }
        },
        confidence: { type: 'integer' }
      }
    }
  };

  if (!exists.body) {
    logger(`creating index: ${ES_INDEX_NAME}`);
    const indexCreateResult = await esClient.indices.create({
      index: ES_INDEX_NAME,
      body: indexBody
    });
    logger({ indexCreateResult });
  } else {
    const indexCloseResult = await esClient.indices.close({ index: ES_INDEX_NAME });
    logger({ indexCloseResult });

    const indexPutSettingsResult = await esClient.indices.putSettings({
      index: ES_INDEX_NAME,
      body: indexBody
    });
    logger({ indexPutSettingsResult });

    const indexPutMappingResult = await esClient.indices.putMapping({
      index: ES_INDEX_NAME,
      body: indexBody.mappings
    });
    logger({ indexPutMappingResult });

    const indexOpenResult = await esClient.indices.open({ index: ES_INDEX_NAME });
    logger({ indexOpenResult });

    const refreshResult = await esClient.indices.refresh({ index: ES_INDEX_NAME });
    logger({ refreshResult });
  }

  const indexGetResult = await esClient.indices.get({
    index: ES_INDEX_NAME,
    includeDefaults: true
  });

  logger(`indexGetResult:\n${JSON.stringify(indexGetResult, undefined, 2)}`);
}

async function esConnect(
  esport = ELASTIC_PORT,
  eshost = ELASTIC_HOST,
  interval = 1000,
  timeout = 0
) {
  while (true) {
    logger(`trying to reach elastic search on ${eshost}:${esport}...`);
    try {
      const open = await waitport({ host: eshost, port: esport, interval, timeout });

      if (open) {
        logger(`...${eshost}:${esport} is reachable`);

        while (true) {
          try {
            const node = ELASTIC_USERNAME
              ? `${ELASTIC_PROTOCOL}://${ELASTIC_USERNAME}:${ELASTIC_PASSWORD}@${eshost}:${esport}`
              : `${ELASTIC_PROTOCOL}://${eshost}:${esport}`;

            const esClient = new Client({ node });

            logger(`connecting elastic search client on ${eshost}:${esport}...`);
            await esClient.ping();
            logger(`...connected to ${eshost}:${esport}`);
            global.esClient = esClient;
            return esClient;
          } catch (error_) {
            error(
              `An error occurred while trying to connect the elastic search client on ${eshost}:${esport}`,
              error_
            );
            await new Promise(resolve => setTimeout(resolve, interval));
            logger('retrying...');
          }
        }
      }
    } catch (error_) {
      error(
        `An error occurred while waiting to reach elastic search on ${eshost}:${esport}`,
        error_
      );
      await new Promise(resolve => setTimeout(resolve, interval));
      logger('retrying...');
    }
  }
}

module.exports = {
  esConnect,
  dropIndex,
  initIndex
};