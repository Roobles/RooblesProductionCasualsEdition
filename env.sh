ROOBLES_PROD_CASUAL_SRC_DIR="$(dirname "${BASH_SOURCE[0]}")"

. "${ROOBLES_PROD_CASUAL_SRC_DIR}/api-parse.sh" || exit 1

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
