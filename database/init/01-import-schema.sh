#!/bin/bash
set -e
set -o pipefail

sed -E '/^[[:space:]]*(CREATE[[:space:]]+DATABASE|USE[[:space:]])/Id' \
  "/schema/Base - Datos.sql" |
  MYSQL_PWD="${MYSQL_PASSWORD}" mysql --user="${MYSQL_USER}" "${MYSQL_DATABASE}"
