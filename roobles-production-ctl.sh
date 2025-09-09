
#!/bin/bash

SRC_DIR="$(dirname "${0}")"
. "${SRC_DIR}/env.sh" || exit 1

function print-help()
{
  APP_NAME="$(basename "${0}")"
  echo "Usage:"
  echo ""
  echo "  ${APP_NAME} [OPTIONS] [ACTIONS]"
  echo ""
  echo "OPTIONS:"
  echo ""
  echo "  -d  NOOP              Placeholder.  It [d]oes nothing with NOOP."
  echo ""
  echo "ACTIONS:"
  echo ""
  echo "  -S        [S]tarts the service in a mintty window."
  echo "  -K        [K]ills the service gracefully."
  echo "  -h        Prints this [h]elp information and exits."
}

TAR_ACTION=''

ACTION_START_SERVICE='start'
ACTION_STOP_SERVICE='stop'

OPTSTR=':d:SKh'
while getopts ${OPTSTR} opt; do
  case $opt in
    'd')
      FOO_BAZ="${OPTARG}"
      ;;

    'S')
      TAR_ACTION=${ACTION_START_SERVICE}
      ;;

    'K')
      TAR_ACTION=${ACTION_STOP_SERVICE}
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

  *)
    error-out "Unknown Action '${TAR_ACTION}'"
    ;; 
esac
