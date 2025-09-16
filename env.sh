ROOBLES_PROD_CASUAL_SRC_DIR="$(dirname "${BASH_SOURCE[0]}")"

. "${ROOBLES_PROD_CASUAL_SRC_DIR}/api-parse.sh" || exit 1

# ------------  Service Variables
ROOBLES_PROD_SERVICE_DIR="${ROOBLES_PROD_CASUAL_SRC_DIR}/srv"
ROOBLES_PROD_SERVICE_SCRIPT="${ROOBLES_PROD_SERVICE_DIR}/roobles-production.js"
ROOBLES_PROD_SERVICE_CONFIG="${ROOBLES_PROD_SERVICE_DIR}/roobles-production-config.json"

# ------------  Log Variables
SHOULD_LOG_OUTPUT=''

# ------------  Log Functions

function log-output() {
  local LOG_TXT="${1}"
  local LF="$(get-log-file)"
  if [ -n "${SHOULD_LOG_OUTPUT}" -a -n "${LF}" ]; then
    echo "${LOG_TXT}" >> "${LF}"
  else
    echo -e "${LOG_TXT}"
  fi
}

function insert-ui-syntax-highlighting() {
  if [ -z "$(get-is-web-output)" ]; then
    cat
    return
  fi

  local QUOTE_COLOR='blue'
  cat |sed "s/\('[^']\+'\)/<span class=\"${QUOTE_COLOR}\">\1<\/span>/g"
}

function insert-data-syntax-highlighting() {
  if [ -z "$(get-is-web-output)" ]; then
    cat
    return
  fi

  cat |sed 's/ /\&nbsp;/g'|sed 's/\(-\+\)/<span class="blue">\1<\/span>/g'|sed 's/;\([0-9.]\+\)/;<span class="lightyellow">\1<\/span>/g'
}

function ui-log-wrap() {
  local LABEL="${1}"
  local LOG_TEXT="${2}"
  local COLOR="${3}"

  local PREFIX=''
  local SUFFIX=''
  local ENDCAP=''

  if [ -n "$(get-is-web-output)" ]; then
    PREFIX="<span class=\"${COLOR}\">"
    SUFFIX="</span>"
    ENDCAP="<br />"
  fi

  printf '[%s%s%s] %s%s\n' "${PREFIX}" "${LABEL}" "${SUFFIX}" "${LOG_TEXT}" "${ENDCAP}"|insert-ui-syntax-highlighting
}

function ui-data-wrap() {
  local DATA_TXT="${1}"

  if [ -z "$(get-is-web-output)" ]; then
    echo -e "${DATA_TXT}"
    return
  fi

  echo -e "${DATA_TXT}"|sed 's/$/<br\/>/'|insert-data-syntax-highlighting
}

function log-data() {
  local DATA_TXT="${1}"

  log-output "$(ui-data-wrap "${DATA_TXT}")"
}

function info() {
  local LOG_TXT="${1}"

  log-output "$(ui-log-wrap 'Info' "${LOG_TXT}" 'green')"
}

function warn() {
  local LOG_TXT="${1}"

  log-output "$(ui-log-wrap 'Warn' "${LOG_TXT}" 'yellow')"
}

function log-error() {
  local LOG_TXT="${1}"

  log-output "$(ui-log-wrap 'Error' "${LOG_TXT}" 'red')"
}

function error-out() {
  local LOG_TXT="${1}"

  log-error "${LOG_TXT}"
  exit -1
}

# ------------  Utility
function hconva() {
  printf "${!1}"|xxd -r -p
}

# ------------  Property Handling

function data-get() {
  local VAR_NAME="${1}"
  local DATA_TITLE="${2}"
  local NOT_REQUIRED="${3}"

  [ -z "${!VAR_NAME}" -a -z "${NOT_REQUIRED}" ] && error-out "${DATA_TITLE} was not set."
  echo "${!VAR_NAME}"
}

function set-log-file() {
  local LF="${1}"

  [ -z "${LF}" ] && return

  LOG_FILE="${LF}"
  SHOULD_LOG_OUTPUT='true'
}

function set-web-output() {
  IS_WEB_OUTPUT='true'
}

