import { projectId, publicAnonKey } from './info';

export { projectId, publicAnonKey };

const SESSION_KEY = 'ai_cfo_session_token';
const USER_KEY = 'ai_cfo_user';

// Helper function to get current session token
export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

// Helper function to get current user from localStorage
export function getCurrentUser() {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

// Helper function to verify session with server
export async function verifySession() {
  const sessionToken = getSessionToken();
  if (!sessionToken) return null;

  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/auth/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Session-Token': sessionToken,
        },
      }
    );

    if (!response.ok) {
      // Session is invalid, clear it
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }

    console.log('✅ Login successful, storing session token');
    console.log('Session token:', data.sessionToken);
    console.log('User:', data.user);
    
    // Store session token and user data in localStorage
    localStorage.setItem(SESSION_KEY, data.sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    console.log('✅ Session stored in localStorage');
    console.log('Key used:', SESSION_KEY);
    console.log('Verification - token exists:', localStorage.getItem(SESSION_KEY) ? 'YES' : 'NO');

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Sign up new user (via server, adds to ai_cfo table)
export async function signUp(email: string, password: string, name?: string) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/auth/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }

    // Store session token and user data in localStorage
    localStorage.setItem(SESSION_KEY, data.sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

// Sign out
export async function signOut() {
  const sessionToken = getSessionToken();
  
  if (sessionToken) {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/auth/logout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': sessionToken,
          },
        }
      );
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // Clear localStorage
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}
