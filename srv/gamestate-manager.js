const EventEmitter = require('node:events');
const { Logger, LogLevels } = require('./logger.js');
const { GsiEventTypes, ConnectionStates } = require('./gamestate-parser.js');
const { ConnectionStatuses } = require('./gamestate-dataset.js');

const evtLvl = 'event';

class GamestateManager {

  constructor(logger, gamestateLogger, gamestateParser, gamestateDataset) {
    this.logger = logger;
    this.gamestateLogger = gamestateLogger;
    this.gsParser = gamestateParser;
    this.gamestateDataset = gamestateDataset;
    this.lastEventMessage = Date.now();
    this.secondsUntilConsideredDisconnected = 8;

    this.onObserveSlotChange = new EventEmitter();
    this.onDisconnectedFromMatch = new EventEmitter();
    this.onConnectedToClient = new EventEmitter();
    this.onConnectedToMatch = new EventEmitter();
    this.onDisconnectedFromClient = new EventEmitter();
  }

  init() {
    this.subscribeToClientConnection(evtData => this.processClientConnect(evtData));
    this.subscribeToMatchConnection(evtData => this.processMatchConnect(evtData));
    this.subscribeToMatchDisconnect(evtData => this.processMatchDisconnect(evtData));
    this.subscribeToClientDisconnect(evtData => this.processClientDisconnect(evtData));

    this.subscribeToObserveSlotChange(evtData => this.processObservationSlotChange(evtData));
  }
  
  // ------------------------------- Healthcheck Methods
  checkIfConnected() {

    const lastMessage = this.lastEventMessage;
    const currentTime = Date.now();

    const timeElapsed = currentTime - lastMessage;
    const timeAllotted = this.secondsUntilConsideredDisconnected * 1000;

    if(timeElapsed <= timeAllotted)
      return;

    // Check if already disconnected.  If so, there's no need to update.
    const currentStatus = this.getCurrentConnectionStatus();
    if(currentStatus == ConnectionStatuses.Disconnected)
      return;

    // Surpassed configured time.
    const disconnectData = {};
    this.setCurrentConnectionStatus(ConnectionStatuses.Disconnected);
    this.triggerConnectionStatusEvent(disconnectData, this.onDisconnectedFromClient);
  }

  // ------------------------------- Dataset Methods
  getGamestateData(printable = false) {
    return this.gamestateDataset.getCurrentData(printable);
  }

  getCurrentConnectionStatus() {
    return this.gamestateDataset.getConnectionStatus();
  }

  setCurrentConnectionStatus(conSts) {
    this.gamestateDataset.setConnectionStatus(conSts);
  }

  setPlayerData(playerData) {
    this.gamestateDataset.setPlayerData(playerData);
  }

  translateConnectionStateToConnectionStatus(connectionState) {
    switch (connectionState) {
      case ConnectionStates.ConnectedToClient:
        return ConnectionStatuses.ConnectedToClient;

      case ConnectionStates.ConnectedToMatch:
        return ConnectionStatuses.ConnectedToMatch;

      default:
        return ConnectionStatuses.Unknown;
    }
  }

  setCurrentMatchData(gamestateEvt) {
    // Set Player Data
    this.setCurrentPlayerData(gamestateEvt);
  }

  setCurrentPlayerData(gamestateEvt) {
    this.setPlayerData(this.gsParser.getAllPlayerData(gamestateEvt));
  }

  // ------------------------------- Event Subscriptions
  processClientConnect(onConnectData) {
    this.logger.logAction("Connected to CS2");
  }

  processMatchConnect(onConnectData) {
    this.logger.logAction("Connected to Match");
    this.setCurrentMatchData(onConnectData.GsiEvent);
  }

  processMatchDisconnect(onDisconnectData) {
    this.logger.logAction("Disconnected from Match");
  }

  processObservationSlotChange(observationChanges) {
    this.logger.debug("Observation slot changes detected.");
    this.setPlayerData(observationChanges.CurrentData);
  }

  processClientDisconnect(onDisconnectData) {
    this.logger.logAction("Disconnected from CS2");
  }

