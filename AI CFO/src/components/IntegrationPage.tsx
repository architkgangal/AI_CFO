import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Brain, Upload, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const SESSION_KEY = 'ai_cfo_session_token';

interface IntegrationOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  comingSoon?: boolean;
}

const integrations: IntegrationOption[] = [
  { id: 'square', name: 'Square', description: 'Retail & Point of Sale', icon: '🔲', comingSoon: true },
  { id: 'shopify', name: 'Shopify', description: 'E-commerce & POS', icon: '🛍️', comingSoon: true },
  { id: 'plaid', name: 'Plaid', description: 'Bank Feeds & Transactions', icon: '🏦', comingSoon: true },
  { id: 'clover', name: 'Clover', description: 'Restaurant POS', icon: '🍽️', comingSoon: true },
  { id: 'quickbooks', name: 'QuickBooks Online', description: 'Accounting Software', icon: '📊', comingSoon: true },
];

export function IntegrationPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Check auth on mount
  useEffect(() => {
    console.log('════════════════════════════════════════');
    console.log('📄 IntegrationPage Loaded');
    console.log('════════════════════════════════════════');
    const token = localStorage.getItem(SESSION_KEY);
    const user = localStorage.getItem('ai_cfo_user');
    console.log('Session token in localStorage:', token ? 'EXISTS' : 'MISSING');
    console.log('Session token value:', token);
    console.log('User in localStorage:', user ? 'EXISTS' : 'MISSING');
    
    // Redirect to login if no session
    if (!token || !user) {
      console.log('❌ No session found, redirecting to login');
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    
    console.log('✅ Session found, user can upload');
    console.log('════════════════════════════════════════\n');
  }, [navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      toast.error('Please upload a CSV or Excel file');
      e.target.value = ''; // Reset input
      return;
    }

    setSelectedFile(file);
    toast.success(`File selected: ${file.name}`);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    const sessionToken = localStorage.getItem(SESSION_KEY);
    console.log('════════════════════════════════════════');
    console.log('📤 Starting File Upload');
    console.log('════════════════════════════════════════');
    console.log('Session token exists:', sessionToken ? 'YES' : 'NO');
    console.log('Session token value:', sessionToken);
    console.log('Session token length:', sessionToken?.length);
    
    if (!sessionToken) {
      console.error('❌ No session token found in localStorage');
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      console.log('Starting upload for file:', selectedFile.name, 'Size:', selectedFile.size);
      const formData = new FormData();
      formData.append('file', selectedFile);

      setUploadProgress(30);

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/data/upload`;
      
      console.log('📡 Upload URL:', url);
      console.log('📦 Session token:', sessionToken.substring(0, 20) + '...');
      console.log('🔑 Public anon key:', publicAnonKey.substring(0, 20) + '...');
      console.log('📄 File name:', selectedFile.name);
      console.log('📄 File size:', selectedFile.size, 'bytes');
      console.log('Sending request to server...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Session-Token': sessionToken,
        },
        body: formData,
      });

      setUploadProgress(70);

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📥 Response data:', data);
      } else {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        console.error('❌ Upload failed with status:', response.status);
        console.error('❌ Error data:', data);
        
        // If unauthorized, clear session and redirect to login
        if (response.status === 401) {
          console.error('❌ Session is invalid, clearing and redirecting to login');
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem('ai_cfo_user');
          toast.error('Session expired. Please login again.');
          navigate('/login');
          return;
        }
        
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setUploadProgress(100);
      console.log('✅ Upload successful!');
      toast.success(`Successfully uploaded ${data.rowCount} transactions!`);
      
      // Clear the file selection
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Navigate to dashboard after a short delay
      console.log('🚀 Navigating to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Upload error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      toast.error(error.message || 'Failed to upload file');
      setUploadProgress(0);
      
      // Reset file input on error
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl">AI CFO</h1>
          </div>
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-4">Connect Your Data Sources</h2>
          <p className="text-xl text-slate-600">
            Choose how you'd like to get started with AI CFO
          </p>
        </div>

        {/* Integration Options */}
        <div className="mb-12">
          <h3 className="text-2xl mb-6">Select Systems to Connect</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card
                key={integration.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-not-allowed opacity-60"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{integration.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-lg mb-1">{integration.name}</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      {integration.description}
                    </p>
                    {integration.comingSoon && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Manual Upload Section */}
        <div>
          <h3 className="text-2xl mb-6">Or Upload Your Data Manually</h3>
          <Card className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl mb-2">Upload CSV or Excel File</h4>
                <p className="text-slate-600 mb-4">
                  Upload a file containing your transaction data to get started immediately
                </p>

                {/* Important Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-900 mb-1">
                        <strong>Note:</strong> Uploaded data is temporary until you save it to the database.
                      </p>
                      <p className="text-blue-700 mb-1">
                        After uploading, you'll see a "Save to Database" button on the dashboard to permanently store your data.
                      </p>
                      <p className="text-blue-700">
                        <strong>Multiple uploads:</strong> Each save adds to your existing database - all your transaction data is aggregated together.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Required Columns Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm mb-2">
                        Your file must include these mandatory columns:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Date</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Time</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Transaction_ID</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Customer_ID</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Product_Service_Name</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Category</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Subcategory</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Brand</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Price</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-4">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-lg mb-2">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-slate-500">
                      CSV or Excel files only
                    </p>
                  </label>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Uploading and processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="flex-1"
                    size="lg"
                  >
                    {isUploading ? 'Processing...' : 'Upload and Analyze'}
                  </Button>
                  {selectedFile && !isUploading && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedFile(null)}
                      size="lg"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
