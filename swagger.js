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
error.log = console.error.bind(console); // eslint-disable-line no-console

// SwaggerRouter configuration
const options = {
  swaggerUi: pathUtil.join(__dirname, '/swagger.json'),
  controllers: pat
