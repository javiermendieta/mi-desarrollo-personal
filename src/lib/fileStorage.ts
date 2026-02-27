import localforage from 'localforage';

// Configure localforage for file storage
const fileStore = localforage.createInstance({
  name: 'mi-desarrollo-personal',
  storeName: 'files',
  description: 'File storage for projects',
});

// Save a file and return its key
export async function saveFile(key: string, fileData: string): Promise<void> {
  try {
    await fileStore.setItem(key, fileData);
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

// Get a file by key
export async function getFile(key: string): Promise<string | null> {
  try {
    return await fileStore.getItem<string>(key);
  } catch (error) {
    console.error('Error getting file:', error);
    return null;
  }
}

// Delete a file by key
export async function deleteFile(key: string): Promise<void> {
  try {
    await fileStore.removeItem(key);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Clear all files
export async function clearAllFiles(): Promise<void> {
  try {
    await fileStore.clear();
  } catch (error) {
    console.error('Error clearing files:', error);
  }
}

// Convert base64 data URL to blob URL for viewing
export function dataUrlToBlobUrl(dataUrl: string): string {
  // Extract mime type from base64 data URL
  const mimeMatch = dataUrl.match(/^data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  
  // Convert base64 to blob
  const base64Data = dataUrl.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Get file type from filename
export function getFileType(fileName: string): 'pdf' | 'word' | 'excel' | 'image' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext || '')) return 'word';
  if (['xls', 'xlsx'].includes(ext || '')) return 'excel';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
  return 'other';
}

// Check if file type is viewable in browser
export function isViewableInBrowser(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
}
