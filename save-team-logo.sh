#!/bin/bash

SRC_DIR="$(dirname "${0}")"
. "${SRC_DIR}/env.sh" || exit 1

IMAGE_DIMENSION="250"
TARGET_LOGO_DIR="/c/tmp/logo"
IMAGE_MAGICK_CMD_DEFAULT='magick'
IMAGE_MAGICK_CMD_FALLBACK='convert'

# ------------  Functions
function get-team-logo-image-file() {
  local LOGO_DIR="${1}"
  local TEAM_NAME="${2}"

  printf '%s/%s.png\n' "${LOGO_DIR}" "${TEAM_NAME}"
}

function save-team-logo() {
  local LOGO_DIM="${1}"
  local LOGO_IMAGE_FILE="${2}"

  cat|2>/dev/null "$(get-image-magick)" - -resize ${LOGO_DIM}x${LOGO_DIM}^ -gravity center -extent ${LOGO_DIM}x${LOGO_DIM} "${LOGO_IMAGE_FILE}"
}

function get-image-magick() {
  if [ -n "$(which ${IMAGE_MAGICK_CMD_DEFAULT})" ]; then
    echo "${IMAGE_MAGICK_CMD_DEFAULT}"
  else
    echo "${IMAGE_MAGICK_CMD_FALLBACK}"
  fi
}

function download-image-from-web() {
  local IMG_URL="${1}"

  curl -s "${IMG_URL}" 
}

function download-team-logo() {
  local LOGO_DIR="${1}"
  local LOGO_DIM="${2}"
  local TEAM_NAME="${3}"
  local IMG_URL="${4}"

  local LOGO_IMAGE_FILE="$(get-team-logo-image-file "${LOGO_DIR}" "${TEAM_NAME}")"

  if [ -f "${LOGO_IMAGE_FILE}" ]; then
    warn "Logo for team '${TEAM_NAME}' already exists."
    return
  fi

  download-image-from-web "${IMG_URL}"|save-team-logo "${LOGO_DIM}" "${LOGO_IMAGE_FILE}" || log-error "Failed to download logo for team '${TEAM_NAME}'."
}

function to-faceit-match-endpoint() {
  local FACEIT_ID="${1}"

  printf "${API_FACEIT_MATCH_ENDPOINT_FMT}" "${FACEIT_ID}"
}

function to-faceit-tournament-url() {
  local FACEIT_ID="${1}"
  local FETCH_COUNT="${2}"
  local OFFSET_VAL="${3}"

  if [ -z "${FETCH_COUNT}" ]; then
    printf "${API_FACEIT_TOURN_FMT}" "${FACEIT_ID}"
  else
    printf "${API_FACEIT_TOURN_TEAMS_FMT}" "${FACEIT_ID}" "${FETCH_COUNT}" "${OFFSET_VAL}"
  fi
}

function set-faceit-match-data() {
  local FACEIT_ID="${1}"

  [ -n "${FACEIT_MATCH_DATA}" ] && return
  local FACEIT_ENDPOINT="$(to-faceit-match-endpoint "${FACEIT_ID}")"

  FACEIT_MATCH_DATA="$(call-faceit-api "${FACEIT_ENDPOINT}"|jq -rc .)"
  FACEIT_TEAM_DATA="$(get-faceit-match-data|jq -rc "${JQ_FACEIT_MATCH_TEAM_LOGO}")"
}

function set-faceit-tournament-data() {
  local FACEIT_ID="${1}"

  [ -n "${FACEIT_TOURN_BASE_DATA}" ] && return
  local FACEIT_BASE_URL="$(to-faceit-tournament-url "${FACEIT_ID}")"

  FACEIT_TOURN_BASE_DATA="$(curl -s "${FACEIT_BASE_URL}"|jq -rc .)"
  FACEIT_TEAM_COUNT="$(get-faceit-tourn-base-data|jq -rc "${JQ_FACEIT_TOURN_TEAM_COUNT}")"
}


function get-faceit-match-data() {
  data-get 'FACEIT_MATCH_DATA' 'FaceIT Match data'
}

