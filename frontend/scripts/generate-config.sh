#!/bin/sh
set -e

CONFIG_FILE="/usr/share/nginx/html/config.js"

API_URL="${REACT_APP_API_URL:-http://localhost:3001}"
SOCKET_URL="${REACT_APP_SOCKET_URL:-http://localhost:3001}"

cat > "$CONFIG_FILE" <<EOF
(function() {
  window.APP_CONFIG = {
    REACT_APP_API_URL: "${API_URL}",
    REACT_APP_SOCKET_URL: "${SOCKET_URL}"
  };
})();
EOF

echo "  REACT_APP_API_URL: ${API_URL}"
echo "  REACT_APP_SOCKET_URL: ${SOCKET_URL}"

exec "$@"

