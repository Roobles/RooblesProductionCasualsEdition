const { Logger, LogLevels } = require('./logger.js');
const { GamestateLogger } = require('./gamestate-logger.js');
const { ConfigurationManager } = require('./configuration-manager.js');
const { HttpManager, HttpBinding, HttpVerb } = require('./http-manager.js');
const { RooblesHeartbeat } = require('./heart-of-the-rat.js');
const { FileManager } = require('./file-manager.js');
const { GamestateParser } = require('./gamestate-parser.js');
const { GamestateManager } = require('./gamestate-manager.js');
const { CsManager } = require('./cs-manager.js');
const { ObservationManager } = require('./observation-manager.js');
const { RooblesProductionManager } = require('./roobles-production-manager.js');
const { GamestateDataset } = require('./gamestate-dataset.js');

class RooblesProductionFactory {

  buildLogger(fact) {
    return new Logger(fact.Configuration());
  }

  buildGamestateLogger(fact) {
    return new GamestateLogger(fact.Configuration(), fact.Logger(), fact.FileManager());
  }

  buildConfigurationManager(fact) {
    return new ConfigurationManager(fact.configFileName);
  }

  getConfiguration(fact) {
    const configMan = fact.ConfigManager();
    return configMan.getConfiguration();
  }

  buildRooblesHeartbeat(fact) {
    return new RooblesHeartbeat(fact.Configuration(), fact.Logger());
  }

  buildGamestateDataset(fact) {
    return new GamestateDataset();
  }

  buildHttpManager(fact) {
    return new HttpManager(fact.Configuration(), fact.Logger());
  }

  buildFileManager(fact) {
    return new FileManager(fact.Configuration(), fact.Logger());
  }

  buildGamestateParser(fact) {
    return new GamestateParser(fact.Logger());
  }

  buildGamestateManager(fact) {
    return new GamestateManager(fact.Logger(), fact.GamestateLogger(), fact.GamestateParser(), fact.GamestateDataset());
  }

  buildCsManager(fact) {
    return new CsManager(fact.Configuration(), fact.Logger(), fact.FileManager());
  }

  buildObservationManager(fact) {
    return new ObservationManager(fact.Configuration(), fact.Logger(), fact.CsManager());
  }

  buildRooblesProductionManager(fact) {
    return new RooblesProductionManager(fact.Configuration(), fact.ConfigManager(), fact.Logger(), fact.RooblesHeartbeat(), fact.HttpManager(), fact.GamestateManager(), fact.ObservationManager());
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

  GamestateLogger() {
    return this.lazyLoad(this, 'gamestateLogger', this.buildGamestateLogger);
  }

  ConfigManager() {
    return this.lazyLoad(this, 'configManager', this.buildConfigurationManager);
  }

  Configuration() {
    return this.lazyLoad(this, 'configuration', this.getConfiguration);
  }

  RooblesHeartbeat() {
    return this.lazyLoad(this, 'rooblesHeartbeat', this.buildRooblesHeartbeat);
  }

  GamestateDataset() {
    return this.lazyLoad(this, 'gamestateDataset', this.buildGamestateDataset);
  }

  HttpManager() {
    return this.lazyLoad(this, 'httpManager', this.buildHttpManager);
  }

  FileManager() {
    return this.lazyLoad(this, 'fileManager', this.buildFileManager);
  }

  GamestateParser() {
    return this.lazyLoad(this, 'gamestateParser', this.buildGamestateParser);
  }

  GamestateManager() {
    return this.lazyLoad(this, 'gamestateManager', this.buildGamestateManager);
  }

  CsManager() {
    return this.lazyLoad(this, 'csManager', this.buildCsManager);
  }

  ObservationManager() {
    return this.lazyLoad(this, 'observationManager', this.buildObservationManager);
  }

  RooblesProductionManager() {
    return this.lazyLoad(this, 'rooblesProductionManager', this.buildRooblesProductionManager);
  }
}

module.exports = {
  RooblesProductionFactory : RooblesProductionFactory
}