  // ------------------------------- Gamestate Evt Process Methods
  processGamestateEvent(gamestateEvt) {

    this.lastEventMessage = Date.now();
    this.gamestateLogger.logGamestate(gamestateEvt);
    const currentConnectionState = this.gsParser.getConnectionState(gamestateEvt);

    this.processConnectionState(gamestateEvt, currentConnectionState);
    if(currentConnectionState != ConnectionStates.ConnectedToMatch)
      return;

    this.processConnectedGamestateEvent(gamestateEvt);
  }

  processConnectionState(gamestateEvt, currentConnectionState) {
    const currentConnectionStatus = this.getCurrentConnectionStatus();
    const translatedStatus = this.translateConnectionStateToConnectionStatus(currentConnectionState);

    // If no change in status, do nothing.
    if(currentConnectionStatus == translatedStatus)
      return;

    // A change has occurred.
    if(currentConnectionState == ConnectionStates.ConnectedToMatch)
      this.processConnectionTransitionToMatch(gamestateEvt, currentConnectionStatus);
    else
      this.processConnectionTransitionToClient(gamestateEvt, currentConnectionStatus);

    // This works because we can never recieve a full disconnected status from a gamestate integration event.
    // Receiving any data at all is an indication we are not fully disconnected.
    // A disconnected status can only ever come from monitoring a heartbeat that never came.
    this.gamestateDataset.setConnectionStatus(translatedStatus);
  }

  processConnectionTransitionToMatch(gamestateEvt, priorStatus) {
    // Newly connected to match from any other state.
    this.triggerConnectionStatusEvent(gamestateEvt, this.onConnectedToMatch);
  }

  processConnectionTransitionToClient(gamestateEvt, priorStatus) {
    // In the client screen.

    switch(priorStatus) {
      case ConnectionStatuses.ConnectedToMatch:
        // Disconnected from a match.
        this.triggerConnectionStatusEvent(gamestateEvt, this.onDisconnectedFromMatch);
        break;

      default:
        // Was disconnected or in an unknown status.  Treat the same.
        this.triggerConnectionStatusEvent(gamestateEvt, this.onConnectedToClient);
    } 
  }

  processConnectedGamestateEvent(gamestateEvt) {
    const evts = this.gsParser.parse(gamestateEvt);
    const evtTypes = Object.keys(evts);

    for(const evType of evtTypes) {
      const eventData = evts[evType];
      if(eventData.length < 1)
        continue;

      switch(parseInt(evType)) {
        case GsiEventTypes.ObservationSlotChange:
          this.triggerGsiEvent(this.gsParser.getAllPlayerData(gamestateEvt), eventData, this.onObserveSlotChange);
          break;
      }
    }
  }

  // ------------------------------- Triggers
  triggerConnectionStatusEvent(gamestateEvt, emitter) {
    const fullData = {
      GsiEvent: gamestateEvt
    }

    this.triggerEvent(fullData, emitter);
  }

  triggerGsiEvent(currentData, changedData, emitter) {
    const fullData = {
      CurrentData: currentData,
      ChangedData: changedData
    };

    this.triggerEvent(fullData, emitter);
  }

  triggerEvent(fullData, emitter) {
    emitter.emit(evtLvl, fullData);
  }

  // ------------------------------- Subscriber Methods
  subscribeToObserveSlotChange(handlerFunc) {
    this.onObserveSlotChange.on(evtLvl, handlerFunc);
  }

  subscribeToClientConnection(handlerFunc) {
    this.onConnectedToClient.on(evtLvl, handlerFunc);
  }

  subscribeToMatchConnection(handlerFunc) {
    this.onConnectedToMatch.on(evtLvl, handlerFunc);
  }

  subscribeToMatchDisconnect(handlerFunc) {
    this.onDisconnectedFromMatch.on(evtLvl, handlerFunc);
  }

  subscribeToClientDisconnect(handlerFunc) {
    this.onDisconnectedFromClient.on(evtLvl, handlerFunc);
  }
}

module.exports = {
  ConnectionStatuses: ConnectionStatuses,
  GamestateManager: GamestateManager
};
