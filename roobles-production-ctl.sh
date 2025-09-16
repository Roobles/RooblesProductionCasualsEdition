
#!/bin/bash

SRC_DIR="$(dirname "${0}")"
. "${SRC_DIR}/env.sh" || exit 1

TARGET_ENDPOINT=''
TARGET_VERB='GET'
TARGET_PAYLOAD=''

function print-api() {
  send-service-get 'roobles/api'|jq .
}

function print-help()
{
  APP_NAME="$(basename "${0}")"
  echo "Usage:"
  echo ""
  echo "  ${APP_NAME} [OPTIONS] [ACTIONS]"
  echo ""
  echo "OPTIONS:"
  echo ""
  echo "  -e  ENDPOINT    API ENDPOINT of arbitrary call."
  echo "  -v  VERB        Http VERB for arbitrary API call. (Default: ${TARGET_VERB})"
  echo "  -p  PAYLOAD     PAYLOAD of arbitrary API call."
  echo ""
  echo "ACTIONS:"
  echo ""
  echo "  -S        [S]tarts the service in a mintty window."
  echo "  -K        [K]ills the service gracefully."
  echo "  -A        Prints available [A]PI endpoints."
  echo "  -h        Prints this [h]elp information and exits."
}

TAR_ACTION=''

ACTION_START_SERVICE='start'
ACTION_STOP_SERVICE='stop'
ACTION_API_CALL='api'
ACTION_PRINT_API='print_api'

OPTSTR=':e:v:p:SKAh'
while getopts ${OPTSTR} opt; do
  case $opt in
    'e')
      TARGET_ENDPOINT="$(echo "${OPTARG}"|sed 's/^\///')"
      TAR_ACTION=${ACTION_API_CALL}
      ;;

    'v')
      TARGET_VERB="${OPTARG^^}"
      ;;

    'p')
      TARGET_PAYLOAD="${OPTARG}"
      ;;

    'S')
      TAR_ACTION=${ACTION_START_SERVICE}
      ;;

    'K')
      TAR_ACTION=${ACTION_STOP_SERVICE}
      ;;

    'A')
      TAR_ACTION=${ACTION_PRINT_API}
      ;;

    'h')
      print-help
      exit 0
      ;;
  esac
done

[ -z "${TAR_ACTION}" ] && error-out "Must specify an action parameter."

case ${TAR_ACTION} in
  ${ACTION_START_SERVICE})
    launch-service
    ;;

  ${ACTION_STOP_SERVICE})
    stop-service
    ;;

  ${ACTION_API_CALL})
    send-service-request "${TARGET_VERB}" "${TARGET_ENDPOINT}" "${TARGET_PAYLOAD}"
    ;;

  ${ACTION_PRINT_API})
    print-api
    ;;

  *)
    error-out "Unknown Action '${TAR_ACTION}'"
    ;; 
esac
