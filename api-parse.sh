#!/bin/bash

REGEX_FACEIT_TOURN_ID='[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}'
REGEX_FACEIT_MATCH_ID="1-${REGEX_FACEIT_TOURN_ID}"

API_FACEIT_MATCH_FMT='https://www.faceit.com/api/match/v2/match/%s\n'
API_FACEIT_MATCH_STATS_FMT='https://www.faceit.com/api/stats/v3/matches/%s\n'
API_FACEIT_TOURN_FMT='https://www.faceit.com/api/championships/v1/championship/%s\n'
API_FACEIT_TOURN_TEAMS_FMT='https://www.faceit.com/api/championships/v1/championship/%s/subscription?limit=%d&offset=%d\n'
API_FACEIT_TOURN_FETCH_LIMIT=20

JQ_FACEIT_MATCH_TEAM_LOGO='.payload.teams|[[.faction1, .faction2][]|{"name": .name, "logoUrl": .avatar}]'
JQ_FACEIT_TOURN_TEAM_LOGO='[.payload.items[]|.team|{ "name": .name, "logoUrl": .avatar }]'
JQ_FACEIT_TOURN_TEAM_COUNT='.payload.participants.total'

JQ_FACEIT_LATEST_MATCH_STATS='.[length-1]|{"matchId": .matchId, "map": .i1, "score": .i18, "teams": [.teams[]|{"name": .i5, "win": .i17, "score": .c5, "players": ([.players[]| {"name": .nickname, "kills": .i6, "deaths": .i8,  "assists": .i7, "adr": .c10, "kdr": .c2 }]) }]}'
