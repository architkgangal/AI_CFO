import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

const SESSION_KEY = 'ai_cfo_session_token';
const USER_KEY = 'ai_cfo_user';

export function SessionDebug() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const loadSession = () => {
    const token = localStorage.getItem(SESSION_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    
    setSessionToken(token);
    
    if (userJson) {
      try {
        setUser(JSON.parse(userJson));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <Card className="p-6 bg-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Session Debug Info</h3>
        <Button size="sm" variant="outline" onClick={loadSession}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3 text-sm font-mono">
        <div>
          <div className="text-slate-600 mb-1">Session Token:</div>
          <div className="bg-white p-2 rounded border break-all">
            {sessionToken ? (
              <>
                <span className="text-green-600">✓ EXISTS</span>
                <div className="mt-1 text-xs text-slate-500">
                  {sessionToken.substring(0, 30)}...
                </div>
              </>
            ) : (
              <span className="text-red-600">✗ NOT FOUND</span>
            )}
          </div>
        </div>

        <div>
          <div className="text-slate-600 mb-1">User Data:</div>
          <div className="bg-white p-2 rounded border">
            {user ? (
              <div className="space-y-1">
                <div><span className="text-green-600">✓ EXISTS</span></div>
                <div className="text-xs">
                  <div>Email: {user.email}</div>
                  <div>Name: {user.name}</div>
                  <div>ID: {user.id}</div>
                </div>
              </div>
            ) : (
              <span className="text-red-600">✗ NOT FOUND</span>
            )}
          </div>
        </div>

        <div>
          <div className="text-slate-600 mb-1">LocalStorage Keys:</div>
          <div className="bg-white p-2 rounded border text-xs">
            <div>Session Key: "{SESSION_KEY}"</div>
            <div>User Key: "{USER_KEY}"</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
