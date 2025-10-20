import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';

function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ChildrenList } from './components/Children/ChildrenList';
import { StaffList } from './components/Staff/StaffList';
import { Attendance } from './components/Attendance/Attendance';
import { Accounting } from './components/Accounting/Accounting';
import { Schedules } from './components/Schedules/Schedules';
import { Menus } from './components/Menus/Menus';
import { Reports } from './components/Reports/Reports';
import { Settings } from './components/Settings/Settings';
import { Footer } from './components/Layout/Footer';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'children':
        return <ChildrenList />;
      case 'staff':
        return <StaffList />;
      case 'attendance':
        return <Attendance />;
      case 'accounting':
        return <Accounting />;
      case 'schedules':
        return <Schedules />;
      case 'menus':
        return <Menus />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      <Footer />

      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
