const dotenv = require('dotenv');
const { version } = require('../version.js');

dotenv.config();

function printVersion() {
  let environment = process.env.NODE_ENV || 'development';
  if (environment === 'development') {
    environment = `${environment}|(set NODE_ENV to 'production' in production environments)`;
  }
  const port = process.env.PORT || 8080;
  console.log(`Version: ${version}`);
  console.log(`NODE_ENV: ${environment}`);
  console.log(`PORT: ${port}`);
}

module.exports = {
  printVersion
};
