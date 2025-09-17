export function makeUniqueFileName(base:string) {
  const ext = base.split('.');
  const basefileExt = "."+ext[ext.length-1];
  const now:string = ""+new Date().getTime();
  let random:string = ""+Math.floor(Math.random() * 100000);
  // zero pad random
  random = "" + random;
  while (random.length < 5) {
      random = "0" + random;
  }
  let fileName:string="";
  while (fileName.length < ext.length) {
    fileName = "" + ext[fileName.length];
  }

  
  return base[0].replace(/[^a-zA-Z ]/g, "") + now + random +'__'+fileName+ basefileExt;
}

export function formatFileSize(bytes:number,decimalPoint?:number) {
  if(bytes == 0) return '0 Bytes';
  const k = 1000,
      dm = decimalPoint || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function removeDuplicates(arr:string[]) {
  let unique:string[] = [];
  arr.forEach(element => {
      if (!unique.includes(element)) {
          unique.push(element);
      }
  });
  return unique;
}

export function osName() {
  let OSName = "unknown";
  const navApp = navigator.userAgent.toLowerCase();
  switch (true) {
    case (navApp.indexOf("win") != -1):
      OSName = "windows";
      break;
    case (navApp.indexOf("mac") != -1):
      OSName = "apple";
      break;
    case (navApp.indexOf("linux") != -1):
      OSName = "linux";
      break;
    case (navApp.indexOf("x11") != -1):
      OSName = "unix";
      break;
  }
  console.log(OSName, navApp);
  return OSName;
}

export function sumTo(n:number):number {
  if (n == 1) return 1;
  return n + sumTo(n - 1);
}

/**
 * Convert Google Drive share URL to direct image URL
 * @param url - Google Drive share URL
 * @returns Direct image URL or original URL if not a Google Drive link
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;
  
  // Check if it's a Google Drive URL and extract file ID
  const googleDriveRegex = /https:\/\/drive\.google\.com\/(?:file\/d\/|uc\?id=)([a-zA-Z0-9_-]+)/;
  const match = url.match(googleDriveRegex);
  
  if (match && match[1]) {
    const fileId = match[1];
    // Try the most reliable endpoint for images
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
  }
  
  return url;
}

/**
 * Get multiple Google Drive image URL alternatives
 * @param url - Google Drive share URL
 * @returns Array of possible direct image URLs
 */
export function getGoogleDriveImageUrls(url: string): string[] {
  if (!url || !isGoogleDriveUrl(url)) return [url];
  
  const googleDriveRegex = /https:\/\/drive\.google\.com\/(?:file\/d\/|uc\?id=)([a-zA-Z0-9_-]+)/;
  const match = url.match(googleDriveRegex);
  
  if (match && match[1]) {
    const fileId = match[1];
    return [
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://lh3.googleusercontent.com/d/${fileId}=w400-h400`,
      url // fallback to original
    ];
  }
  
  return [url];
}

/**
 * Check if URL is a Google Drive link
 * @param url - URL to check
 * @returns boolean indicating if it's a Google Drive link
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return /https:\/\/drive\.google\.com\//.test(url);
}