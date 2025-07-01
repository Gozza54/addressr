const debug = require('debug');
const express = require('express');
const { readFileSync } = require('fs');
const { createServer } = require('http');
const yaml = require('js-yaml');
const pathUtil = require('path');
const { initializeMiddleware } = require('swagger-tools');

const app = express();
const serverPort = process.env.PORT || 8080;
const logger = debug('api');
const error = debug('error');
error.log = console.error.bind(console);

// SwaggerRouter configuration
const options = {
  swaggerUi: pathUtil.join(__dirname, '/swagger.json'),
  controllers: pathUtil.join(__dirname, './controllers'),
  useStubs: process.env.NODE_ENV === 'development',
};

// Load and parse swagger.yaml
const spec = readFileSync(pathUtil.join(__dirname, 'api/swagger.yaml'), 'utf8');
const swaggerDoc = yaml.safeLoad(spec);
global.swaggerDoc = swaggerDoc;

function swaggerInit() {
  return new Promise((resolve) => {
    initializeMiddleware(swaggerDoc, function (middleware) {
      app.use(middleware.swaggerMetadata());

      app.use(
        middleware.swaggerValidator({
          validateResponse:
            !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
        })
      );

      app.use(middleware.swaggerRouter(options));
      app.use(middleware.swaggerUi());

      // Error handler
      app.use(function (err, req, res, next) {
        if (err.failedValidation) {
          const errorPayload = {
            message: err.message,
            errors: err.results?.errors || [],
            originalResponse: err.originalResponse
              ? JSON.parse(err.originalResponse)
              : undefined,
          };
          error('Validation Error:', JSON.stringify(errorPayload, null, 2));
          res
            .status(
              err.code === 'SCHEMA_VALIDATION_FAILED' ? 500 : 400
            )
            .json(errorPayload);
        } else {
          next();
        }
      });

      global.swaggerApp = app;
      global.swaggerMiddleware = middleware;
      resolve({ app, middleware });
    });
  });
}

let server;

async function startServer() {
  // CORS Headers
  a
