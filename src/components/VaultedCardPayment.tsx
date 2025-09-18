import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store";
import { Modal, Button } from "antd";
import Datalist from "./DataList";
import { useNotificationContext } from "../context/NotificationContext";
import {
  getPaymentToken,
  processVaultedPayment,
} from "../store/features/paymentSlice";
import { resetPaymentStatus } from "../store/features/paymentSlice";
import style from "../pages/Pgaes.module.css";
import { useNavigate } from "react-router-dom";
import { submitOrders,updateCheckedOrders, resetSubmitStatus } from "../store/features/orderSlice";
import LoadingOverlay from "./LoadingOverlay";
import { updateSubmitedOrders } from "../store/features/orderSlice";

export default function VaultedCardPayment({
  Amount,
  visble,
  setVisble,
  maskedCard,
  Card,
}: any) {
  const dispatch = useAppDispatch();
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const paymentToken = useAppSelector((state) => state.Payment.paymentToken);
  const paymentStatus = useAppSelector((state) => state.Payment.status);
  const paymentTokenStatus = useAppSelector((state) => state.Payment.tokenStatus);
  const selectedCard = useAppSelector((state) => state.Payment.selectedCard);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [isPayButtonDisabled, setIsPayButtonDisabled] = useState(false);
  const orders = useAppSelector((state) => state.order.orders);
  const currentOption = useAppSelector((state) => state.Shipping.currentOption);
  console.log(currentOption,"ordeasasdadasrs")
  console.log(orders,"sdfsdf")
  
  const payment_profile_id = companyInfo?.data?.payment_profile_id;
  const notificationApi = useNotificationContext();
  const [token, setToken] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstRender = useRef(true);
  const notificationShownRef = useRef(false);
  const tokenRetryCount = useRef(0);
  const maxRetries = 3;
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const submitStatus = useAppSelector((state) => state.order.submitStatus);
  console.log("selectedCard",selectedCard);
  // Track token loading state

  useEffect(() => {
    if (paymentTokenStatus === "loading") {
      setIsTokenLoading(true);
      setIsPayButtonDisabled(true);
    } else if (paymentTokenStatus === "succeeded") {
      setIsTokenLoading(false);
      // Only enable the button if we have a valid token
      if (paymentToken?.payment_tokens && selectedCard) {
        const foundToken = paymentToken.payment_tokens.find(
          (t: any) => t?.associated_payment_method?.slice(-4) === selectedCard?.slice(-4) || t?.token === selectedCard
        );
        setIsPayButtonDisabled(!foundToken);
      } else {
        setIsPayButtonDisabled(true);
      }
      tokenRetryCount.current = 0;  // Reset retry counter on success
    } else if (paymentTokenStatus === "failed" && tokenRetryCount.current < maxRetries) {
      // If token retrieval failed, retry a few times
      tokenRetryCount.current += 1;
      const timer = setTimeout(() => {
        if (companyInfo?.data?.payment_profile_id) {
          dispatch(
            getPaymentToken({
              paymentProfileId: companyInfo.data.payment_profile_id,
            })
          );
        }
      }, 2000); // Wait 2 seconds before retrying
      
      return () => clearTimeout(timer);
    } else if (paymentTokenStatus === "failed") {
      setIsTokenLoading(false);
      setIsPayButtonDisabled(false); // Enable the button even if token failed, we'll show error on click
      
      if (!notificationShownRef.current) {
        notificationApi.warning({
          message: "Payment Setup Issue",
          description: "There was a problem retrieving your payment details. You may need to retry payment.",
        });
        notificationShownRef.current = true;
      }
    }
  }, [paymentTokenStatus, paymentToken, selectedCard, companyInfo, dispatch, notificationApi]);

  useEffect(() => {
    if (companyInfo?.data?.payment_profile_id) {
      setIsTokenLoading(true);
      dispatch(
        getPaymentToken({
          paymentProfileId: companyInfo.data.payment_profile_id,
        })
      );
      dispatch(resetSubmitStatus());
    }
  }, [companyInfo, Card, dispatch]);

  useEffect(() => {
    if (paymentToken?.payment_tokens && selectedCard) {
      const Token = paymentToken?.payment_tokens?.find(
        (token: any) => token?.associated_payment_method?.slice(-4) === selectedCard?.slice(-4) || token?.token === selectedCard
      );
      setToken(Token);
    }
  }, [paymentToken, selectedCard]);
  console.log("tooot",token);

  const proccessPayment = () => {
    // If still loading tokens or no token available, show notification and prevent processing
    if (isTokenLoading) {
      notificationApi.warning({
        message: "Payment Setup In Progress",
        description: "Please wait while we set up your payment details.",
      });
      return;
    }

    if (!token?.token) {
      notificationApi.error({
        message: "Payment Setup Error",
        description: "Your payment method isn't properly configured. Please select a different payment method or try again later.",
      });
      return;
    }

    notificationShownRef.current = false;
    setIsLoading(true);
    const submittedOrders = checkedOrders?.map((order: any) => {
      const orderToSubmit = orders?.data?.filter((o: any) => o.order_po === order.order_po);
        return orderToSubmit;
      
    }).flat();
    console.log("submittedOrders",submittedOrders);
  const editedSubmittedOrders = submittedOrders.map((order: any) => {
    return {
      ...order,
      order_po: order.order_po.split("#")[1],
      shipping_code: currentOption?.allOptions?.find((option: any) => option.order_po === order.order_po)?.selectedOption?.id,
      order_items: order.order_items.map((item: any) => {
        if(!item.product_sku.startsWith("AP")) {
          return {
            product_qty :item.product_qty ,
            product_sku: item.product_sku,
            product_cropping: item.product_cropping,
            product_guid : item.product_guid,
           product_image: {
            pixel_width: 600,
            pixel_height: 600,
            product_url_file: item?.product_image
            ?.product_url_file,
            product_url_thumbnail: item?.product_image
            ?.product_url_thumbnail,
           
           }
          }
        }
        return item;
      })
    }
  })
  console.log("editedSubmittedOrders",editedSubmittedOrders);
    const payload = {
      validate_only: false,
      orders: [...editedSubmittedOrders],
      account_key : companyInfo?.data?.account_key,
      accountId: companyInfo?.data?.account_id,
      payment_token: token?.token,
    }

    dispatch(
      submitOrders(payload)   
    );
    
    dispatch(updateSubmitedOrders(checkedOrders));
    setTimeout(() => {
      navigate("/confirmation");
    }, 1000);
  };

  useEffect(() => {
    // Only show notification if we haven't shown it already for this status
    if (!notificationShownRef.current) {
      if (submitStatus === "succeeded") {
        setIsLoading(false);
        notificationApi.success({
          message: "Payment Successful",
          description: "Payment has been successfully processed.",
        });
        dispatch(resetSubmitStatus());
        dispatch(updateCheckedOrders([] as any));
        notificationShownRef.current = true;
      } else if (submitStatus === "failed") {
        setIsLoading(false);
        notificationApi.error({
          message: "Payment Failed",
          description: "An error occurred while processing the payment.",
        });
        notificationShownRef.current = true;
      }
    }
  }, [submitStatus, dispatch, notificationApi]);


  return (
    <div>
      <LoadingOverlay isLoading={isLoading} message="Processing Payment..." />
      <LoadingOverlay isLoading={isTokenLoading && !isLoading} message="Setting up payment details..." />
      <Button
        key="submit"
        className={`max-md:w-6/12 w-[170px] md:mx-8 mt-2 ${style.pay_button} ${isTokenLoading || isPayButtonDisabled ? style.disabled_button || 'opacity-50' : ''}`}
        size={"large"}
        onClick={proccessPayment}
        disabled={isTokenLoading || isPayButtonDisabled}
      >
        {isTokenLoading ? "Setting Up..." : "Pay"}
      </Button>
    </div>
  );
}
