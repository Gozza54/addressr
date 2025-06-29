const { parse } = require('url');
const http = require('http');
const https = require('https');
const fs = require('fs');
const pathUtil = require('path');
const ProgressBar = require('progress');

module.exports = function (url, path, size) {
  const uri = parse(url);
  if (!path) {
    path = pathUtil.basename(uri.path);
  }
  const file = fs.createWriteStream(path);

  const client = uri.protocol === 'https:' ? https : http;

  return new Promise(function (resolve, reject) {
    client.get(uri.href).on('response', function (res) {
      const length = res.headers['content-length']
        ? Number.parseInt(res.headers['content-length'], 10)
        : size;

      const bar = new ProgressBar(
        '  downloading [:bar] :rate/bps :percent :etas',
        {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: length,
        }
      );

      res
        .on('data', function (chunk) {
          file.write(chunk);
          bar.tick(chunk.length);
        })
        .on('end', function () {
          file.end();
          console.log(`\n${uri.path} downloaded to: ${path}`);
          resolve(res);
        })
        .on('error', function (error) {
          reject(error);
        });
    }).on('error', reject);
  });
};
