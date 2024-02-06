import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { routes } from "../config/routes";

const Login = lazy(() => import("../pages/Login"));
const Landing = lazy(() => import("../pages/Landing"));
const MyCompany = lazy(() => import("../pages/MyCompany"));
const Import = lazy(() => import("../pages/Import"));
const BillingAddress = lazy(() => import("../pages/BillingAddress"));
const PaymentAddress = lazy(() => import("../pages/PaymentAddress"));

const Router: React.FC = (): JSX.Element  => {
  
  const userData = null;
  const initialRoute = () => {
    if(userData){ 
      return Login;
    } else {
      return Landing;
    }
  };

  return (
      <Suspense
        fallback={
          <div className="main-loading flex flex-col items-center justify-center w-full h-[100vh]">
            <p>Order Fulfilment Loading...</p>
          </div>
        }
      >
        <Routes>
          <Route path={routes.paymentaddress} Component={PaymentAddress} />
          <Route path={routes.mycompany} Component={MyCompany} />
          <Route path={routes.billingaddress} Component={BillingAddress} />
          <Route path={routes.import} Component={Import} />
          <Route path="*" Component={initialRoute()} />
        </Routes>
      </Suspense>
  );
};

export default Router;