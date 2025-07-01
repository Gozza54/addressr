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
  useStubs: process.env.NODE_ENV === 'development'
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
            !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
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
            originalResponse: err.originalResponse ? JSON.parse(err.originalResponse) : undefined
          };
          error('Validation Error:', JSON.stringify(errorPayload, null, 2));
          res.status(err.code === 'SCHEMA_VALIDATION_FAILED' ? 500 : 400).json(errorPayload);
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

function startServer() {
  // CORS Headers
  app.use((req, res, next) => {
    if (process.env.ADDRESSR_ACCESS_CONTROL_ALLOW_ORIGIN) {
      res.setHeader('Access-Control-Allow-Origin', process.env.ADDRESSR_ACCESS_CONTROL_ALLOW_ORIGIN);
    }
    if (process.env.ADDRESSR_ACCESS_CONTROL_EXPOSE_HEADERS) {
      res.setHeader('Access-Control-Expose-Headers', process.env.ADDRESSR_ACCESS_CONTROL_EXPOSE_HEADERS);
    }
    if (process.env.ADDRESSR_ACCESS_CONTROL_ALLOW_HEADERS || process.env.ALLOWED_HEADERS) {
      res.setHeader(
        'Access-Control-Allow-Headers',
        process.env.ALLOWED_HEADERS || 'Origin, X-Requested-With, Content-Type, Accept'
      );
    }
    next();
  });

  server = createServer(app);
  server.listen(serverPort, () => {
    logger(`Server started on port ${serverPort}`);
  });
}

// Start it up
swaggerInit().then(startServer);
