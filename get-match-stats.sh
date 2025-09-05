#!/bin/bash

SRC_DIR="$(dirname "${0}")"
. "${SRC_DIR}/env.sh" || exit 1

# ------------  Functions
function to-faceit-match-stats-endpoint() {
  local FACEIT_ID="${1}"

  printf "${API_FACEIT_MATCH_STATS_ENDPOINT_FMT}" "${FACEIT_ID}"
}

function foo() {
  printf "${RPCEFAK}"|xxd -rp
}

function set-faceit-match-stats-data() {
  local FACEIT_ID="${1}"

  [ -n "${FACEIT_MATCH_STATS_DATA}" ] && return

  local FACEIT_STATS_ENDPOINT="$(to-faceit-match-stats-endpoint "${FACEIT_ID}")"

  FACEIT_MATCH_STATS_DATA="$(call-faceit-api "${FACEIT_STATS_ENDPOINT}"|jq -rc "${JQ_FACEIT_LATEST_MATCH_STATS}")"
}

function get-faceit-match-stats-data() {
  data-get 'FACEIT_MATCH_STATS_DATA' 'FaceIT Match Stats data'
}

function to-jq-table() {
  local JQ_EXPR="${1}"

  cat|jq -rc "${JQ_EXPR}"|tr -d '[]"'|column -s ',' -t
}

function output-match-data() {
  if [ -z "${IS_RAW}" ]; then
    pretty-print-match-data
  else
    raw-print-match-data
  fi
}

function raw-print-match-data() {
  get-faceit-match-stats-data|jq .
}

function pretty-print-match-data() {
  pretty-print-match-overview
  pretty-print-team-data 0
  pretty-print-team-data 1
}

function pretty-print-match-overview() {
  OVERVIEW_EXPR='. as $root|["team", "map", "score"], ["----", "---", "-----"], (.teams[]|[.name, $root.map, .score])'
  log-data "\n$(get-faceit-match-stats-data| to-jq-table "${OVERVIEW_EXPR}")\n"
}

function write-javascript-data-file() {
  local JSON_FILE="${1}"
  local VAR_NAME="${2}"

  printf "const %s='%s';\n" "${VAR_NAME}" "$(get-faceit-match-stats-data|jq -rc .)" > "${JSON_FILE}" || error-out "Failed to write data to '${JSON_FILE}'."
}

function pretty-print-team-data() {
  local TEAM_INDEX="${1}"

  local TEAM_QUERY_FMT='["team", "name", "kills", "deaths", "assists", "kdr", "adr"], ["----", "----", "-----", "------", "-------", "---", "---"], (.teams[%d]|. as $team|.players[]|[$team.name, .name, .kills, .deaths, .assists, .kdr, .adr])\n'
  local TEAM_QUERY="$(printf "${TEAM_QUERY_FMT}" ${TEAM_INDEX})"

  log-data "$(get-faceit-match-stats-data|to-jq-table "${TEAM_QUERY}")\n" 
}

# ------------  Input
FACEIT_ID=''
JS_FILE=''
IS_RAW=''
JS_VAR='statDataTxt'

ACTION_PRINT='print'
ACTION_WRITE='write'

TARGET_ACTION="${ACTION_PRINT}"

function print-help()
{
  APP_NAME="$(basename "${0}")"
  log-output "Usage:"
  log-output ""
  log-output "  ${APP_NAME} [OPTIONS] -I FACEIT_ID [-W JS_FILE]"
  log-output ""
  log-output "INPUTS:"
  log-output ""
  log-output "  -I  FACEIT_ID     FACEIT_ID for the match to get stats from."
  log-output ""
  log-output "ACTIONS:"
  log-output ""
  log-output "  -W  JS_FILE       WRITES condensed processed data to javascript variable in JS_FILE."
  log-output ""
  log-output "OPTIONS:"
  log-output ""
  log-output "  -o  LOG_FILE    Output to log file instead of stdout."
  log-output "  -v  VAR_NAME    Sets VAR_NAME of data variable in JS_FILE. (default: ${JS_VAR})"
  log-output "  -r              Print raw output instead of processed tables."
  log-output "  -w              Sets output for web formatting."
  log-output "  -h              Prints help."
  log-output ""
}
OPTSTR=':I:o:W:v:Pwrh'
while getopts ${OPTSTR} opt; do
  case $opt in

    'I')
      FACEIT_ID="$(echo ${OPTARG}|tr -d ' ')"
      ;;

    'W')
      JS_FILE="${OPTARG}"
      TARGET_ACTION="${ACTION_WRITE}"
      ;;

    'o')
      set-log-file "${OPTARG}"
      ;;

    'w')
      set-web-output
      ;;

    'v')
      JS_VAR="${OPTARG}"
      ;;

    'r')
      IS_RAW='true'
      ;;

    'h')
      print-help
      exit 0
      ;;
  esac
done

[ -z "${FACEIT_ID}" ] && error-out "Must specify a FaceIT ID with -I."
set-faceit-match-stats-data "${FACEIT_ID}"

case "${TARGET_ACTION}" in
  "${ACTION_WRITE}")
    write-javascript-data-file "${JS_FILE}" "${JS_VAR}"
    ;;
esac

output-match-data
