#!/bin/bash
# Script para iniciar el servidor de desarrollo con las variables de entorno correctas

export DATABASE_URL="postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

npm run dev
