import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { routes } from "../config/routes";

const Login = lazy(() => import("../pages/Login"));
const Landing = lazy(() => import("../pages/Landing"));


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
          <Route path={routes.login} Component={Login} />
          <Route path="*" Component={initialRoute()} />
        </Routes>
      </Suspense>
  );
};

export default Router;
