import { useEffect, useState } from "react";
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
  const payment_profile_id = companyInfo?.data?.payment_profile_id;
  const notificationApi = useNotificationContext();
  const navigate = useNavigate();

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
        paymentToken: paymentToken?.payment_tokens[0]?.token,
        amount: Amount,
        customerId: companyInfo?.data?.payment_profile_id,
      })
    );
    navigate("/confirmation");
  };

  useEffect(() => {
    dispatch(resetPaymentStatus()); // ✅ Reset status when modal opens
  }, []);

  useEffect(() => {
    if (paymentStatus === "succeeded") {
      notificationApi.success({
        message: "Payment Successful",
        description: "Payment has been successfully processed.",
      });
    } else if (paymentStatus === "failed") {
      notificationApi.error({
        message: "Payment Failed",
        description: "An error occurred while processing the payment.",
      });
    }
  }, [paymentStatus]); // ✅ Remove visble from dependencies


  return (
    <div>
      <Button
        key="submit"
        className={`max-md:w-full w-[170px] md:mx-8 mt-2 ${style.pay_button} `}
        size={"large"}
        onClick={proccessPayment}
      >
        Pay
      </Button>
    </div>
  );
}
