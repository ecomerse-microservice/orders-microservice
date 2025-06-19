#!/bin/bash
echo "Generating Prisma client..."
npx prisma generate
echo "Migrating to PostgreSQL..."
npx prisma migrate dev --name init
echo "Migration completed!"