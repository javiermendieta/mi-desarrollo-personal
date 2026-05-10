// Activity tracking helper

export type ActivityType = 'habit' | 'sport' | 'yoga' | 'meditation' | 'reading' | 'diary' | 'goal' | 'health' | 'finance' | 'calendar' | 'note';
export type ActivityAction = 'completed' | 'created' | 'updated' | 'deleted' | 'progress';

export async function trackActivity(
  type: ActivityType,
  action: ActivityAction,
  title: string,
  referenceId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        action,
        title,
        referenceId,
        details,
      }),
    });
    
    // Solo parsear JSON si hay contenido
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      if (!response.ok) {
        console.error('Error al guardar actividad:', result);
      }
    } else if (!response.ok) {
      console.error('Error al guardar actividad: respuesta no válida');
    }
  } catch (error) {
    // Solo log en consola, no mostrar alert al usuario
    console.error('Error tracking activity:', error);
  }
}
