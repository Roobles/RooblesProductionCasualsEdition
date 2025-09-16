const bodyParser = require('body-parser');
const express = require('express');

const HttpVerb = {
  GET: 0,
  POST: 1,
  PUT: 2
};

class HttpBinding {
  constructor(endpoint, verb, handler) {
    this.endpoint = endpoint;
    this.verb = verb;
    this.handler = handler;
  }
}

class HttpManager {
  constructor(config, logger) {
    this.logger = logger;
    this.config = config;

    this.server = express();
    this.server.use(express.json());
    this.bindings = [];
    this.openService = null;

  }

  init(bindings) {
    bindings.forEach((binding) => this.bind(binding));
  }

  bind(binding) {

    const verb = binding.verb;
    const endpoint = binding.endpoint;
    const handler = binding.handler;

    switch (verb) {
      case HttpVerb.GET:
        this.server.get(endpoint, async (req, res) => this.serve(req, res, handler));
        break;

      case HttpVerb.POST:
        this.server.post(endpoint, async (req, res) => this.serve(req, res, handler));
        break;

      case HttpVerb.PUT:
        this.server.put(endpoint, async (req, res) => this.serve(req, res, handler));
        break;
    }
  
    this.bindings.push(endpoint);
  }

  run() {
    const httpConfig = this.config.Http;
    const host = httpConfig.Address;
    const port = httpConfig.Port;

    this.logger.logAction(`HTTP Service Listening on Port: ${port}`);
    this.openService = this.server.listen(port, host);
  }

  stop() {
    this.logger.logAction(`Stopping HTTP Service.`);
    this.openService.close();
  }

  getBindings() {
    return this.bindings;
  }

  async serve(req, res, handler) {

    res.set('Content-Type', 'application/json');

    try {
      res.status(200).send(await handler(req.body));
    } catch(error) {
      this.logger.log(error);
      res.status(500).send({ error: error });
    }
  }
}

module.exports = {
  HttpVerb: HttpVerb,
  HttpManager: HttpManager,
  HttpBinding: HttpBinding
};
