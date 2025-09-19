const { HttpBinding, HttpVerb } = require('./http-manager.js');

class RooblesProductionManager {
  constructor(config, configManager, logger, rooblesHeartbeat, httpManager, gamestateManager, observerManager) {
    this.config = config;
    this.logger = logger;
    this.configManager = configManager;
    this.rooblesHeartbeat = rooblesHeartbeat;
    this.httpManager = httpManager;
    this.gamestateManager = gamestateManager;
    this.observerManager = observerManager;
  }

  processGamestateEvent(gsEvt) {
    this.gamestateManager.processGamestateEvent(gsEvt);
    return { };
  }

  getConfiguration() {
    return this.config;
  }

  getHttpBindings() {
    return this.httpManager.getBindings();
  }

  handleServiceAction(serviceAction) {
    const sts = serviceAction.Status;
    switch(sts) {
      case 'Stop':
        this.shutdown();
        break;

      default:
        this.logger.warn(`Unknown Service Action Status: ${sts}`);
    }
  }

  getObservablePlayers() {
    return this.observerManager.getMappedPlayers();
  }

  updateObservablePlayers() {
    this.observerManager.updateObservationSlotChanges();
  }

  getLatestObservationEvent() {
    return this.observerManager.getLatestObservationEvent();
  }

  getCurrentGamestate() {
    return this.gamestateManager.getGamestateData(true);
  }

  buildHttpBindings() {
    return [
      new HttpBinding('/valve/gsi', HttpVerb.POST, (gsEvt) => this.processGamestateEvent(gsEvt)),
      new HttpBinding('/roobles/production/service', HttpVerb.PUT, (srvAct) => this.handleServiceAction(srvAct)),
      new HttpBinding('/roobles/api', HttpVerb.GET, () => this.getHttpBindings()),
      new HttpBinding('/roobles/config', HttpVerb.GET, () => this.getConfiguration()),
      new HttpBinding('/roobles/gamestate', HttpVerb.GET, () => this.getCurrentGamestate()),
      new HttpBinding('/roobles/observation/update', HttpVerb.POST, () => this.updateObservablePlayers()),
      new HttpBinding('/roobles/observation/players', HttpVerb.GET, () => this.getObservablePlayers()),
      new HttpBinding('/roobles/observation/events/latest', HttpVerb.GET, () => this.getLatestObservationEvent())
    ];
  }

  initHttpServer() {
    const bindings = this.buildHttpBindings();
    this.httpManager.init(bindings);
  }

  initManagers() {
    this.gamestateManager.init();
    this.observerManager.init();
  }

  initHeartbeats() {
    this.rooblesHeartbeat.subscribe('test', () => this.gamestateManager.checkIfConnected(), 2);
  }

  initEventHandlers() {
    this.gamestateManager.subscribeToObserveSlotChange(dta => this.observerManager.processObservationSlotChanges(dta));
    this.gamestateManager.subscribeToMatchConnection(dta => this.updateObservablePlayers());
  }

  init() {
    // TODO: Consider any loading of persisted data.
    this.initManagers();
    this.initHttpServer();
    this.initEventHandlers();
    this.initHeartbeats();
  }

  run() {
    this.httpManager.run();
    this.rooblesHeartbeat.run();
  }

  shutdown() {
    // TODO: Consider any persistence of data.
    this.httpManager.stop();
    this.rooblesHeartbeat.stop();
  }
}

module.exports = {
  RooblesProductionManager : RooblesProductionManager
}
