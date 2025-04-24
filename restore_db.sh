#!/bin/bash

DUMP_FILE="./db/dump_23_04_1725.sql"
DB_CONTAINER_NAME="db"
DB_NAME="mydb"
DB_USER="user"

echo "Ensuring correct permissions on ./db..."
chmod 700 ./db

echo "Copying SQL dump to container..."
if docker cp "$DUMP_FILE" "$DB_CONTAINER_NAME":/tmp/dump.sql; then
  echo "Restoring database inside container..."
  docker exec -i "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/dump.sql
  if [ $? -eq 0 ]; then
    echo " Database restored successfully."
  else
    echo " Database restore failed."
  fi
else
  echo " Failed to copy SQL dump into the container."
fi

