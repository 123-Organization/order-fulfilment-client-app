import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import { Button, Form, Radio, Space, Select, Input } from "antd";
import style from "../pages/Pgaes.module.css";
import type { RadioChangeEvent } from "antd";
import { useLocation } from "react-router-dom";
import PaymentAddressModal from "../components/PaymentAddressModal";
import { getCustomerInfo } from "../store/features/customerSlice";
import { getPaymentMethods, removeSelectedCard } from "../store/features/paymentSlice";
import { setSelectedCard } from "../store/features/paymentSlice";
import VaultedCardPayment from "./VaultedCardPayment";
import { updateCompanyInfo } from "../store/features/companySlice";
import { useNotificationContext } from "../context/NotificationContext";

export default function PaymentMethods(remainingTotal: any = 0) {
  const [value, setValue] = useState(1);
  const [paymentPopupEnable, setPaymentPopupEnable] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [modalVisble, setModalVisble] = useState(false);
  const credit = 40;
  const [cardRemoved, setCardRemoved] = useState(false);
  const notificationApi = useNotificationContext();
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const location = useLocation();
  const paymentToken = useAppSelector((state)=> state.Payment.paymentToken)
  const paymentMethods = useAppSelector(
    (state) => state.Payment.payment_methods
  );
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

  const maskNumber = (number) => {
    if (!number) return "";
    return number.slice(-4).padStart(number.length, "*");
  };

  useEffect(() => {
    dispatch(getCustomerInfo());
  }, []);

  useEffect(() => {
    if (paymentMethods?.data?.paymentMethods?.length > 0) {
      const defaultPaymentMethod =
        paymentMethods.data.paymentMethods[0].maskedNumber;
      setValue(defaultPaymentMethod);
      dispatch(setSelectedCard(defaultPaymentMethod));
    }
  }, [paymentMethods]);

  useEffect(() => {
    console.log("comp", companyInfo?.data?.payment_profile_id);

    const payment_profile_id = companyInfo?.data?.payment_profile_id;
    if (payment_profile_id ) {
      dispatch(getPaymentMethods(payment_profile_id));
    }
  }, [companyInfo, dispatch]);

  const onChange1 = (e: RadioChangeEvent) => {
    console.log("radio checked", e.target.value);
    dispatch(setSelectedCard(e.target.value));
    setValue(e.target.value);
  };
  const handleRemoveCard = () => {
    const Token = paymentToken?.payment_tokens?.find(
      (token: any) => token?.associated_payment_method?.slice(-4) === value?.slice(-4)
    );
    const data = {
      customerId : companyInfo?.data?.payment_profile_id,
      paymentMethodToken : Token?.token
    }
  dispatch(removeSelectedCard(data))
  setCardRemoved(true)
  }
  useEffect(() => {
    if(cardRemoved){
      dispatch(updateCompanyInfo({
      }))
      notificationApi.success({
        message: "Card removed successfully",
        description: "Card has been successfully removed.",
      });
      setCardRemoved(false)
    }
  }, [cardRemoved, companyInfo?.data?.payment_profile_id]);

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
              className=" max-md:w-6/12 w-[170px] md:mx-8 mt-2  text-gray-500"
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
              className="max-md:w-6/12  w-[170px]  md:mx-8 mt-2 "
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
          <p className="text-lg font-bold  text-gray-600 mr-2">
            My Payment Methods
          </p>
          <div className="w-full ">
            {showPaymentMethod ? (
              <div></div>
            ) : (
              paymentMethods?.data?.paymentMethods
                ?.filter(
                  (method, index, self) =>
                    self.findIndex(
                      (m) => m.maskedNumber === method.maskedNumber
                    ) === index
                ) // Filters out duplicates
                ?.map((method) => (
                  <Radio.Group
                    className="text-gray-400 flex w-full justify-center"
                    onChange={onChange1}
                    value={value}
                    key={method?.maskedNumber}
                  >
                    <Radio
                      value={method?.maskedNumber}
                      className="text-gray-400 align-text-top pt-3 flex justify-center items-center"
                    >
                      <strong className="flex justify-center items-center gap-4">
                        {maskNumber(method?.maskedNumber)} -{" "}
                        {method?.expirationDate}
                        <img
                          src={method?.imageUrl}
                          alt=""
                          className="w-[40px]"
                        />
                      </strong>
                    </Radio>
                  </Radio.Group>
                ))
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
