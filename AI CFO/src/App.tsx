import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner@2.0.3';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { DashboardPage } from './components/DashboardPage';
import { DebugPage } from './components/DebugPage';
import { IntegrationPage } from './components/IntegrationPage';

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/integration" element={<IntegrationPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/debug" element={<DebugPage />} />
      </Routes>
    </Router>
  );
}