function get-log-file() {
  data-get 'LOG_FILE' 'Log File' true
}

function get-is-web-output() {
  echo "${IS_WEB_OUTPUT}"
}

# ------------ FaceIT
function fiaha() {
  for fihv in ${@}; do
    printf " -%s '%s'" 'H' "$(hconva "${fihv}")"
  done
}

function build-api-endpoint-url() {
  local API_ENDPOINT="${1}"
  local API_DOMAIN="${2}"
  local API_V="${3}"

  [ -z "${API_DOMAIN}" ] && API_DOMAIN='data'
  [ -z "${API_V}" ] && API_V='4'

  printf 'https://open.faceit.com/%s/v%d/%s\n' "${API_DOMAIN}" "${API_V}" "${API_ENDPOINT}"
}

function call-faceit-api() {
  local API_ENDPOINT="${1}"
  local API_DOMAIN="${2}"
  local API_V="${3}"
  local API_VERB="${4}"

  [ -z "${API_VERB}" ] && API_VERB="GET"

  local CURL_CMD=(curl)
  CURL_CMD+=(-s)
  CURL_CMD+=(-X "${API_VERB}")
  CURL_CMD+=("$(fiaha RPCEFAK RPCEAAJ)")
  CURL_CMD+=(\'"$(build-api-endpoint-url "${API_ENDPOINT}" "${API_DOMAIN}" "${API_V}")"\')

  eval ${CURL_CMD[@]}
}

# ------------ Service
function get-service-config() {
  [ -z "${ROOBLES_PROD_SERVICE_CONFIG_DATA}" ] && ROOBLES_PROD_SERVICE_CONFIG_DATA="$(fetch-service-config)"
  echo "${ROOBLES_PROD_SERVICE_CONFIG_DATA}"
}

function fetch-service-config() {
  jq -rc . "${ROOBLES_PROD_SERVICE_CONFIG}"
}

function query-service-config() {
  local CONFIG_QUERY="${1}"

  get-service-config|jq -rc "${CONFIG_QUERY}"
}

function get-service-port() {
  query-service-config '.Http.Port'
}

function get-service-address() {
  query-service-config '.Http.Address'|sed 's/0\.0\.0\.0/localhost/'
}

function build-service-api-url() {
  local API_ENDPOINT="${1}"

  local API_HOST="$(get-service-address)"
  local API_PORT="$(get-service-port)"

  printf 'http://%s:%d/%s\n' "${API_HOST}" "${API_PORT}" "${API_ENDPOINT}"
}

function send-service-request() {
  local HTTP_VERB="${1}"
  local API_ENDPOINT="${2}"
  local PAYLOAD="${3}"

  local HTTP_CMD=(curl)
  HTTP_CMD+=(-s)
  HTTP_CMD+=(-X "${HTTP_VERB}")
  if [ -n "${PAYLOAD}" ]; then
    HTTP_CMD+=(-H "'Content-Type: application/json'")
    HTTP_CMD+=(-d "'$(echo "${PAYLOAD}"|jq -rc .)'")
  fi

  HTTP_CMD+=("'$(build-service-api-url "${API_ENDPOINT}")'")
  eval ${HTTP_CMD[@]}
}

function send-service-get() {
  local API_ENDPOINT="${1}"
  local PAYLOAD="${2}"

  send-service-request 'GET' "${API_ENDPOINT}" "${PAYLOAD}"
}

function stop-service() {
  send-service-request PUT 'roobles/production/service' '{"Status":"Stop"}'
}

function launch-service() {
  #TODO: add flags and checks for mintty
  local SRV_CMD=()
  SRV_CMD+=(mintty)
  SRV_CMD+=(-t "'Roobles Production (Casuals Edition) Service'")
  SRV_CMD+=(-h never)
  SRV_CMD+=(-s 160x50)
  SRV_CMD+=(-o Scrollbar=no)
  SRV_CMD+=(-e $(which bash).exe)
  SRV_CMD+=(-c "'node \"$(readlink -f "${ROOBLES_PROD_SERVICE_SCRIPT}")\"'")

  pushd "${ROOBLES_PROD_SERVICE_DIR}" > /dev/null
  eval ${SRV_CMD[@]}
  popd > /dev/null
}
