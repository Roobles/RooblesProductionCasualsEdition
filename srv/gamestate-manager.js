const EventEmitter = require('node:events');
const { Logger, LogLevels } = require('./logger.js');
const { GsiEventTypes } = require('./gamestate-parser.js');

const evtLvl = 'event';

const ConnectionStatuses = {
  Unknown: 0,
  Connected: 1,
  Disconnected: 2
};

class GamestateManager {

  constructor(logger, gamestateParser) {
    this.logger = logger;
    this.gsParser = gamestateParser;

    this.onObserveSlotChange = new EventEmitter();
  }

  init() {
    // TODO: Consider any self subscriptions that could be valuable, even for logging purposes.
  }

  processGamestateEvent(gamestateEvt) {
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

  triggerGsiEvent(currentData, changedData, emitter) {
    const fullData = {
      CurrentData: currentData,
      ChangedData: changedData
    };

    emitter.emit(evtLvl, fullData);
  }

  subscribeToObserveSlotChange(handlerFunc) {
    this.onObserveSlotChange.on(evtLvl, handlerFunc);
  }

}

module.exports = {
  ConnectionStatuses: ConnectionStatuses,
  GamestateManager: GamestateManager
};
