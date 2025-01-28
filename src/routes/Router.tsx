import React, { Suspense, lazy,useEffect, useState } from "react";
import { Route, Routes,useLocation  } from "react-router-dom";
import { routes } from "../config/routes";
import ImportList from "../pages/ImportList";
import { useAppSelector } from "../store";
import { Navigate } from "react-router-dom";
import {notification } from "antd";



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

const Router: React.FC = (): JSX.Element  => {
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

  return (
      <Suspense
        fallback={
          <div className="main-loading flex flex-col items-center justify-center w-full h-[100vh]">
            <p>Order Fulfilment Loading...</p>
          </div>
        }
      >
        <Routes>
        <Route
          path={routes.checkout}
          element={
            checkedOrders?.length > 0 ? (
              <Checkout />
            ) : (
              <>
                <Navigate to={routes.importlist} replace />
                setTriggred(true)
              </>
            )
          }
        />
          <Route path={routes.checkout} Component={Checkout} />
          <Route path={routes.shippingpreference} Component={ShippingPreference} />
          <Route path={routes.paymentaddress} Component={PaymentAddress} />
          <Route path={routes.mycompany} Component={MyCompany} />
          <Route path={routes.editorder} Component={EditOrder}   />
          <Route path={routes.billingaddress} Component={BillingAddress} />
          <Route path={routes.import} Component={Import} />
          <Route path={routes.importlist} Component={ImportList} />
          <Route path={routes.importfilter} Component={ImportFilter} />
          <Route path={routes.virtualinventory} Component={VirtualInventory} />
          <Route path="*" Component={initialRoute()} />
        </Routes>
      </Suspense>
  );
};

export default Router;