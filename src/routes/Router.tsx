import React, { Suspense, lazy, useEffect, useState } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { routes } from "../config/routes";
import ImportList from "../pages/ImportList";
import { useAppSelector } from "../store";
import { notification } from "antd";
import { useCookies } from "react-cookie";

type NotificationType = "success" | "info" | "warning" | "error";
interface NotificationAlertProps {
  type: NotificationType;
  message: string;
  description: string;
}

const Login = lazy(() => import("../pages/Login"));
const Landing = lazy(() => import("../pages/Landing"));
const MyCompany = lazy(() => import("../pages/MyCompany"));
const EditOrder = lazy(() => import("../pages/EditOrder"));
const VirtualInventory = lazy(() => import("../pages/VirtualInventory"));
const Import = lazy(() => import("../pages/Import"));
const BillingAddress = lazy(() => import("../pages/BillingAddress"));
const PaymentAddress = lazy(() => import("../pages/PaymentAddress"));
const ShippingPreference = lazy(() => import("../pages/ShippingPreference"));
const Checkout = lazy(() => import("../pages/Checkout"));
const ImportFilter = lazy(() => import("../pages/ImportFilter"));
const Confirmation = lazy(() => import("../pages/Confirmation"));

// ProtectedRoute component to check for authentication
interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component }) => {
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  
  if (!cookies.AccountGUID || !cookies.Session) {
    // Redirect to landing page if cookies don't exist
    return <Navigate to={routes.landingPage} replace />;
  }
  
  return <Component />;
};

const Router: React.FC = (): JSX.Element => {
  const [api, contextHolder] = notification.useNotification();
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const location = useLocation(); 
  const [triggred, setTriggred] = useState(false);
  const openNotificationWithIcon = ({
    type,
    message,
    description,
  }: NotificationAlertProps) => {
    notification[type]({
      message,
      description,
    });
  };
  const userData = null;
  const initialRoute = () => {
    if(userData){ 
      return Login;
    } else {
      return Landing;
    }
  };

  useEffect(() => {
    if (location.pathname === routes.checkout && (!checkedOrders || checkedOrders.length === 0)) {
      openNotificationWithIcon({
        type: "warning",
        message: "No Orders Selected",
        description: "Please select orders to proceed to checkout."
      });
    }
  }, [location.pathname, checkedOrders]);

  console.log("checked", checkedOrders.length);
  return (
    <Suspense
      fallback={
        <div className="main-loading flex flex-col items-center justify-center w-full h-[100vh]">
          <p>Order Fulfilment Loading...</p>
        </div>
      }
    >
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path={routes.landingPage} element={<Landing />} />
        
        {/* Protected routes */}
        <Route
          path={routes.checkout}
          element={
            !cookies.AccountGUID || !cookies.Session ? (
              <Navigate to={routes.landingPage} replace />
            ) : checkedOrders?.length > 0 ? (
              <Checkout />
            ) : (
              <Navigate to={routes.importlist} replace />
            )
          }
        />
        <Route path={routes.shippingpreference} element={<ProtectedRoute component={ShippingPreference} />} />
        <Route path={routes.paymentaddress} element={<ProtectedRoute component={PaymentAddress} />} />
        <Route path={routes.mycompany} element={<ProtectedRoute component={MyCompany} />} />
        <Route path={routes.editorder} element={<ProtectedRoute component={EditOrder} />} />
        <Route path={routes.billingaddress} element={<ProtectedRoute component={BillingAddress} />} />
        <Route path={routes.import} element={<ProtectedRoute component={Import} />} />
        <Route path={routes.importlist} element={<ProtectedRoute component={ImportList} />} />
        <Route path={routes.importfilter} element={<ProtectedRoute component={ImportFilter} />} />
        <Route path={routes.virtualinventory} element={<ProtectedRoute component={VirtualInventory} />} />
        <Route path={routes.confirmation} element={<ProtectedRoute component={Confirmation} />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </Suspense>
  );
};

export default Router;