#!/bin/bash

# Script para configurar las variables de entorno en Vercel
# Ejecutar este script después de instalar Vercel CLI: npm i -g vercel

echo "=========================================="
echo "Configurando variables de entorno en Vercel"
echo "=========================================="

# Variables de base de datos
DATABASE_URL="postgresql://postgres.rhckmjhtqovfcgfwhpoj:BaTsgtgGNzc9iME8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.rhckmjhtqovfcgfwhpoj:BaTsgtgGNzc9iME8@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

echo ""
echo "Configurando DATABASE_URL..."
vercel env add DATABASE_URL production <<< "$DATABASE_URL"
vercel env add DATABASE_URL preview <<< "$DATABASE_URL"
vercel env add DATABASE_URL development <<< "$DATABASE_URL"

echo ""
echo "Configurando DIRECT_URL..."
vercel env add DIRECT_URL production <<< "$DIRECT_URL"
vercel env add DIRECT_URL preview <<< "$DIRECT_URL"
vercel env add DIRECT_URL development <<< "$DIRECT_URL"

echo ""
echo "=========================================="
echo "Variables configuradas correctamente"
echo "Ahora ejecuta: vercel --prod"
echo "=========================================="
