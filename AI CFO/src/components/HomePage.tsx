import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Sparkles, 
  BarChart3, 
  ArrowRight 
} from 'lucide-react';
import { Card } from './ui/card';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl">AI CFO</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </button>
            <button className="text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </button>
            <button className="text-slate-600 hover:text-slate-900 transition-colors">
              About
            </button>
            <button className="text-slate-600 hover:text-slate-900 transition-colors">
              Contact
            </button>
            <Button 
              variant="ghost"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">AI-Powered Financial Intelligence</span>
          </div>
          
          <h1 className="text-6xl mb-6">
            Your AI-Powered Chief Financial Officer
          </h1>
          
          <p className="text-xl text-slate-600 mb-8">
            Transform your financial operations with intelligent automation, 
            real-time insights, and predictive analytics powered by advanced AI.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => navigate('/login')}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl mb-2">Predictive Analytics</h3>
            <p className="text-slate-600">
              Forecast cash flow, revenue trends, and identify financial risks before they impact your business.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl mb-2">Real-Time Reporting</h3>
            <p className="text-slate-600">
              Get instant financial reports and dashboards with automated data reconciliation and insights.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl mb-2">Secure & Compliant</h3>
            <p className="text-slate-600">
              Bank-level security with automated compliance tracking and audit-ready financial records.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl mb-4">
            Ready to revolutionize your finance operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of companies using AI CFO to make smarter financial decisions.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/login')}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
                <span>AI CFO</span>
              </div>
              <p className="text-slate-600 text-sm">
                Empowering businesses with intelligent financial management.
              </p>
            </div>
            
            <div>
              <h4 className="mb-4">Product</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div>Features</div>
                <div>Pricing</div>
                <div>Security</div>
                <div>Integrations</div>
              </div>
            </div>
            
            <div>
              <h4 className="mb-4">Company</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div>About</div>
                <div>Careers</div>
                <div>Blog</div>
                <div>Press</div>
              </div>
            </div>
            
            <div>
              <h4 className="mb-4">Support</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div>Help Center</div>
                <div>Contact</div>
                <div>API Docs</div>
                <div>Status</div>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 text-center text-sm text-slate-600">
            © 2025 AI CFO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
