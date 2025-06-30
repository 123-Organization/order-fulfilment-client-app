import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import { Button, Form, Radio, Space, Select, Input } from "antd";
import style from "../pages/Pgaes.module.css";
import type { RadioChangeEvent } from "antd";
import { useLocation } from "react-router-dom";
import PaymentAddressModal from "../components/PaymentAddressModal";
import { getCustomerInfo } from "../store/features/customerSlice";
import {
  getPaymentMethods,
  getPaymentToken,
  removeSelectedCard,
} from "../store/features/paymentSlice";
import { setSelectedCard } from "../store/features/paymentSlice";
import VaultedCardPayment from "./VaultedCardPayment";
import { updateCompanyInfo } from "../store/features/companySlice";
import { useNotificationContext } from "../context/NotificationContext";
import "./animationStyles.css";
import { setCardRemoved } from "../store/features/paymentSlice";

export default function PaymentMethods(remainingTotal: any = 0) {
  const [value, setValue] = useState(1);
  const [paymentPopupEnable, setPaymentPopupEnable] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [modalVisble, setModalVisble] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const credit = 40;
  const notificationApi = useNotificationContext();
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const location = useLocation();
  const paymentToken = useAppSelector((state) => state.Payment.paymentToken);
  const paymentMethods = useAppSelector(
    (state) => state.Payment.payment_methods
  );
  const isCardRemoved = useAppSelector((state) => state.Payment.cardRemoved);
  console.log("paymentMethods", paymentMethods);
  const showPaymentMethod =
    location.pathname === "/checkout" && remainingTotal?.remainingTotal === 0;
  console.log("rere", remainingTotal?.remainingTotal);
  const dispatch = useAppDispatch();
  console.log("Car", value);

  const onChangePaymentMethod = (e: any) => {
    setValue(e.target.value);
    dispatch(setSelectedCard(e.target.value));
  };

  const maskNumber = (number: string) => {
    if (!number) return "";
    return number.slice(-4).padStart(number.length, "*");
  };

  useEffect(() => {
    dispatch(getCustomerInfo());
    if (companyInfo?.data?.payment_profile_id) {
    dispatch(
        getPaymentToken({
          paymentProfileId: companyInfo.data.payment_profile_id,
        })
      );
    }
  }, [companyInfo?.data?.payment_profile_id]);

  useEffect(() => {
    if (paymentMethods?.data?.paymentMethods?.length > 0) {
      const defaultPaymentMethod =
        paymentMethods.data.paymentMethods[0].maskedNumber;
      setValue(defaultPaymentMethod);
      dispatch(setSelectedCard(defaultPaymentMethod));
      setIsLoading(false);
    }
  }, [paymentMethods]);

  useEffect(() => {
    console.log("coco", companyInfo?.data?.payment_profile_id);

    const payment_profile_id = companyInfo?.data?.payment_profile_id;
    if (payment_profile_id) {
      setIsLoading(true);
      dispatch(getPaymentMethods(payment_profile_id));
    }
  }, [companyInfo, dispatch]);

  const onChange1 = (e: RadioChangeEvent) => {
    console.log("radio checked", e.target.value);
    dispatch(setSelectedCard(e.target.value));
    setValue(e.target.value);
  };
  console.log("valv", paymentToken);

  const handleRemoveCard = () => {
    const Token = paymentToken?.payment_tokens?.find(
      (token: any) =>
        token?.associated_payment_method?.slice(-4) ===
          String(value)?.slice(-4) || token?.token === String(value)
    );
    console.log("yoyo", Token);
    const data = {
      customerId: companyInfo?.data?.payment_profile_id,
      paymentMethodToken: Token?.token,
    };
    dispatch(removeSelectedCard(data));
    dispatch(setCardRemoved(true));
  };
  useEffect(() => {
    if (isCardRemoved) {
      dispatch(updateCompanyInfo({}));
      notificationApi.success({
        message: "Card removed successfully",
        description: "Card has been successfully removed.",
      });
      dispatch(setCardRemoved(false));
    }
  }, [isCardRemoved, companyInfo?.data?.payment_profile_id]);

  // useEffect(() => {
  //   dispatch(setSelectedCard(value));
  // }, [value]);

  const displayTurtles = (
    <div className="w-full flex flex-start flex-col justify-self-start ">
      {location.pathname === "/checkout" &&
      remainingTotal?.remainingTotal === 0 ? (
        <></>
      ) : (
        <div className=" ">
          <p className="w-full text-center pt-4">
            <Button
              key="submit"
              className="max-md:w-6/12 w-[170px] md:mx-8 mt-2 text-gray-500 button-animation-secondary"
              size={"large"}
              type="default"
              onClick={handleRemoveCard}
            >
              Remove selected
            </Button>
          </p>

          <p className=" w-full text-center pt-2">
            <Button
              key="submit"
              className="max-md:w-6/12 w-[170px] md:mx-8 mt-2 button-animation-primary"
              size={"large"}
              type="primary"
              onClick={() => setPaymentPopupEnable(true)}
            >
              Add Payment Method
            </Button>
          </p>
        </div>
      )}

      {location.pathname === "/checkout" && (
        <p className="w-full text-center pt-4 b">
          <VaultedCardPayment
            visble={modalVisble}
            setVisble={setModalVisble}
            Amount={remainingTotal?.remainingTotal}
            Card={value}
          />
        </p>
      )}
    </div>
  );
  return (
    <>
      <div className="w-[3x00px] max-lg:w-12/12 max-md:w-full flex flex-col justify-start items-center md:ml-16">
        <Form layout="horizontal" className="w-full flex flex-col items-center">
          <p className="text-lg font-bold text-gray-600 mr-2 mb-2">
            My Payment Methods
          </p>
          <div className="w-full payment-methods-container">
            {showPaymentMethod ? (
              <div></div>
            ) : isLoading ? (
              <div className="loading-pulse">Loading payment methods...</div>
            ) : (
              <div className="compact-cards-container">
                {paymentMethods?.data?.paymentMethods
                  ?.filter(
                    (method: any, index: number, self: any[]) =>
                      self.findIndex(
                        (m: any) => m.maskedNumber === method.maskedNumber
                      ) === index
                  ) // Filters out duplicates
                  ?.map((method: any, index: number) => (
                    <Radio.Group
                      className="text-gray-400 flex w-full justify-center card-animation"
                      onChange={onChange1}
                      value={value}
                      key={method?.maskedNumber}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Radio
                        value={method?.maskedNumber || method?.token}
                        className="text-gray-400 flex justify-center items-center card-radio py-1"
                      >
                        <strong className="flex justify-center items-center gap-4 ">
                          {maskNumber(method?.maskedNumber) || method?.email} -{" "}
                          {method?.expirationDate}
                          <img
                            src={method?.imageUrl}
                            alt=""
                            className="w-[40px] card-logo"
                          />
                        </strong>
                      </Radio>
                    </Radio.Group>
                  ))}
              </div>
            )}
          </div>
          <Radio.Group
            onChange={onChangePaymentMethod}
            value={value}
            className="w-full flex flex-start flex-col justify-self-start"
          >
            <Space direction="vertical" className="text-gray-400 ">
              {!showPayment ? (
                displayTurtles
              ) : (
                <Radio className="text-gray-400 pt-3" value={4}>
                  <strong>Account Credit - ${credit || 0}</strong>
                </Radio>
              )}
            </Space>
          </Radio.Group>
        </Form>
      </div>
      <PaymentAddressModal
        visible={paymentPopupEnable}
        onClose={() => setPaymentPopupEnable(false)}
        remainingTotal={remainingTotal?.remainingTotal}
      />
    </>
  );
}
