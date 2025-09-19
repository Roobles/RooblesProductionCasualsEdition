const ConnectionStatuses = {
  Unknown: 0,
  ConnectedToClient: 1,
  ConnectedToMatch: 2,
  Disconnected: 3
};

const MatchStatuses = {
  Unknown: 0,
  Empty: 1,
  PreMatch: 2,
  LiveMatch: 3,
  PostMatch: 4
};

class RoundstateDataset {
  constructor(roundNumber) {
    this.roundNumber = roundNumber;
    this.phase = null;
  }
}

function GetEnumValue(enumObj, enumVal, printable) {
  return printable
    ? Object.keys(enumObj)[enumVal]
    : enumVal;
}

class MatchstateDataset {
  constructor() {
    this.currentRound = null;
    this.matchStatus = MatchStatuses.Unknown;
    this.map = null;
    this.players = [];
  }

  getCurrentData(printable = false) {
    // TODO: Implement rounds
    return {
      Status: this.getMatchStatus(printable),
      Map: this.getMap(),
      Players: this.getPlayerData()
    };
  }

  getPlayerData() {
    return this.players;
  }

  getMap() {
    return this.map;
  }

  getMatchStatus(printable = false) {
    return GetEnumValue(MatchStatuses, this.matchStatus, printable);
  }

  setPlayerData(playerData) {
    this.players = playerData;
  }

  setMatchStatus(matchSts) {
    this.matchStatus = matchSts;
  }
}

class GamestateDataset {
  constructor() {
    this.connectionStatus = ConnectionStatuses.Unknown;
    this.currentMatch = null;
  }

  getCurrentData(printable = false) {
    return {
      ConnectionStatus: this.getConnectionStatus(printable),
      CurrentMatch: this.getCurrentMatch().getCurrentData(printable)
    };
  }

  getCurrentMatch() {
    if(this.currentMatch == null)
      this.currentMatch = new MatchstateDataset();

    return this.currentMatch;
  }

  getCurrentPlayerData() {
    return this.getCurrentMatch()
      .getPlayerData();
  }

  getConnectionStatus(printable = false) {
    return GetEnumValue(ConnectionStatuses, this.connectionStatus, printable);
  }

  getMatchStatus() {
    return this.getCurrentMatch()
      .getMatchStatus();
  }

  setConnectionStatus(conSts) {
    this.connectionStatus = conSts;
  }

  setPlayerData(playerData) {
    this.getCurrentMatch()
      .setPlayerData(playerData);
  }

  setMatchStatus(matchSts) {
    this.getCurrentMatch()
      .setMatchStatus(matchSts);
  }
}

class GamestateReader {
  constructor(gsDataset) {
    this.gsDataset = gsDataset;
  }

  getCurrentPlayerData() {
    return this.gsDataset.getCurrentPlayerData();
  }
}

module.exports = {
  GamestateDataset: GamestateDataset,
  GamestateReader: GamestateReader,
  ConnectionStatuses: ConnectionStatuses
};
