import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ProtectedRoute from './routes/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AppShell from './components/Layout/AppShell'
import CommandCenter from './pages/command-center/CommandCenter'
import DigitalTwin from './pages/restaurant/DigitalTwin'
import MenuMatrix from './pages/menu/MenuMatrix'
import OcrPanel from './pages/ocr/OcrPanel'
import AiOptimizer from './pages/ai/AiOptimizer'
import AddMenuItem from './pages/menu/AddMenuItem'
import EditMenuItem from './pages/menu/EditMenuItem'
import RestaurantConfig from './pages/config/RestaurantConfig'
import BillingEditor from './pages/billing/BillingEditor'
import WaiterDashboard from './pages/orders/WaiterDashboard'
import CreateOrder from './pages/orders/CreateOrder'
import OrderDetails from './pages/orders/OrderDetails'

const Analytics: React.FC = () => (
  <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-white shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
    <h1 className="text-3xl font-semibold">Analytics</h1>
    <p className="mt-4 text-slate-400">Sales and performance analytics placeholder.</p>
  </div>
)

const Inventory: React.FC = () => (
  <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-white shadow-2xl shadow-emerald-500/5 backdrop-blur-xl">
    <h1 className="text-3xl font-semibold">Inventory Management</h1>
    <p className="mt-4 text-slate-400">Manage restaurant inventory placeholder.</p>
  </div>
)

const Orders: React.FC = () => (
  <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-white shadow-2xl shadow-amber-500/5 backdrop-blur-xl">
    <h1 className="text-3xl font-semibold">Orders</h1>
    <p className="mt-4 text-slate-400">View and manage orders placeholder.</p>
  </div>
)

const Billing: React.FC = () => (
  <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-white shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
    <h1 className="text-3xl font-semibold">Billing</h1>
    <p className="mt-4 text-slate-400">Billing and invoicing management placeholder.</p>
  </div>
)

const Employees: React.FC = () => (
  <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-white shadow-2xl shadow-blue-500/5 backdrop-blur-xl">
    <h1 className="text-3xl font-semibold">Employees</h1>
    <p className="mt-4 text-slate-400">Manage employee records and access placeholder.</p>
  </div>
)

const Welcome: React.FC = () => {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070A13] px-4 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/80 p-10 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">SmartServe AI</p>
          <h1 className="mt-6 text-5xl font-semibold">Restaurant Operating System</h1>
          <p className="mt-4 text-lg text-slate-400">The new unified restaurant control interface for menu, operations, and service flow.</p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="/auth/login" className="rounded-3xl bg-cyan-500/15 px-8 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25">
              Sign In
            </a>
            <a href="/auth/register" className="rounded-3xl bg-amber-500/15 px-8 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25">
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<CommandCenter />} />
        <Route path="/digital-twin" element={<DigitalTwin />} />
        <Route path="/menu" element={<MenuMatrix />} />
        <Route path="/menu/add" element={<AddMenuItem />} />
        <Route path="/menu/edit/:id" element={<EditMenuItem />} />
        <Route path="/ocr" element={<OcrPanel />} />
        <Route path="/ai-optimizer" element={<AiOptimizer />} />
        <Route path="/orders" element={<Navigate to="/waiter/dashboard" replace />} />
        <Route path="/waiter/dashboard" element={<WaiterDashboard />} />
        <Route path="/waiter/orders/create" element={<CreateOrder />} />
        <Route path="/waiter/orders/:id" element={<OrderDetails />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<RestaurantConfig />} />
        <Route path="/billing" element={<BillingEditor />} />
        <Route path="/employees" element={<Employees />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
