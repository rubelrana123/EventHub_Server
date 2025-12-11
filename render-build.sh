#!/usr/bin/env bash
# exit on error
set -o errexit

bun install
bun run build
bunx prisma generate
bunx prisma migrate deploy