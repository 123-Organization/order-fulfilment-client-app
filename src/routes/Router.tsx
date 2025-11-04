import React, { Suspense, lazy, useEffect, useState,useRef } from "react";
import {
  Route,
  Routes,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useAppDispatch } from "../store";
import { routes } from "../config/routes";
import ImportList from "../pages/ImportList";
import { useAppSelector } from "../store";
import { notification } from "antd";
import { useCookies } from "react-cookie";
import { clearCustomerInfo } from "../store/features/customerSlice";
import { useNotificationContext } from "../context/NotificationContext";
import { updateApp } from "../store/features/orderSlice";
import { stat } from "fs";

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
const ShopifyAuth = lazy(() => import("../pages/ShopifyAuth"));

// ProtectedRoute component to check for authentication
interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
}) => {
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const dispatch = useAppDispatch();
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const notificationApi = useNotificationContext();
  const myBillingInfoFilled = useAppSelector(
    (state) => state.company.myBillingInfoFilled
  );
  const myCompanyInfoFilled = useAppSelector(
    (state) => state.company.myCompanyInfoFilled
  );

  if (!cookies.AccountGUID ) {
    // Redirect to landing page if cookies don't exist
    // dispatch(clearCustomerInfo());
    window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`
    return 
  }
  // if(customerInfo?.data?.user_profile_complete === false){
  //   notificationApi.warning({
  //     message: "Please complete your profile",
  //     description: "Please complete your profile to connect to WooCommerce",
  //   });
  // }


  return <Component />;
};

const ProtectedHeader: React.FC<ProtectedRouteProps> = ({
  component: Component,
}) => {
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const dispatch = useAppDispatch();
  const appLunched = useAppSelector((state)=>state.order.appLunched)
  const company_info = useAppSelector((state) => state.company.company_info);
  console.log("comcom", company_info)
  const notificationApi = useNotificationContext();
  const wizardNotification = useRef(false)
  const location = useLocation();

  useEffect(()=>{
    if (cookies.AccountGUID ) {
    if (!company_info?.data?.billing_info?.first_name && appLunched === false && location.pathname === routes.landingPage) {
      if(!wizardNotification.current){
      notificationApi.warning({
        message: "Launch Setup Wizard",
        description: `Fill your information `,
      });
      console.log("wiz", wizardNotification.current)
      wizardNotification.current = true
    }
  }}

  },[appLunched])
  

console.log("islu", appLunched)

  if (!cookies.AccountGUID || !cookies.Session) {
    // Redirect to landing page if cookies don't exist
    // dispatch(clearCustomerInfo());
    window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`
    return
  }
  
  if (!company_info?.data?.billing_info?.first_name && appLunched === false && location.pathname === routes.landingPage) {
    window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`
    return
  

  }
  return <Component />;
};
const Router: React.FC = (): JSX.Element => {
  const [api, contextHolder] = notification.useNotification();
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const myBillingInfoFilled = useAppSelector(
    (state) => state.company.myBillingInfoFilled
  );
  const company_info = useAppSelector((state) => state.company.company_info);
  const myCompanyInfoFilled = useAppSelector(
    (state) => state.company.myCompanyInfoFilled
  );
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const location = useLocation();
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const notificationApi = useNotificationContext();
  const navigate = useNavigate();
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
    if (userData) {
      return Login;
    } else {
      return Landing;
    }
  };

  // useEffect(() => {
  //   if (company_info.data.billing_info.first_name) {
  //     return <Navigate to={routes.landingPage} replace />;
  //   }
  // }, [company_info]);

  // Prevent navigation back to confirmation page
  useEffect(() => {
    if(location.pathname === routes.checkout && customerInfo?.data?.user_profile_complete === false){
      notificationApi.warning({
        message: "Please complete your profile",
        description: "Please complete your profile to proceed to checkout",
      });
      navigate(routes.importlist)
    }
  }, [customerInfo]);

  useEffect(() => {
    // Skip for first render
    if (!location.key) return;

    // Check if coming from the confirmation page
    const lastPathInHistory = sessionStorage.getItem("lastPath");
    const currentPath = location.pathname;
    console.log("path", currentPath, lastPathInHistory);
    // If user tries to go back to confirmation page from landing page, redirect to landing
    if (
      currentPath === routes.landingPage &&
      lastPathInHistory === routes.confirmation
    ) {
      navigate(routes.landingPage, { replace: true });
    }

    // Store current path for next navigation check
    sessionStorage.setItem("lastPath", currentPath);

    // Clean up confirmation data if navigating away from confirmation page
  }, [location.pathname, location.key]);

  useEffect(() => {
    if (
      location.pathname === routes.checkout &&
      (!checkedOrders || checkedOrders.length === 0)
    ) {
      openNotificationWithIcon({
        type: "warning",
        message: "No Orders Selected",
        description: "Please select orders to proceed to checkout.",
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
        <Route path="/auth/shopify" element={<ShopifyAuth />} />

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
        <Route
          path={routes.shippingpreference}
          element={<ProtectedHeader component={ShippingPreference} />}
        />
        <Route
          path={routes.paymentaddress}
          element={<ProtectedRoute component={PaymentAddress} />}
        />
        <Route
          path={routes.mycompany}
          element={<ProtectedHeader component={MyCompany} />}
        />
        <Route
          path={routes.editorder}
          element={<ProtectedRoute component={EditOrder} />}
        />
        <Route
          path={routes.billingaddress}
          element={<ProtectedHeader component={BillingAddress} />}
        />
        <Route
          path={routes.import}
          element={<ProtectedRoute component={Import} />}
        />
        <Route
          path={routes.importlist}
          element={<ProtectedRoute component={ImportList} />}
        />
        <Route
          path={routes.importfilter}
          element={<ProtectedRoute component={ImportFilter} />}
        />
        <Route
          path={routes.virtualinventory}
          element={<ProtectedRoute component={VirtualInventory} />}
        />
        <Route
          path={routes.confirmation}
          element={<ProtectedRoute component={Confirmation} />}
        />
        <Route path="*" element={<Landing />} />
      </Routes>
    </Suspense>
  );
};

export default Router;
