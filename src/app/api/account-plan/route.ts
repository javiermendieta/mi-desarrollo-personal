import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Default accounts for new users
const DEFAULT_ACCOUNTS = [
  { name: 'Ventas de Productos', section: 'gross_sales', type: 'income', order: 1 },
  { name: 'Ventas de Servicios', section: 'gross_sales', type: 'income', order: 2 },
  { name: 'Otros Ingresos', section: 'gross_sales', type: 'income', order: 3 },
  { name: 'Descuentos', section: 'cost_of_sales', type: 'expense', order: 1 },
  { name: 'Devoluciones', section: 'cost_of_sales', type: 'expense', order: 2 },
  { name: 'Materia Prima', section: 'cmv', type: 'expense', order: 1 },
  { name: 'Mano de Obra Directa', section: 'cmv', type: 'expense', order: 2 },
  { name: 'Costos de Producción', section: 'cmv', type: 'expense', order: 3 },
  { name: 'Alquiler', section: 'operating_expenses', type: 'expense', order: 1 },
  { name: 'Sueldos y Salarios', section: 'operating_expenses', type: 'expense', order: 2 },
  { name: 'Servicios (Luz, Agua, Gas)', section: 'operating_expenses', type: 'expense', order: 3 },
  { name: 'Marketing y Publicidad', section: 'operating_expenses', type: 'expense', order: 4 },
  { name: 'Servicios Profesionales', section: 'operating_expenses', type: 'expense', order: 5 },
  { name: 'Impuestos', section: 'operating_expenses', type: 'expense', order: 6 },
  { name: 'Otros Gastos', section: 'operating_expenses', type: 'expense', order: 7 },
];

// Helper function to initialize default accounts
async function initializeDefaultAccounts(userId: string) {
  const existingCount = await db.accountPlanItem.count({
    where: { userId, isActive: true }
  });
  
  if (existingCount > 0) {
    return await db.accountPlanItem.findMany({
      where: { userId, isActive: true },
      orderBy: [{ section: 'asc' }, { order: 'asc' }]
    });
  }
  
  const created = [];
  for (const account of DEFAULT_ACCOUNTS) {
    const newAccount = await db.accountPlanItem.create({
      data: {
        id: uuidv4(),
        userId,
        name: account.name,
        type: account.type,
        section: account.section,
        category: account.section,
        order: account.order,
        isDefault: true,
        isActive: true,
      }
    });
    created.push(newAccount);
  }
  
  return created;
}

// GET - Obtener plan de cuentas (e inicializar si está vacío)
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  console.log('GET /api/account-plan - userId:', userId);
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    // Auto-initialize if empty
    const accountPlan = await initializeDefaultAccounts(userId);
    
    console.log('Account plan items:', accountPlan.length);
    
    return NextResponse.json(accountPlan.map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      section: a.section,
      category: a.category,
      subcategory: a.subcategory,
      order: a.order,
      isDefault: a.isDefault,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching account plan:', error);
    return NextResponse.json({ error: 'Error al obtener plan de cuentas', details: String(error) }, { status: 500 });
  }
}

// POST - Crear item del plan de cuentas
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    const account = await db.accountPlanItem.create({
      data: {
        id: data.id || uuidv4(),
        userId,
        code: data.code || '',
        name: data.name,
        type: data.type || 'expense',
        section: data.section || data.category || 'operating_expenses',
        category: data.category || data.section,
        subcategory: data.subcategory || null,
        order: data.order || 0,
        isDefault: data.isDefault || false,
        isActive: true,
      }
    });
    
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating account plan item:', error);
    return NextResponse.json({ error: 'Error al crear cuenta', details: String(error) }, { status: 500 });
  }
}

// PUT - Actualizar o crear item del plan de cuentas (upsert)
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido para PUT' }, { status: 400 });
    }

    // Use upsert to create if not exists, update if exists
    const account = await db.accountPlanItem.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId,
        code: data.code || '',
        name: data.name,
        type: data.type || 'expense',
        section: data.section || data.category || 'operating_expenses',
        category: data.category || data.section || 'operating_expenses',
        subcategory: data.subcategory || null,
        order: data.order || 0,
        isDefault: data.isDefault || false,
        isActive: true,
      },
      update: {
        code: data.code,
        name: data.name,
        type: data.type,
        section: data.section || data.category,
        category: data.category || data.section,
        subcategory: data.subcategory,
        order: data.order,
        isDefault: data.isDefault,
      }
    });
    
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error upserting account plan item:', error);
    return NextResponse.json({ error: 'Error al guardar cuenta', details: String(error) }, { status: 500 });
  }
}

// DELETE - Eliminar item del plan de cuentas (soft delete)
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await db.accountPlanItem.update({
      where: { id, userId },
      data: { isActive: false }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account plan item:', error);
    return NextResponse.json({ error: 'Error al eliminar cuenta' }, { status: 500 });
  }
}
