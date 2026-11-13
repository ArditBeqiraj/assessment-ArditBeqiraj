#!/usr/bin/env bash

set -euo pipefail

frontend_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -d "${frontend_dir}/node_modules" ]]; then
    echo "Frontend dependencies are missing. Run npm install inside the frontend directory." >&2
    exit 1
fi

cd "${frontend_dir}"
exec npm run dev -- --host localhost --port 5173
