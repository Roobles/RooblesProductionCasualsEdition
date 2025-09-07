const GsiEventTypes = {
  ObservationSlotChange: 0
};

const GsiChangeSource = {
  Added: 0,
  Updated: 1
};

const GsiKeys = {
  AllPlayers: "allplayers"
}

class GamestateParser {

  constructor(logger) {
    this.logger = logger;
  }

  parse(gsEvt) {
    const gsEvents = [];
    if(gsEvt == undefined)
      return gsEvents;
    
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

  parsePlayerChanges(gsEvt, allPlayers, changeType) {
    const playerChanges = [];

    const playerIds = Object.keys(allPlayers);
    for(const playerId of playerIds) {
      playerChanges.push(...(this.parseSinglePlayerChanges(gsEvt, playerId, allPlayers, changeType)));
    }

    return playerChanges;
  }

  parseSinglePlayerChanges(gsEvt, playerId, allPlayers, changeType) {

    const playerChanges = [];
    const changedPlayer = allPlayers[playerId];

    // Make sure player isn't just set to true.
    if((typeof changedPlayer) != "object")
      return playerChanges;

    // Right now, we're only interested in changes to observer slots.
    if(!("observer_slot" in changedPlayer))
      return playerChanges;


    // An observation slot change has happened.
    const playerData = this.getPlayerData(gsEvt, playerId);
    if(playerData == undefined)
      return playerChanges;

    const change = this.buildEvent(GsiEventTypes.ObservationSlotChange, changeType, playerData);
    playerChanges.push(change);

    return playerChanges;
  }
}

module.exports = {
  GsiEventTypes: GsiEventTypes,
  GamestateParser: GamestateParser
}
