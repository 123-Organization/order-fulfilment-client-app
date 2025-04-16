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
export default function VaultedCardPayment({
  Amount,
  visble,
  setVisble,
  maskedCard,
}: any) {
  const dispatch = useAppDispatch();
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const paymentToken = useAppSelector((state) => state.Payment.paymentToken);
  const paymentStatus = useAppSelector((state) => state.Payment.status);
  console.log("paymentToken", paymentToken);
  console.log("paymentStatus", paymentStatus);
  const payment_profile_id = companyInfo?.data?.payment_profile_id;
  const notificationApi = useNotificationContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (companyInfo?.data?.payment_profile_id) {
      dispatch(
        getPaymentToken({
          paymentProfileId: companyInfo.data.payment_profile_id,
        })
      );
    }
  }, [companyInfo]);

  const proccessPayment = () => {
    dispatch(
      processVaultedPayment({
        paymentToken: paymentToken?.payment_tokens?.token,
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
    if (paymentStatus === "succeeded") {
      notificationApi.success({
        message: "Payment Successful",
        description: "Payment has been successfully processed.",
      });
      dispatch(resetPaymentStatus());
    } else if (paymentStatus === "failed") {
      notificationApi.error({
        message: "Payment Failed",
        description: "An error occurred while processing the payment.",
      });
      dispatch(resetPaymentStatus());
    }
  }, []); // ✅ Remove visble from dependencies


  return (
    <div>
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
