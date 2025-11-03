import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DebugPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkTables = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/debug/tables`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      setResults(data);
      console.log('Table check results:', data);
    } catch (error) {
      console.error('Error checking tables:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl mb-4">Database Table Checker</h1>
          <p className="text-slate-600 mb-6">
            This will check which tables exist in your Supabase database and show their structure.
          </p>

          <Button onClick={checkTables} disabled={loading}>
            {loading ? 'Checking...' : 'Check Tables'}
          </Button>

          {results && (
            <div className="mt-6">
              <h2 className="text-xl mb-4">Results:</h2>
              <pre className="bg-slate-900 text-white p-4 rounded-lg overflow-auto max-h-96 text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
