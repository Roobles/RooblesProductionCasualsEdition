const GsiEventTypes = {
  ConnectionChange: 0,
  ObservationSlotChange: 1,
  PlayersAdded: 2
};

const GsiChangeSource = {
  Added: 0,
  Updated: 1
};

const RoundPhases = {
  Unknown: undefined,
  Live: "live",
  FreezeTime: "freezetime",
  Over: "over"
}

const GsiKeys = {
  AllPlayers: "allplayers"
}

const ConnectionStates = {
  Unknown: 0,
  ConnectedToClient: 1,
  ConnectedToMatch: 2
}

const DataSegments = {
  Added: "added",
  Previously: "previously",
  Provider: "provider"
}

class GamestateParser {

  constructor(logger) {
    this.logger = logger;
  }

  getConnectionState(gsEvt) {
    if(gsEvt == undefined)
      return ConnectionStates.Unknown;

    const disconnectedCompatibleSegments = [
      DataSegments.Provider,
      DataSegments.Previously
    ];

    const gameDataSegments = Object
      .keys(gsEvt)
      .filter(k => !disconnectedCompatibleSegments.includes(k));

    return gameDataSegments.length > 0
      ? ConnectionStates.ConnectedToMatch
      : ConnectionStates.ConnectedToClient;
  }

  parse(gsEvt) {
    const gsEvents = [];
    if(gsEvt == undefined)
      return gsEvents;
    
    this.logger.traceObject(gsEvt);
    const added = gsEvt.added;
    const previously = gsEvt.previously;

    gsEvents.push(...(this.parseChanged(gsEvt, added, GsiChangeSource.Added)));
    gsEvents.push(...(this.parseChanged(gsEvt, previously, GsiChangeSource.Updated)));

    return gsEvents.reduce((acc, evt) => {
      const evType = evt.Type;
      if(!(evType in acc)) 
        acc[evType] = [];

      acc[evType].push(evt.Data);
      return acc;
    }, {});
  }

  buildEvent(eventType, eventSource, eventData) {
    return {
      Type: eventType,
      Source: eventSource,
      Data: eventData
    };
  }

  getAllPlayerData(gsEvt) {
    const playerData = [];
    if(gsEvt == undefined)
      return playerData;

    const allPlayers = gsEvt[GsiKeys.AllPlayers];
    if(allPlayers == undefined)
      return playerData;

    const playerIds = Object.keys(allPlayers);
    for(const playerId of playerIds) {
      const currentPlayerData = this.toPlayerData(playerId, allPlayers[playerId]);
      if(currentPlayerData != undefined)
        playerData.push(currentPlayerData);
    }

    return playerData;
  }

  getPlayerData(gsEvt, playerId) {
    if(gsEvt == undefined)
      return undefined;

    const allPlayers = gsEvt[GsiKeys.AllPlayers];
    if(allPlayers == undefined)
      return undefined;

    return this.toPlayerData(playerId, allPlayers[playerId]);
  }

  toPlayerData(playerId, gsiPlayerData) {
    if(gsiPlayerData == undefined)
      return undefined;

    return {
      Id: playerId,
      Name: gsiPlayerData.name,
      ObserverSlot: gsiPlayerData.observer_slot,
      Team: gsiPlayerData.team
    };
  }

  parseChanged(gsEvt, changed, changeType) {
    const updateChanges = [];
    if(changed == undefined)
      return updateChanges;

    var keys = Object.keys(changed);
    for (const key of keys) {
      updateChanges.push(...(this.parseChanges(gsEvt, key, changed, changeType)));
    }

    return updateChanges;
  }

  parseChanges(gsEvt, key, changed, changeType) {
    const changes = [];
    switch (key) {
      case GsiKeys.AllPlayers: 
        changes.push(...(this.parsePlayerChanges(gsEvt, changed[key], changeType)));
        break;
    }

    return changes;
  }

  parsePlayerChanges(gsEvt, allChangedPlayers, changeType) {
    const playerChanges = [];

    const changedPlayerIds = Object.keys(allChangedPlayers);
    for(const changedPlayerId of changedPlayerIds) {
      playerChanges.push(...(this.parseSinglePlayerChanges(gsEvt, changedPlayerId, allChangedPlayers, changeType)));
    }

    return playerChanges;
  }

  parseSinglePlayerChanges(gsEvt, changedPlayerId, allChangedPlayers, changeType) {

    const playerChanges = [];
    const changedPlayer = allChangedPlayers[changedPlayerId];

    // Make sure player isn't just set to true.
    if((typeof changedPlayer) != "object")
      return playerChanges;

    // Right now, we're only interested in changes to observer slots.
    if(!("observer_slot" in changedPlayer))
      return playerChanges;


    // An observation slot change has happened.
    // Get the current observation slot from current, full GIS data.
    // We don't care about the previous value, only current.
    const currentPlayerData = this.getPlayerData(gsEvt, changedPlayerId);
    if(currentPlayerData == undefined)
      return playerChanges;

    // Build an event, with current player data, that indicates an observation slot change has occurred.
    const change = this.buildEvent(GsiEventTypes.ObservationSlotChange, changeType, currentPlayerData);
    playerChanges.push(change);

    // In the future, other player changes might be relevant.  (Like disconnect, joining, etc.)
    return playerChanges;
  }
}

module.exports = {
  GsiEventTypes: GsiEventTypes,
  GamestateParser: GamestateParser,
  ConnectionStates: ConnectionStates
}
