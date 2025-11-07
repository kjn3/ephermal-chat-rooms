#!/bin/sh
set -e

CONFIG_FILE="/usr/share/nginx/html/config.js"

API_URL="${APP_API_URL:-http://localhost:3001}"
SOCKET_URL="${APP_SOCKET_URL:-http://localhost:3001}"

cat > "$CONFIG_FILE" <<EOF
(function() {
  window.APP_CONFIG = {
    APP_API_URL: "${API_URL}",
    APP_SOCKET_URL: "${SOCKET_URL}"
  };
})();
EOF

echo "  APP_API_URL: ${API_URL}"
echo "  APP_SOCKET_URL: ${SOCKET_URL}"

exec "$@"

