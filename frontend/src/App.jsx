import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyUnitProvider } from './context/CurrencyUnitContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VantaDotsCanvas from './components/VantaDotsCanvas';
import FloatingActionMenu from './components/FloatingActionMenu';
import LiveTradeToast from './components/LiveTradeToast';
import AiAgronomistChatModal from './components/AiAgronomistChatModal';



import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import CooperativeDashboard from './pages/CooperativeDashboard';
import TransporterDashboard from './pages/TransporterDashboard';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import MarketPrices from './pages/MarketPrices';
import MyOrders from './pages/MyOrders';
import Messages from './pages/Messages';
import FreightSharing from './pages/FreightSharing';
import CropAdvisory from './pages/CropAdvisory';

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'cooperative') return <Navigate to="/cooperative/dashboard" replace />;
  if (user.role === 'buyer') return <Navigate to="/buyer/dashboard" replace />;
  if (user.role === 'transporter') return <Navigate to="/transporter/dashboard" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer/dashboard" replace />;
  return <Navigate to="/orders" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyUnitProvider>
        <LanguageProvider>
          <AuthProvider>
            <SocketProvider>
              <VantaDotsCanvas />
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/market-prices" element={<MarketPrices />} />
                  <Route path="/freight" element={<FreightSharing />} />
                  <Route path="/advisory" element={<CropAdvisory />} />

                  {/* Smart Redirects & Shortcuts */}
                  <Route path="/dashboard" element={<DashboardRedirect />} />
                  <Route path="/farmer" element={<Navigate to="/farmer/dashboard" replace />} />
                  <Route path="/buyer" element={<Navigate to="/buyer/dashboard" replace />} />
                  <Route path="/cooperative" element={<Navigate to="/cooperative/dashboard" replace />} />
                  <Route path="/transporter" element={<Navigate to="/transporter/dashboard" replace />} />
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

                  {/* Private: Any Authenticated User */}
                  <Route
                    path="/orders"
                    element={
                      <PrivateRoute>
                        <MyOrders />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <PrivateRoute>
                        <Messages />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/messages/:conversationId"
                    element={
                      <PrivateRoute>
                        <Messages />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/messages/:id"
                    element={
                      <PrivateRoute>
                        <Messages />
                      </PrivateRoute>
                    }
                  />

                  {/* Farmers & Cooperatives */}
                  <Route
                    path="/farmer/dashboard"
                    element={
                      <PrivateRoute roles={['farmer', 'cooperative', 'admin']}>
                        <FarmerDashboard />
                      </PrivateRoute>
                    }
                  />

                  {/* Dedicated Buyer Command Center */}
                  <Route
                    path="/buyer/dashboard"
                    element={
                      <PrivateRoute roles={['buyer', 'admin']}>
                        <BuyerDashboard />
                      </PrivateRoute>
                    }
                  />

                  {/* Dedicated Cooperative Union Dashboard */}
                  <Route
                    path="/cooperative/dashboard"
                    element={
                      <PrivateRoute roles={['cooperative', 'admin']}>
                        <CooperativeDashboard />
                      </PrivateRoute>
                    }
                  />

                  {/* Dedicated Transporter Fleet Hub */}
                  <Route
                    path="/transporter/dashboard"
                    element={
                      <PrivateRoute roles={['transporter', 'admin']}>
                        <TransporterDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/farmer/add-product"
                    element={
                      <PrivateRoute roles={['farmer', 'cooperative']}>
                        <AddProduct />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/farmer/products/add"
                    element={
                      <PrivateRoute roles={['farmer', 'cooperative']}>
                        <AddProduct />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/farmer/edit-product/:id"
                    element={
                      <PrivateRoute roles={['farmer', 'cooperative']}>
                        <EditProduct />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/farmer/products/:id/edit"
                    element={
                      <PrivateRoute roles={['farmer', 'cooperative']}>
                        <EditProduct />
                      </PrivateRoute>
                    }
                  />

                  {/* Admin only */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <PrivateRoute roles={['admin']}>
                        <AdminDashboard />
                      </PrivateRoute>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <LiveTradeToast />
              <FloatingActionMenu />
              <AiAgronomistChatModal />
            </SocketProvider>
          </AuthProvider>
        </LanguageProvider>
      </CurrencyUnitProvider>
    </ThemeProvider>
  );
}
