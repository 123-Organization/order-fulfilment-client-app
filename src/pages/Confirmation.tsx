import { Button, Result, ConfigProvider, Card, Col, Row, Tooltip, Badge } from "antd";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import style from "./Pgaes.module.css";
import { Steps } from "antd";
import { useNavigate } from "react-router-dom";
import { updateCheckedOrders, resetImport, DeleteAllOrders, resetSubmitStatus, resetExcludedOrders, sendOrderInformation, resetSendOrderInfoStatus, resetShopifyOrdersResponse, resetSubmitOrdersResponse } from "../store/features/orderSlice";
import { getCustomerInfo } from "../store/features/customerSlice";
import { InfoCircleOutlined } from "@ant-design/icons";

export default function Confirmation() {
  const [isLoadeing, setIsLoading] = useState(false);
  const [icon, setIcon] = useState<"success" | "error" | "info" | "warning">(
    "success"
  );
  const submitedOrders = useAppSelector((state) => state.order.submitedOrders);
  const sendOrderInformationStatus = useAppSelector((state) => state.order.sendOrderInfoStatus);
  const submitOrdersResponse = useAppSelector((state) => state.order.submitOrdersResponse);
  const shopifyOrdersResponse = useAppSelector((state) => state.order.shopifyOrdersResponse);
  const companyInfo = useAppSelector((state) => state.company.company_info);
  
  // Local state to preserve order response data before it gets reset
  const [savedOrderResponses, setSavedOrderResponses] = useState<any[]>([]);
  
  // Capture order response data when it arrives (before it gets reset)
  useEffect(() => {
    const normalOrders = submitOrdersResponse?.data || [];
    const shopifyOrders = shopifyOrdersResponse?.data || [];
    const combinedOrders = [...normalOrders, ...shopifyOrders];
    
    if (combinedOrders.length > 0 && savedOrderResponses.length === 0) {
      console.log("Saving order responses to local state:", combinedOrders);
      setSavedOrderResponses(combinedOrders);
    }
  }, [submitOrdersResponse, shopifyOrdersResponse, savedOrderResponses.length]);
  
  // Format orders for display, showing the first 3 directly
  const MAX_ORDERS_TO_DISPLAY = 3;
  const hasMoreOrders = submitedOrders.length > MAX_ORDERS_TO_DISPLAY;
  let displayedOrders = submitedOrders.slice(0, MAX_ORDERS_TO_DISPLAY).map((order: any) => order.order_po).join(", ");
  
  if (hasMoreOrders) {
    displayedOrders += "...";
  }
  
  const allOrderNumbers = submitedOrders.map((order: any) => order.order_po).join(", ");
  
  // Get order IDs from savedOrderResponses for display (persisted in local state)
  const orderIds = savedOrderResponses.map((order: any) => order.order_id).filter(Boolean);
  const displayedOrderIds = orderIds.slice(0, MAX_ORDERS_TO_DISPLAY).join(", ") + (orderIds.length > MAX_ORDERS_TO_DISPLAY ? "..." : "");
  
  const [title, setTitle] = useState("All Orders Successfully Purchased ");
  const [subTitle, setSubTitle] = useState(
    `Order number: ${displayedOrders} ${hasMoreOrders ? '' : '- Confirmation takes 1-10 seconds'}`
  );
  
  const dispatch = useAppDispatch();
  const submitStatus = useAppSelector((state) => state.order.submitStatus);
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
    if (submitStatus === "succeeded") {
      setIsLoading(false);
      dispatch(updateCheckedOrders([] as any));
      dispatch(resetSubmitStatus());
      dispatch(resetImport());
      if(sendOrderInformationStatus === "succeeded" || sendOrderInformationStatus === "failed"){
      dispatch(DeleteAllOrders({accountId: customerInfo?.data?.account_id}));
      }
      console.log("sendOrderInformationStatus", sendOrderInformationStatus);
      dispatch(resetExcludedOrders());
      
      // Refresh customer info to update credits after successful checkout
      dispatch(getCustomerInfo());
    } else if (submitStatus === "failed") {
      setIsLoading(true);
      setIcon("error");
      setTitle("Transaction Failed");
      setSubTitle("Payment has been declined. Please try again.");
      setConfirmation({ first: "Error", second: "in progress" });
      setStep(1)
      setStepStatus("error")
    }
  }, [submitStatus, dispatch, customerInfo?.data?.account_id, sendOrderInformationStatus]);

  // Handle sending order information after successful order submission
  useEffect(() => {
    // Combine normal and Shopify order responses
    const hasNormalOrders = submitOrdersResponse && submitOrdersResponse.data;
    const hasShopifyOrders = shopifyOrdersResponse && shopifyOrdersResponse.data;
    
    if ((hasNormalOrders || hasShopifyOrders) && companyInfo?.data?.account_key) {
      console.log("Sending order information - Normal:", submitOrdersResponse);
      console.log("Sending order information - Shopify:", shopifyOrdersResponse);
      console.log("Company info for domain lookup:", companyInfo);
      
      // Get domain name from various possible sources in the state
      // Check multiple possible locations where domain might be stored
      const domainName = 
        companyInfo?.data?.domain_name || 
        companyInfo?.data?.domainName || 
        companyInfo?.data?.domain ||
        companyInfo?.data?.business_info?.domain_name ||
        companyInfo?.data?.business_info?.domainName ||
        localStorage.getItem('domainName') ||
        sessionStorage.getItem('domainName') ||
        "finerworks1.instawp.site"; // fallback default
      
      console.log("Using domain name:", domainName);
      
      // Construct the webhook URL dynamically using the domain name
      const webhookUrl = `https://${domainName}/wp-json/finerworks-media/v1/order-status`;
      
      // Combine orders from both responses
      let combinedOrders: any[] = [];
      if (hasNormalOrders) {
        combinedOrders = [...submitOrdersResponse.data];
      }
      if (hasShopifyOrders) {
        combinedOrders = [...combinedOrders, ...shopifyOrdersResponse.data];
      }
      
      const orderInfoPayload = {
        domainName: domainName,
        account_key: companyInfo.data.account_key,
        webhook_order_status_url: webhookUrl,
        orders: combinedOrders
      };

      console.log("Sending combined order info payload:", orderInfoPayload);
      dispatch(sendOrderInformation(orderInfoPayload));
    }
  }, [submitOrdersResponse, shopifyOrdersResponse, companyInfo, dispatch]);

  // Handle sendOrderInformation status changes
  useEffect(() => {
    if (sendOrderInformationStatus === "succeeded") {
      console.log("Order information sent successfully");
      dispatch(resetSendOrderInfoStatus());
      dispatch(resetSubmitOrdersResponse());
      dispatch(resetShopifyOrdersResponse());
    } else if (sendOrderInformationStatus === "failed") {
      console.log("Failed to send order information");
      // You might want to show a notification here
    }
  }, [sendOrderInformationStatus, dispatch]);

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
      dispatch(resetSubmitStatus());
    }
  }
  
  // Generate order list items for tooltip with order IDs (using savedOrderResponses)
  const orderListItems = submitedOrders?.map((order: any, index: number) => {
    // Find matching order ID from saved responses
    const matchingResponse = savedOrderResponses.find(
      (resp: any) => resp.order_po === order.order_po || resp.order_po === String(order.order_po)
    );
    
    return (
      <div key={index} className="flex flex-col border-b pb-2 mb-2 last:border-b-0">
        <div className="flex justify-between">
          <span className="font-medium">PO: {order.order_po}</span>
          {order.Product_price?.grand_total && (
            <span className="text-green-600">${order.Product_price.grand_total}</span>
          )}
        </div>
        {matchingResponse?.order_id && (
          <span className="text-xs text-gray-500">Order ID: {matchingResponse.order_id}</span>
        )}
      </div>
    );
  });
  
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
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center">
                <span>PO Number: {confirmation.first === "Finished" ? displayedOrders : "N/A"}</span>
                {hasMoreOrders && confirmation.first === "Finished" && (
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
              </div>
              {confirmation.first === "Finished" && orderIds.length > 0 && (
                <div className="text-green-600 font-medium">
                  Order ID: {displayedOrderIds}
                </div>
              )}
              {confirmation.first === "Finished" ? (
                <span className="text-gray-500 text-sm">Confirmation takes 1-10 seconds</span>
              ) : (
                <span className="text-red-500">Payment Failed. Please try again.</span>
              )}
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
