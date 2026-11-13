#!/usr/bin/env bash

set -euo pipefail

backend_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ -n "${PHP_BINARY:-}" ]]; then
    php_binary="${PHP_BINARY}"
elif command -v php >/dev/null 2>&1; then
    php_binary="$(command -v php)"
else
    php_binary="/opt/lampp/bin/php"
fi

if [[ ! -x "${php_binary}" ]]; then
    echo "PHP was not found at ${php_binary}." >&2
    exit 1
fi

if [[ ! -f "${backend_dir}/.env" ]]; then
    echo "Missing backend/.env. Copy backend/.env.example to backend/.env and configure it first." >&2
    exit 1
fi

exec "${php_binary}" -S localhost:8080 -t "${backend_dir}" "${backend_dir}/router.php"
