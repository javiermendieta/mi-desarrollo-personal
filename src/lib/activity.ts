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

    // Leer el texto de la respuesta primero
    const text = await response.text();

    // Solo intentar parsear JSON si hay contenido
    if (text && text.trim()) {
      try {
        const result = JSON.parse(text);
        if (!response.ok) {
          console.error('Error al guardar actividad:', result);
        }
      } catch {
        // Error parsing JSON, ignorar silenciosamente
        if (!response.ok) {
          console.error('Error al guardar actividad: respuesta inválida');
        }
      }
    }
  } catch (error) {
    // Solo log en consola, no mostrar alert al usuario
    console.error('Error tracking activity:', error);
  }
}
