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
    console.log('=== TrackActivity called ===', { type, action, title, referenceId });
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
    const result = await response.json();
    console.log('=== TrackActivity response ===', result);
    
    if (!response.ok) {
      alert('Error al guardar actividad: ' + JSON.stringify(result));
    }
  } catch (error) {
    console.error('Error tracking activity:', error);
    alert('Error tracking: ' + error);
  }
}
