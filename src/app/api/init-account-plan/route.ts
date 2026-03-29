import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Default accounts for new users
const DEFAULT_ACCOUNTS = [
  // Venta Bruta (Ingresos)
  { name: 'Ventas de Productos', section: 'gross_sales', type: 'income', order: 1 },
  { name: 'Ventas de Servicios', section: 'gross_sales', type: 'income', order: 2 },
  { name: 'Otros Ingresos', section: 'gross_sales', type: 'income', order: 3 },
  // Costo de Ventas
  { name: 'Descuentos', section: 'cost_of_sales', type: 'expense', order: 1 },
  { name: 'Devoluciones', section: 'cost_of_sales', type: 'expense', order: 2 },
  // CMV
  { name: 'Materia Prima', section: 'cmv', type: 'expense', order: 1 },
  { name: 'Mano de Obra Directa', section: 'cmv', type: 'expense', order: 2 },
  { name: 'Costos de Producción', section: 'cmv', type: 'expense', order: 3 },
  // Gastos Operativos
  { name: 'Alquiler', section: 'operating_expenses', type: 'expense', order: 1 },
  { name: 'Sueldos y Salarios', section: 'operating_expenses', type: 'expense', order: 2 },
  { name: 'Servicios (Luz, Agua, Gas)', section: 'operating_expenses', type: 'expense', order: 3 },
  { name: 'Marketing y Publicidad', section: 'operating_expenses', type: 'expense', order: 4 },
  { name: 'Servicios Profesionales', section: 'operating_expenses', type: 'expense', order: 5 },
  { name: 'Impuestos', section: 'operating_expenses', type: 'expense', order: 6 },
  { name: 'Otros Gastos', section: 'operating_expenses', type: 'expense', order: 7 },
];

// GET - Ver estado del plan de cuentas y si necesita inicialización
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  console.log('GET /api/init-account-plan - userId:', userId);
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const accounts = await db.accountPlanItem.findMany({
      where: { userId, isActive: true },
      orderBy: [{ section: 'asc' }, { order: 'asc' }]
    });
    
    console.log('Found accounts:', accounts.length);
    
    return NextResponse.json({
      userId,
      count: accounts.length,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        section: a.section,
        isDefault: a.isDefault,
      })),
      needsInit: accounts.length === 0
    });
  } catch (error) {
    console.error('Error checking account plan:', error);
    return NextResponse.json({ error: 'Error al verificar plan de cuentas', details: String(error) }, { status: 500 });
  }
}

// POST - Inicializar plan de cuentas por defecto
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  console.log('POST /api/init-account-plan - userId:', userId);
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    // Verificar si ya tiene cuentas
    const existingCount = await db.accountPlanItem.count({
      where: { userId, isActive: true }
    });
    
    console.log('Existing account plan items:', existingCount);
    
    if (existingCount > 0) {
      // Retornar las cuentas existentes
      const existing = await db.accountPlanItem.findMany({
        where: { userId, isActive: true },
        orderBy: [{ section: 'asc' }, { order: 'asc' }]
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Ya tienes cuentas configuradas',
        count: existingCount,
        accounts: existing.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          section: a.section,
          isDefault: a.isDefault,
        }))
      });
    }
    
    // Crear cuentas por defecto
    const created = [];
    for (const account of DEFAULT_ACCOUNTS) {
      const id = uuidv4();
      const newAccount = await db.accountPlanItem.create({
        data: {
          id,
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
      created.push({
        id: newAccount.id,
        name: newAccount.name,
        type: newAccount.type,
        section: newAccount.section,
        isDefault: newAccount.isDefault,
      });
      console.log('Created account:', newAccount.id, newAccount.name);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Se crearon ${created.length} cuentas`,
      count: created.length,
      accounts: created 
    });
  } catch (error) {
    console.error('Error initializing account plan:', error);
    return NextResponse.json({ 
      error: 'Error al inicializar plan de cuentas',
      details: String(error) 
    }, { status: 500 });
  }
}
