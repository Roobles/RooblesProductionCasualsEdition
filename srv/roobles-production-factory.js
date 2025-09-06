const { Logger, LogLevels } = require('./logger.js');
const { ConfigurationManager } = require('./configuration-manager.js');
const { HttpManager, HttpBinding, HttpVerb } = require('./http-manager.js');
const { GamestateParser } = require('./gamestate-parser.js');
const { GamestateManager } = require('./gamestate-manager.js');
const { RooblesProductionManager } = require('./roobles-production-manager.js');

class RooblesProductionFactory {

  buildLogger(fact) {
    const logLevel = LogLevels.INFO;
    return new Logger(logLevel);
  }

  buildConfigurationManager(fact) {
    return new ConfigurationManager(fact.configFileName);
  }

  getConfiguration(fact) {
    const configMan = fact.ConfigManager();
    return configMan.getConfiguration();
  }

  buildHttpManager(fact) {
    return new HttpManager(fact.Configuration(), fact.Logger());
  }

  buildGamestateParser(fact) {
    return new GamestateParser(fact.Logger());
  }

  buildGamestateManager(fact) {
    return new GamestateManager(fact.Logger(), fact.GamestateParser());
  }

  buildRooblesProductionManager(fact) {
    return new RooblesProductionManager(fact.Configuration(), fact.ConfigManager(), fact.Logger(), fact.HttpManager(), fact.GamestateManager());
  }

  lazyLoad(fact, propName, buildResource) {
    const resource = fact[propName];
    if(resource)
      return resource;

    return (fact[propName] = buildResource(fact));
  }

  constructor(configFileName) {
    this.configFileName = configFileName;
  }

  init() {
    const configManager = this.ConfigManager();
    const logger = this.Logger();

    configManager.setLogger(logger);
  }

  Logger() {
    return this.lazyLoad(this, 'logger', this.buildLogger);
  }

  ConfigManager() {
    return this.lazyLoad(this, 'configManager', this.buildConfigurationManager);
  }

  Configuration() {
    return this.lazyLoad(this, 'configuration', this.getConfiguration);
  }

  HttpManager() {
    return this.lazyLoad(this, 'httpManager', this.buildHttpManager);
  }

  GamestateParser() {
    return this.lazyLoad(this, 'gamestateParser', this.buildGamestateParser);
  }

  GamestateManager() {
    return this.lazyLoad(this, 'gamestateManager', this.buildGamestateManager);
  }

  RooblesProductionManager() {
    return this.lazyLoad(this, 'rooblesProductionManager', this.buildRooblesProductionManager);
  }
}

module.exports = {
  RooblesProductionFactory : RooblesProductionFactory
}
