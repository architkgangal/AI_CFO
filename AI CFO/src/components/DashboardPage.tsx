import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Brain, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, LogOut, Upload, Briefcase, Database, Trash2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const SESSION_KEY = 'ai_cfo_session_token';
const USER_KEY = 'ai_cfo_user';

interface Transaction {
  Date: string;
  Time: string;
  Transaction_ID: string;
  Customer_ID: string;
  Product_Service_Name: string;
  Category: string;
  Subcategory: string;
  Brand: string;
  Price: string;
}

interface AnalyticsData {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  revenueGrowth: number;
  uniqueCustomers: number;
  avgTransactionsPerCustomer: number;
  uniqueProducts: number;
  businessCategories: number;
  uniqueBrands: number;
  topCategories: { name: string; value: number; revenue: number }[];
  topProducts: { name: string; count: number; revenue: number }[];
  dailyRevenue: { date: string; revenue: number; transactions: number }[];
  categoryBreakdown: { category: string; revenue: number; percentage: number }[];
  customerAnalytics: { customerId: string; transactionCount: number; totalSpent: number; avgTransaction: number }[];
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploadedAt, setUploadedAt] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    const userData = localStorage.getItem(USER_KEY);

    if (!sessionToken || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    await fetchData(sessionToken);
  };

  const fetchData = async (sessionToken: string) => {
    setLoading(true);
    try {
      console.log('📊 Fetching dashboard data...');
      console.log('🔑 Using public anon key:', publicAnonKey.substring(0, 20) + '...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/data/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': sessionToken,
          },
        }
      );

      const data = await response.json();
      console.log('📊 Dashboard data response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Session invalid on dashboard');
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(USER_KEY);
          toast.error('Session expired. Please login again.');
          navigate('/login');
          return;
        }
        throw new Error(data.error || 'Failed to fetch data');
      }

      if (data.hasData && data.records && data.records.length > 0) {
        console.log('✅ Data loaded successfully:', data.recordCount, 'records');
        setHasData(true);
        setFileName(data.fileName || 'Unknown');
        setUploadedAt(data.uploadedAt || '');
        setIsSaved(data.isSaved || false);
        analyzeData(data.records);
      } else {
        console.log('ℹ️ No data uploaded yet');
        setHasData(false);
      }
    } catch (error: any) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/data/save-to-database`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': sessionToken,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save to database');
      }

      console.log('✅ Data saved to database:', data);
      
      // Show appropriate message based on whether this is new data or additional data
      if (data.previousTotal > 0) {
        toast.success(`Added ${data.savedCount} new transactions! Total in database: ${data.totalSaved}`);
      } else {
        toast.success(`Successfully saved ${data.savedCount} transactions to database!`);
      }
      
      setIsSaved(true);
      
      // Refresh data to show saved database records
      await fetchData(sessionToken);
    } catch (error: any) {
      console.error('Save to database error:', error);
      toast.error(error.message || 'Failed to save to database');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDatabase = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) return;

    setIsClearing(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b3b8d743/data/clear-database`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': sessionToken,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear database');
      }

      console.log('✅ Database cleared:', data);
      toast.success(`Successfully cleared ${data.deletedCount} transactions from database!`);
      
      // Reset state
      setHasData(false);
      setAnalytics(null);
      setIsSaved(false);
      setFileName('');
      setUploadedAt('');
    } catch (error: any) {
      console.error('Clear database error:', error);
      toast.error(error.message || 'Failed to clear database');
    } finally {
      setIsClearing(false);
    }
  };

  const analyzeData = (transactions: Transaction[]) => {
    // Calculate total revenue
    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.Price), 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalRevenue / totalTransactions;

    // Count unique customers
    const uniqueCustomers = new Set(transactions.map(t => t.Customer_ID)).size;
    const avgTransactionsPerCustomer = totalTransactions / uniqueCustomers;

    // Count unique products/services
    const uniqueProducts = new Set(transactions.map(t => t.Product_Service_Name)).size;

    // Count business categories (unique categories)
    const businessCategories = new Set(transactions.map(t => t.Category)).size;

    // Count unique brands (active staff members approximation)
    const uniqueBrands = new Set(transactions.map(t => t.Brand)).size;

    // Calculate revenue growth (comparing first half vs second half of data)
    const midPoint = Math.floor(transactions.length / 2);
    const firstHalfRevenue = transactions.slice(0, midPoint).reduce((sum, t) => sum + parseFloat(t.Price), 0);
    const secondHalfRevenue = transactions.slice(midPoint).reduce((sum, t) => sum + parseFloat(t.Price), 0);
    const revenueGrowth = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

    // Group by category
    const categoryMap = new Map<string, { count: number; revenue: number }>();
    transactions.forEach(t => {
      const price = parseFloat(t.Price);
      const existing = categoryMap.get(t.Category) || { count: 0, revenue: 0 };
      categoryMap.set(t.Category, {
        count: existing.count + 1,
        revenue: existing.revenue + price
      });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, value: data.count, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // Group by product
    const productMap = new Map<string, { count: number; revenue: number }>();
    transactions.forEach(t => {
      const price = parseFloat(t.Price);
      const existing = productMap.get(t.Product_Service_Name) || { count: 0, revenue: 0 };
      productMap.set(t.Product_Service_Name, {
        count: existing.count + 1,
        revenue: existing.revenue + price
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Group by date
    const dateMap = new Map<string, { revenue: number; transactions: number }>();
    transactions.forEach(t => {
      const price = parseFloat(t.Price);
      const existing = dateMap.get(t.Date) || { revenue: 0, transactions: 0 };
      dateMap.set(t.Date, {
        revenue: existing.revenue + price,
        transactions: existing.transactions + 1
      });
    });

    const dailyRevenue = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, revenue: data.revenue, transactions: data.transactions }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Category breakdown with percentages
    const categoryBreakdown = topCategories.map(cat => ({
      category: cat.name,
      revenue: cat.revenue,
      percentage: (cat.revenue / totalRevenue) * 100
    }));

    // Customer analytics - average transaction per customer
    const customerMap = new Map<string, { count: number; totalSpent: number }>();
    transactions.forEach(t => {
      const price = parseFloat(t.Price);
      const existing = customerMap.get(t.Customer_ID) || { count: 0, totalSpent: 0 };
      customerMap.set(t.Customer_ID, {
        count: existing.count + 1,
        totalSpent: existing.totalSpent + price
      });
    });

    const customerAnalytics = Array.from(customerMap.entries())
      .map(([customerId, data]) => ({
        customerId,
        transactionCount: data.count,
        totalSpent: data.totalSpent,
        avgTransaction: data.totalSpent / data.count
      }))
      .sort((a, b) => b.avgTransaction - a.avgTransaction);

    setAnalytics({
      totalRevenue,
      totalTransactions,
      averageTransaction,
      revenueGrowth,
      uniqueCustomers,
      avgTransactionsPerCustomer,
      uniqueProducts,
      businessCategories,
      uniqueBrands,
      topCategories,
      topProducts,
      dailyRevenue,
      categoryBreakdown,
      customerAnalytics
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleUploadNew = () => {
    navigate('/integration');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl">AI CFO Dashboard</h1>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <Upload className="w-16 h-16 text-slate-400 mx-auto mb-6" />
          <h2 className="text-3xl mb-4">No Data Yet</h2>
          <p className="text-xl text-slate-600 mb-8">
            Upload your transaction data to get AI-powered insights
          </p>
          <Button size="lg" onClick={handleUploadNew}>
            Upload Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl">AI CFO Dashboard</h1>
              <p className="text-sm text-slate-600">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleUploadNew}>
              <Upload className="w-4 h-4 mr-2" />
              Upload New Data
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Data Source Info */}
        <div className={`mb-6 rounded-lg p-4 flex items-center justify-between ${
          isSaved 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div>
            <p className="text-sm">
              <strong>Data Source:</strong> {fileName}
            </p>
            <p className="text-sm text-slate-600">
              Uploaded {uploadedAt ? new Date(uploadedAt).toLocaleString() : 'Recently'}
            </p>
            <p className="text-sm mt-1">
              {isSaved ? (
                <span className="text-green-700">✓ Saved to database</span>
              ) : (
                <span className="text-amber-700">⚠ Temporary data - not yet saved to database</span>
              )}
            </p>
          </div>
          {!isSaved && (
            <Button 
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Database className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save to Database'}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="past-business">
              <Briefcase className="w-4 h-4 mr-2" />
              Past Business
            </TabsTrigger>
            <TabsTrigger value="customer-avg">
              <Users className="w-4 h-4 mr-2" />
              Avg Transaction Per Customer
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl mb-1">${analytics?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>From {analytics?.totalTransactions} transactions</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Avg Transaction</p>
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl mb-1">${analytics?.averageTransaction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-slate-600">Per transaction</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Total Transactions</p>
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl mb-1">{analytics?.totalTransactions.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Processed orders</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Unique Customers</p>
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl mb-1">{analytics?.uniqueCustomers.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Active customers</p>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Daily Revenue Trend */}
              <Card className="p-6">
                <h3 className="text-xl mb-4">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.dailyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Category Distribution */}
              <Card className="p-6">
                <h3 className="text-xl mb-4">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.topCategories || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => {
                        const percentage = analytics?.totalRevenue 
                          ? (entry.revenue / analytics.totalRevenue) * 100 
                          : 0;
                        return `${entry.name}: ${percentage.toFixed(1)}%`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                      nameKey="name"
                    >
                      {analytics?.topCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Products */}
              <Card className="p-6">
                <h3 className="text-xl mb-4">Top Products by Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.topProducts || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Category Breakdown Table */}
              <Card className="p-6">
                <h3 className="text-xl mb-4">Category Performance</h3>
                <div className="space-y-3">
                  {analytics?.categoryBreakdown.map((cat, index) => (
                    <div key={index} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-center justify-between mb-1">
                        <span>{cat.category}</span>
                        <span>${cat.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${cat.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{cat.percentage.toFixed(1)}% of total revenue</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl">AI-Powered Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="mb-2">💡 <strong>Top Category:</strong></p>
                  <p className="text-sm">
                    {analytics?.topCategories[0]?.name} is your best performing category with ${analytics?.topCategories[0]?.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} in revenue from {analytics?.topCategories[0]?.value} transactions.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="mb-2">📈 <strong>Customer Value:</strong></p>
                  <p className="text-sm">
                    Your average customer spends ${(analytics?.totalRevenue / analytics?.uniqueCustomers).toLocaleString(undefined, { minimumFractionDigits: 2 })} with an average of {analytics?.avgTransactionsPerCustomer.toFixed(1)} transactions per customer.
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="mb-2">🎯 <strong>Best Seller:</strong></p>
                  <p className="text-sm">
                    {analytics?.topProducts[0]?.name} leads with {analytics?.topProducts[0]?.count} sales generating ${analytics?.topProducts[0]?.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} in revenue.
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="mb-2">⚡ <strong>Transaction Velocity:</strong></p>
                  <p className="text-sm">
                    Processing {(analytics?.totalTransactions / analytics?.dailyRevenue.length).toFixed(1)} transactions per day on average across {analytics?.dailyRevenue.length} days of data.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Past Business Tab */}
          <TabsContent value="past-business">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Revenue */}
              <Card className="p-6 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Total Revenue</h3>
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-4xl mb-2">${analytics?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-slate-600">Cumulative sales revenue</p>
              </Card>

              {/* Average Transaction */}
              <Card className="p-6 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Average Transaction</h3>
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-4xl mb-2">${analytics?.averageTransaction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-slate-600">Per transaction value</p>
              </Card>

              {/* Total Transactions */}
              <Card className="p-6 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Total Transactions</h3>
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-4xl mb-2">{analytics?.totalTransactions.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Total orders processed</p>
              </Card>

              {/* Revenue Growth */}
              <Card className="p-6 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Revenue Growth</h3>
                  {analytics && analytics.revenueGrowth >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <p className={`text-4xl mb-2 ${analytics && analytics.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {analytics?.revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-600">Period over period</p>
              </Card>

              {/* Unique Customers */}
              <Card className="p-6 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Unique Customers</h3>
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-4xl mb-2">{analytics?.uniqueCustomers.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Total customer base</p>
              </Card>

              {/* Avg Transactions per Customer */}
              <Card className="p-6 border-l-4 border-l-cyan-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Avg Transactions per Customer</h3>
                  <ShoppingCart className="w-6 h-6 text-cyan-600" />
                </div>
                <p className="text-4xl mb-2">{analytics?.avgTransactionsPerCustomer.toFixed(1)}</p>
                <p className="text-sm text-slate-600">Transactions per customer</p>
              </Card>

              {/* Unique Products/Services */}
              <Card className="p-6 border-l-4 border-l-pink-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Unique Products/Services</h3>
                  <Package className="w-6 h-6 text-pink-600" />
                </div>
                <p className="text-4xl mb-2">{analytics?.uniqueProducts.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Product/service offerings</p>
              </Card>

              {/* Business Categories */}
              <Card className="p-6 border-l-4 border-l-indigo-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Business Categories</h3>
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-4xl mb-2">{analytics?.businessCategories.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Categories served</p>
              </Card>

              {/* Active Staff Members (Brands as proxy) */}
              <Card className="p-6 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-slate-600">Active Staff Members</h3>
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-4xl mb-2">{analytics?.uniqueBrands.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Unique brands/staff</p>
              </Card>
            </div>

            {/* Summary Insights */}
            <Card className="p-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl">Business Performance Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="mb-2">📊 <strong>Overall Performance:</strong></p>
                  <p className="text-sm">
                    Your business processed {analytics?.totalTransactions.toLocaleString()} transactions across {analytics?.businessCategories} different categories, generating ${analytics?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} in total revenue.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="mb-2">👥 <strong>Customer Engagement:</strong></p>
                  <p className="text-sm">
                    You have {analytics?.uniqueCustomers.toLocaleString()} unique customers averaging {analytics?.avgTransactionsPerCustomer.toFixed(1)} transactions each, with an average spend of ${analytics?.averageTransaction.toLocaleString(undefined, { minimumFractionDigits: 2 })} per transaction.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="mb-2">📦 <strong>Product Portfolio:</strong></p>
                  <p className="text-sm">
                    Your business offers {analytics?.uniqueProducts.toLocaleString()} unique products/services, with the top product generating ${analytics?.topProducts[0]?.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} in revenue.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="mb-2">📈 <strong>Growth Trajectory:</strong></p>
                  <p className="text-sm">
                    Revenue growth is {analytics && analytics.revenueGrowth >= 0 ? 'up' : 'down'} by {Math.abs(analytics?.revenueGrowth || 0).toFixed(1)}% period over period, indicating {analytics && analytics.revenueGrowth >= 0 ? 'positive momentum' : 'need for strategic adjustment'}.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Average Transaction Per Customer Tab */}
          <TabsContent value="customer-avg">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Total Customers</p>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl mb-1">{analytics?.uniqueCustomers.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Unique customer base</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Overall Avg Transaction</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl mb-1">${analytics?.averageTransaction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-slate-600">Across all transactions</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Highest Avg Spend</p>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl mb-1">${analytics?.customerAnalytics[0]?.avgTransaction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-slate-600">Top customer average</p>
              </Card>
            </div>

            {/* Top Customers by Average Transaction Chart */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl mb-4">Top 10 Customers by Average Transaction Value</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics?.customerAnalytics.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="customerId" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Bar dataKey="avgTransaction" fill="#3B82F6" name="Avg Transaction Value" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Customer Details Table */}
            <Card className="p-6">
              <h3 className="text-xl mb-4">Customer Transaction Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Customer ID</th>
                      <th className="text-right py-3 px-4">Transactions</th>
                      <th className="text-right py-3 px-4">Total Spent</th>
                      <th className="text-right py-3 px-4">Avg Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.customerAnalytics.map((customer, index) => (
                      <tr key={customer.customerId} className={`border-b ${index % 2 === 0 ? 'bg-slate-50' : ''}`}>
                        <td className="py-3 px-4">{customer.customerId}</td>
                        <td className="text-right py-3 px-4">{customer.transactionCount}</td>
                        <td className="text-right py-3 px-4">
                          ${customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right py-3 px-4">
                          ${customer.avgTransaction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Insights */}
            <Card className="p-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl">Customer Spending Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="mb-2">👑 <strong>Top Spender:</strong></p>
                  <p className="text-sm">
                    Customer {analytics?.customerAnalytics[0]?.customerId} has the highest average transaction value of ${analytics?.customerAnalytics[0]?.avgTransaction.toLocaleString(undefined, { minimumFractionDigits: 2 })} across {analytics?.customerAnalytics[0]?.transactionCount} transactions.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="mb-2">💰 <strong>Total Customer Value:</strong></p>
                  <p className="text-sm">
                    Your top customer has spent ${analytics?.customerAnalytics[0]?.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })} in total, representing {((analytics?.customerAnalytics[0]?.totalSpent / analytics?.totalRevenue) * 100).toFixed(1)}% of total revenue.
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="mb-2">📊 <strong>Customer Distribution:</strong></p>
                  <p className="text-sm">
                    Average transaction values range from ${analytics?.customerAnalytics[analytics.customerAnalytics.length - 1]?.avgTransaction.toLocaleString(undefined, { minimumFractionDigits: 2 })} to ${analytics?.customerAnalytics[0]?.avgTransaction.toLocaleString(undefined, { minimumFractionDigits: 2 })}, showing diverse customer spending patterns.
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="mb-2">🎯 <strong>Loyalty Opportunity:</strong></p>
                  <p className="text-sm">
                    Customers with higher average transactions could benefit from VIP programs or exclusive offers to maximize their lifetime value.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
