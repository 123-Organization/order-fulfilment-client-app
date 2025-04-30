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
import { updateCheckedOrders } from "../store/features/orderSlice";
import LoadingOverlay from "./LoadingOverlay";

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
  const selectedCard = useAppSelector((state) => state.Payment.selectedCard);
  const [isLoading, setIsLoading] = useState(false);
  console.log("paymentToken", paymentToken);
  console.log("paymentStatus", paymentStatus);
  const payment_profile_id = companyInfo?.data?.payment_profile_id;
  const notificationApi = useNotificationContext();
  const [token, setToken] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstRender = useRef(true);
  const notificationShownRef = useRef(false);

  useEffect(() => {
    if (companyInfo?.data?.payment_profile_id) {
      dispatch(
        getPaymentToken({
          paymentProfileId: companyInfo.data.payment_profile_id,
        })
      );
      dispatch(resetPaymentStatus());
    }
  }, [companyInfo, Card]);

  useEffect(() => {
    if (paymentToken?.payment_tokens && selectedCard) {
      const Token = paymentToken?.payment_tokens?.find(
        (token: any) => token?.associated_payment_method?.slice(-4) === selectedCard?.slice(-4)
      );
      console.log("Card", selectedCard);
      console.log("Token", Token);
      setToken(Token);
    }
  }, [paymentToken, selectedCard]);
  console.log("selectedCard", selectedCard);

  console.log("token", token);

  const proccessPayment = () => {
    notificationShownRef.current = false;
    setIsLoading(true);
    
    dispatch(
      processVaultedPayment({
        paymentToken: token?.token || "", 
        amount: Amount,
        customerId: companyInfo?.data?.payment_profile_id,
      })
    );
    
    setTimeout(() => {
      navigate("/confirmation");
    }, 1000);
  };

  // useEffect(() => {
  //   if (paymentStatus === "idle") {
  //     dispatch(resetPaymentStatus()); // ✅ Reset status when modal opens
  //   }
  // }, []);

  // useEffect(() => {
  //   if ((paymentStatus === "succeeded" || paymentStatus === "failed") && isFirstRender.current) {
  //     navigate("/confirmation");
  //   } 
  // }, [paymentStatus]);

  useEffect(() => {
    // Only show notification if we haven't shown it already for this status
    if (!notificationShownRef.current) {
      if (paymentStatus === "succeeded") {
        setIsLoading(false);
        notificationApi.success({
          message: "Payment Successful",
          description: "Payment has been successfully processed.",
        });
        dispatch(resetPaymentStatus());
        dispatch(updateCheckedOrders([] as any));
        notificationShownRef.current = true;
      } else if (paymentStatus === "failed") {
        setIsLoading(false);
        notificationApi.error({
          message: "Payment Failed",
          description: "An error occurred while processing the payment.",
        });
        // dispatch(resetPaymentStatus());
        notificationShownRef.current = true;
      }
    }
  }, [paymentStatus, dispatch, notificationApi]);


  return (
    <div>
      <LoadingOverlay isLoading={isLoading} message="Processing Payment..." />
      <Button
        key="submit"
        className={`max-md:w-6/12 w-[170px] md:mx-8 mt-2 ${style.pay_button} `}
        size={"large"}
        onClick={proccessPayment}
      >
        Pay
      </Button>
    </div>
  );
}