function get-faceit-tourn-base-data() {
  data-get 'FACEIT_TOURN_BASE_DATA' 'FaceIT Tournament base data'
}

function get-faceit-teams() {
  data-get 'FACEIT_TEAM_DATA' 'Faceit team data'
}

function get-faceit-team-count() {
  data-get 'FACEIT_TEAM_COUNT' 'Faceit teams count'
}

function fetch-faceit-tourn-team-data() {
  local FACEIT_ID="${1}"
  local FETCH_COUNT="${2}"
  local OFFSET_VAL="${3}"

  local DATA_URL="$(to-faceit-tournament-url "${FACEIT_ID}" "${FETCH_COUNT}" "${OFFSET_VAL}")"
  curl -s "${DATA_URL}"|jq -rc .
}

function validate-faceit-id() {
  local FACEIT_ID="${1}"
  local FACEIT_TYPE="${2}"
  local VALIDATION_EXPR="${3}"

  local IS_MATCH="$(echo "${FACEIT_ID}"|grep -iE "^${VALIDATION_EXPR}\$")"
  [ -z "${IS_MATCH}" ] && error-out "Invalid FaceIT ${FACEIT_TYPE} Id ('${FACEIT_ID}')."
}

function download-by-team-array() {
  local TEAM_ARRAY_DATA="${1}"

  local TEAM_ARR_COUNT="$(echo "${TEAM_ARRAY_DATA}"|jq length)"
  for t_index in $(seq 0 $((${TEAM_ARR_COUNT} - 1))); do
    local TEAM_DATA="$(echo "${TEAM_ARRAY_DATA}"|jq -rc ".[${t_index}]")"
    local TEAM_NAME="$(echo "${TEAM_DATA}"|jq -r '.name')"
    local IMG_URL="$(echo "${TEAM_DATA}"|jq -r '.logoUrl')"

    download-by-name-and-url "${TEAM_NAME}" "${IMG_URL}" TRUE
  done
}

function download-by-faceit-tournament-id() {
  local FACEIT_ID="${1}"

  validate-faceit-id "${FACEIT_ID}" "${FACEIT_TYPE_TOURN}" "${REGEX_FACEIT_TOURN_ID}"

  set-faceit-tournament-data "${FACEIT_ID}"

  local TEAM_ITTR="0"
  local FETCH_COUNT="${API_FACEIT_TOURN_FETCH_LIMIT}"
  local TEAM_COUNT="$(get-faceit-team-count)"

  while [ "${TEAM_ITTR}" -lt "${TEAM_COUNT}" ]; do
    local FACEIT_TOURN_TEAM_DATA="$(fetch-faceit-tourn-team-data "${FACEIT_ID}" "${FETCH_COUNT}" "${TEAM_ITTR}")"

    download-by-team-array "$(echo "${FACEIT_TOURN_TEAM_DATA}"|jq -rc "${JQ_FACEIT_TOURN_TEAM_LOGO}")"

    TEAM_ITTR="$((TEAM_ITTR + "${FETCH_COUNT}"))"
  done
}

function download-by-faceit-match-id() {
  local FACEIT_ID="${1}"

  validate-faceit-id "${FACEIT_ID}" "${FACEIT_TYPE_MATCH}" "${REGEX_FACEIT_MATCH_ID}"

  set-faceit-match-data "${FACEIT_ID}"
  download-by-team-array "$(get-faceit-teams)"
}


