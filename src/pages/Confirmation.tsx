import { Button, Result, ConfigProvider, Card, Col, Row, Tooltip, Badge } from "antd";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import style from "./Pgaes.module.css";
import { Steps } from "antd";
import { useNavigate } from "react-router-dom";
import { updateCheckedOrders, resetImport, DeleteAllOrders } from "../store/features/orderSlice";
import { resetPaymentStatus } from "../store/features/paymentSlice";
import { InfoCircleOutlined } from "@ant-design/icons";

export default function Confirmation() {
  const [isLoadeing, setIsLoading] = useState(false);
  const [icon, setIcon] = useState<"success" | "error" | "info" | "warning">(
    "success"
  );
  const submitedOrders = useAppSelector((state) => state.order.submitedOrders);
  
  // Format orders for display, showing the first 3 directly
  const MAX_ORDERS_TO_DISPLAY = 3;
  const hasMoreOrders = submitedOrders.length > MAX_ORDERS_TO_DISPLAY;
  let displayedOrders = submitedOrders.slice(0, MAX_ORDERS_TO_DISPLAY).map((order: any) => order.order_po).join(", ");
  
  if (hasMoreOrders) {
    displayedOrders += "...";
  }
  
  const allOrderNumbers = submitedOrders.map((order: any) => order.order_po).join(", ");
  
  const [title, setTitle] = useState("All Orders Successfully Purchased ");
  const [subTitle, setSubTitle] = useState(
    `Order number: ${displayedOrders} ${hasMoreOrders ? '' : '- Confirmation takes 1-10 seconds'}`
  );
  
  const dispatch = useAppDispatch();
  const paymentStatus = useAppSelector((state) => state.Payment.status);
  const [confirmation, setConfirmation] = useState({first:"Finished", second:"Finished"});
  const [step , setStep] = useState(3);
  const [stepStatus, setStepStatus] = useState<"error" | "finish" | "wait" | "process" | undefined>("finish");
  const navigate = useNavigate();
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  
  // Clear confirmation visited flag when component mounts
  // useEffect(() => {
  //   // Clear the flag when entering confirmation page
  //   sessionStorage.removeItem('confirmationVisited');
    
  //   return () => {
  //     // Ensure the flag is set when navigating away
  //     if (submitedOrders.length > 0) {
  //       sessionStorage.setItem('confirmationVisited', 'true');
  //     }
  //   };
  // }, []);
  
  console.log("submitedOrders", submitedOrders);
 
  useEffect(() => {
    if (paymentStatus === "succeeded") {
      setIsLoading(false);
      dispatch(updateCheckedOrders([] as any));
      dispatch(resetPaymentStatus());
      dispatch(resetImport());
      dispatch(DeleteAllOrders({accountId: customerInfo?.data?.account_id}));
    } else if (paymentStatus === "failed") {
      setIsLoading(true);
      setIcon("error");
      setTitle("Transaction Failed");
      setSubTitle("Payment has been declined. Please try again.");
      setConfirmation({ first: "Error", second: "in progress" });
      setStep(1)
      setStepStatus("error")
    }
  }, [paymentStatus]);

  const description = "Select the orders";
  const step2_description = "Make A payment";
  const step3_description = " Order Confirmation";
  const ButtonName = confirmation.first === "Finished" ? "Continue Shopping" : "Back to payment";
  const handleBackToPage = () => {
    if(ButtonName === "Back to payment"){
      navigate("/checkout");
    }else{
      // Set flag to prevent going back to confirmation
      // sessionStorage.setItem('confirmationVisited', 'true');
      // Use replace to prevent back button from working
      navigate("/", { replace: true });
      dispatch(resetPaymentStatus());
    }
  }
  
  // Generate order list items for tooltip
  const orderListItems = submitedOrders?.map((order: any, index: number) => (
    <div key={index} className="flex justify-between border-b pb-1 mb-1 last:border-b-0">
      <span className="font-medium">{order.order_po}</span>
      {order.Product_price?.grand_total && (
        <span className="text-green-600">${order.Product_price.grand_total}</span>
      )}
    </div>
  ));
  
  return (
    <div>
      <div className="p-4 mb-2  ">
        <Steps
          current={step}
          status={stepStatus}
          items={[
            {
              title: "Finished",
              description,
            },
            {
              title: confirmation.first,
              description: step2_description,
            },
            {
              title: confirmation.second,
              description: step3_description,
            },
          ]}
        />
      </div>
      <ConfigProvider
        theme={{
          components: {
            Result: {
              iconFontSize: 90,
            },
          },
        }}
      >
        <Result
          status={icon}
          title={title}
          subTitle={
            <div className="flex items-center justify-center">
              <span>Order number: {displayedOrders}</span>
              {hasMoreOrders && (
                <Tooltip 
                  title={
                    <div>
                      <div className="font-semibold mb-2 border-b pb-1">All Orders ({submitedOrders.length})</div>
                      <div className="max-h-40 overflow-auto pr-1">
                        {orderListItems}
                      </div>
                    </div>
                  }
                  color="#fff"
                  overlayInnerStyle={{
                    color: "#333",
                    width: "300px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    borderRadius: "8px",
                  }}
                  placement="bottom"
                >
                  <Badge count={submitedOrders.length - MAX_ORDERS_TO_DISPLAY} className="ml-2 cursor-pointer">
                    <InfoCircleOutlined className="text-blue-500 hover:text-blue-600 cursor-pointer text-lg ml-2" />
                  </Badge>
                </Tooltip>
              )}
              <span className="ml-1">- Confirmation takes 1-10 seconds</span>
            </div>
          }
          className=""
          extra={[
            <div className="w-full flex justify-center">
              <button color="danger" className={`${ confirmation.first === "Finished"? style.btn : style.btnError} bg-black  ` } style={{textTransform: "uppercase"}} onClick={handleBackToPage} >
                {ButtonName}
              </button>
            </div>,
          ]}
        />
      </ConfigProvider>
    </div>
  );
}
