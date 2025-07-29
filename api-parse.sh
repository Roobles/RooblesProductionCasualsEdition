#!/bin/bash

REGEX_FACEIT_MATCH_ID="1-${REGEX_FACEIT_TOURN_ID}"
REGEX_FACEIT_TOURN_ID='[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}'
RPCEAAJ='4163636570743a206170706c69636174696f6e2f6a736f6e0a'
RPCEFAK='417574686f72697a6174696f6e3a20426561726572203037623363373638\
2d333033372d343466332d393362302d3932306665343661336463640a'

API_FACEIT_MATCH_FMT='https://www.faceit.com/api/match/v2/match/%s\n'
API_FACEIT_MATCH_ENDPOINT_FMT='matches/%s\n'
API_FACEIT_MATCH_STATS_ENDPOINT_FMT='matches/%s/stats\n'
API_FACEIT_TOURN_FMT='https://www.faceit.com/api/championships/v1/championship/%s\n'
API_FACEIT_TOURN_TEAMS_FMT='https://www.faceit.com/api/championships/v1/championship/%s/subscription?limit=%d&offset=%d\n'
API_FACEIT_TOURN_FETCH_LIMIT=20

JQ_FACEIT_MATCH_TEAM_LOGO='.payload.teams|[[.faction1, .faction2][]|{"name": .name, "logoUrl": .avatar}]'
JQ_FACEIT_TOURN_TEAM_LOGO='[.payload.items[]|.team|{ "name": .name, "logoUrl": .avatar }]'
JQ_FACEIT_TOURN_TEAM_COUNT='.payload.participants.total'

JQ_FACEIT_LATEST_MATCH_STATS='.rounds.[length-1]|{"matchId": .match_id, "map": .round_stats.Map, "score": .round_stats.Score, "teams": [.teams[]|{"name": .team_stats.Team, "win": .team_stats."Team Win", "score": .team_stats."Final Score", "players": ([.players[]| {"name": .nickname, "kills": .player_stats.Kills, "deaths": .player_stats.Deaths,  "assists": .player_stats.Assists, "adr": .player_stats.ADR, "kdr": .player_stats."K/D Ratio" }]) }]}'