# ------------  Input
function print-help()
{
  APP_NAME="$(basename "${0}")"
  log-output "Usage:"
  log-output ""
  log-output "  ${APP_NAME} [OPTIONS] -i IMAGE_URL -t TEAM_NAME"
  log-output "  ${APP_NAME} [OPTIONS] -I FACEIT_ID [-T FACEIT_TYPE]"
  log-output ""
  log-output "INPUTS:"
  log-output ""
  log-output "  -i  IMAGE_URL     IMAGE_URL to fetch image from."
  log-output "  -t  TEAM_NAME     TEAM_NAME that the image is saved to."
  log-output "  -I  FACEIT_ID     FACEIT_ID for the match to download logos from."
  log-output "  -T  FACEIT_TYPE   Type of faceit entity (${FACEIT_TYPE_MATCH}|${FACEIT_TYPE_TOURN}) (Default: ${FACEIT_TYPE_MATCH})."
  log-output ""
  log-output "OPTIONS:"
  log-output ""
  log-output "  -d  DIMENSION   DIMENSION to resize to. (Default: ${IMAGE_DIMENSION})"
  log-output "  -o  LOG_FILE    Output to log file instead of stdout."
  log-output "  -l  LOCATION    Directory LOCATION to save logos to. (Default: ${TARGET_LOGO_DIR})"
  log-output "  -w              Sets output for web formatting."
  log-output "  -h              Prints help."
  log-output ""
}

IMG_URL=''
TEAM_NAME=''
FACEIT_ID=''

LOG_FILE=''
TARGET_ACTION=''

ACTION_BY_DIRECT_URL='url'
ACTION_BY_FACEIT_ID='faceit'

FACEIT_TYPE_MATCH='match'
FACEIT_TYPE_TOURN='tournament'

TARGET_FACEIT_TYPE="${FACEIT_TYPE_MATCH}"

OPTSTR=':i:d:t:l:I:T:o:wh'
while getopts ${OPTSTR} opt; do
  case $opt in
    'i')
      IMAGE_URL="${OPTARG}"
      TARGET_ACTION="${ACTION_BY_DIRECT_URL}"
      ;;

    'I')
      FACEIT_ID="$(echo ${OPTARG}|tr -d ' ')"
      TARGET_ACTION="${ACTION_BY_FACEIT_ID}"
      ;;

    'T')
      TARGET_FACEIT_TYPE="${OPTARG,,}"
      TARGET_ACTION="${ACTION_BY_FACEIT_ID}"
      ;;

    't')
      TEAM_NAME="${OPTARG}"
      ;;

    'd')
      IMAGE_DIMENSION="${OPTARG}"
      ;;

    'l')
      TARGET_LOGO_DIR="${OPTARG}"
      ;;

    'o')
      set-log-file "${OPTARG}"
      ;;

    'w')
      set-web-output
      ;;

    'h')
      print-help
      exit 0
      ;;
  esac
done

# ------------  Actions
function download-by-name-and-url() {
  local TEAM_NAME="${1}"
  local IMG_URL="${2}"
  local FROM_AUTOMATION="${3}"

  [ -z "${TEAM_NAME}" ] && error-out 'Missing value for TEAM_NAME.'
  [ -z "${FROM_AUTOMATION}" -a -z "${IMG_URL}" ] && error-out 'Missing value of IMAGE_URL for team '${TEAM_NAME}'.'

  if [ -z "${IMG_URL}" ]; then
    log-error "No avatar exists for team '${TEAM_NAME}'."
    return
  fi

  info "Downloading logo for team '${TEAM_NAME}'..."
  download-team-logo "${TARGET_LOGO_DIR}" "${IMAGE_DIMENSION}" "${TEAM_NAME}" "${IMG_URL}"
}

function download-by-faceit-id() {
  local FACEIT_ID="${1}"
  local FACEIT_TYPE="${2}"

  case "${FACEIT_TYPE}" in
    "${FACEIT_TYPE_MATCH}")
      download-by-faceit-match-id "${FACEIT_ID}"
      ;;

    "${FACEIT_TYPE_TOURN}")
      download-by-faceit-tournament-id "${FACEIT_ID}"
      ;;

    *)
      error-out "Unknown FaceIT type '${FACEIT_TYPE}'."
      ;;
  esac
}


# ------------  Main
case "${TARGET_ACTION}" in
  "${ACTION_BY_DIRECT_URL}")
    download-by-name-and-url "${TEAM_NAME}" "${IMAGE_URL}"
    ;;

  "${ACTION_BY_FACEIT_ID}")
    download-by-faceit-id "${FACEIT_ID}" "${TARGET_FACEIT_TYPE}"
    ;;

  *)
    print-help
    error-out "Must specify an image url with -i, or a faceit id with -I."
esac
