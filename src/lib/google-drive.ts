/**
 * Google Drive Integration for Course Content Delivery
 * 
 * Uses Google Drive API to share course materials with students.
 * Requires a Google Cloud service account with Drive API enabled.
 */

// Course folder mapping (slug -> Google Drive folder ID)
// You can add folder IDs here or store them in the database
const COURSE_FOLDERS: Record<string, string> = {
  // Example mappings - replace with actual folder IDs
  // 'chatgpt-masterclass': '1abc123...',
  // 'n8n-automacao-avancada': '1def456...',
};

// Google API configuration
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Get Google Drive folder ID for a course
 * Returns the folder ID if configured, or null
 */
export async function getCourseGoogleDriveFolder(courseSlug: string): Promise<string | null> {
  // First check local mapping
  if (COURSE_FOLDERS[courseSlug]) {
    return COURSE_FOLDERS[courseSlug];
  }
  
  // TODO: Check database for folder mapping
  // const courseProduct = await StoreProduct.findOne({ slug: courseSlug });
  // if (courseProduct?.courseContent?.googleDriveFolderId) {
  //   return courseProduct.courseContent.googleDriveFolderId;
  // }
  
  return null;
}

/**
 * Share a Google Drive folder with a user
 * Creates a reader permission for the user's email
 */
export async function shareGoogleDriveFolder(
  folderId: string,
  userEmail: string
): Promise<string> {
  // If no service account configured, return direct link
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.log('[Google Drive] Service account not configured, returning direct link');
    return `https://drive.google.com/drive/folders/${folderId}`;
  }

  try {
    // Get access token from service account
    const accessToken = await getServiceAccountToken();
    
    // Create permission for user
    const permissionResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'user',
          role: 'reader',
          emailAddress: userEmail,
        }),
      }
    );

    if (!permissionResponse.ok) {
      const error = await permissionResponse.text();
      console.error('[Google Drive] Permission error:', error);
      // Return direct link even if permission fails
      return `https://drive.google.com/drive/folders/${folderId}`;
    }

    // Send notification email via Google
    const notifyResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/permissions?sendNotificationEmail=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'user',
          role: 'reader',
          emailAddress: userEmail,
        }),
      }
    );

    console.log(`[Google Drive] Shared folder ${folderId} with ${userEmail}`);
    
    return `https://drive.google.com/drive/folders/${folderId}`;
  } catch (error) {
    console.error('[Google Drive] Share error:', error);
    // Return direct link as fallback
    return `https://drive.google.com/drive/folders/${folderId}`;
  }
}

/**
 * Revoke access to a Google Drive folder
 */
export async function revokeGoogleDriveAccess(
  folderId: string,
  userEmail: string
): Promise<boolean> {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.log('[Google Drive] Service account not configured');
    return false;
  }

  try {
    const accessToken = await getServiceAccountToken();
    
    // First, get the permission ID for this user
    const permissionsResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/permissions`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!permissionsResponse.ok) {
      console.error('[Google Drive] Failed to get permissions');
      return false;
    }

    const permissions = await permissionsResponse.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPermission = permissions.permissions?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.emailAddress?.toLowerCase() === userEmail.toLowerCase()
    );

    if (!userPermission) {
      console.log('[Google Drive] User permission not found');
      return true; // Already no access
    }

    // Delete the permission
    const deleteResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/permissions/${userPermission.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      console.error('[Google Drive] Failed to delete permission');
      return false;
    }

    console.log(`[Google Drive] Revoked access for ${userEmail} from folder ${folderId}`);
    return true;
  } catch (error) {
    console.error('[Google Drive] Revoke error:', error);
    return false;
  }
}

/**
 * Get service account access token using JWT
 */
async function getServiceAccountToken(): Promise<string> {
  // Create JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // Create JWT claim set
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: GOOGLE_SCOPES.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
  };

  // Encode header and claim set
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  // Sign with RSA-SHA256
  const signature = await signWithRSA(signatureInput, GOOGLE_PRIVATE_KEY);
  const jwt = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  const base64 = Buffer.from(str).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sign data with RSA-SHA256
 * Note: In production, use a proper crypto library like 'crypto' or 'jose'
 */
async function signWithRSA(data: string, privateKey: string): Promise<string> {
  // Use Node.js crypto module
  const crypto = await import('crypto');
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  const signature = sign.sign(privateKey, 'base64');
  
  // Convert to base64url
  return signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * List files in a Google Drive folder
 */
export async function listFolderContents(folderId: string): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
}>> {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    return [];
  }

  try {
    const accessToken = await getServiceAccountToken();
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size,webViewLink)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('[Google Drive] List error:', error);
    return [];
  }
}

/**
 * Create a download link for a file (expires in 1 hour)
 */
export async function createDownloadLink(fileId: string): Promise<string | null> {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  try {
    const accessToken = await getServiceAccountToken();
    
    // Get file metadata with download link
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    const data = await response.json();
    return data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;
  } catch (error) {
    console.error('[Google Drive] Download link error:', error);
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
}

/**
 * Set a course's Google Drive folder ID
 * Call this to configure which folder contains a course's materials
 */
export function setCourseFolder(courseSlug: string, folderId: string): void {
  COURSE_FOLDERS[courseSlug] = folderId;
}

export default {
  getCourseGoogleDriveFolder,
  shareGoogleDriveFolder,
  revokeGoogleDriveAccess,
  listFolderContents,
  createDownloadLink,
  setCourseFolder,
};
