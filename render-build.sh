#!/usr/bin/env bash
# exit on error
set -o errexit

bun install
bun run build
npx prisma generate
npx prisma migrate deploy