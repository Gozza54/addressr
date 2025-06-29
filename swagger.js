function startServer() {
  app.use((request, response, next) => {
    if (process.env.ADDRESSR_ACCESS_CONTROL_ALLOW_ORIGIN !== undefined) {
      response.append(
        'Access-Control-Allow-Origin',
        process.env.ADDRESSR_ACCESS_CONTROL_ALLOW_ORIGIN
      );
    }
    if (process.env.ADDRESSR_ACCESS_CONTROL_EXPOSE_HEADERS !== undefined) {
      response.append(
        'Access-Control-Expose-Headers',
        process.env.ADDRESSR_ACCESS_CONTROL_EXPOSE_HEADERS
      );
    }
    if (process.env.ADDRESSR_ACCESS_CONTROL_ALLOW_HEADERS !== undefined) {
      const headers = process.env.ALLOWED_HEADERS || 'Origin, X-Requested-With, Content-Type, Accept';
      response.setHeader('Access-Control-Allow-Headers', headers);
    }
    next(); // Don’t forget to continue to the next middleware!
  });

  server = createServer(app);
  server.listen(serverPort, () => {
    logger(`Swagger server running on port ${serverPort}`);
  });
}

// Start it
swaggerInit().then(startServer);



