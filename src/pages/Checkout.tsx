import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import { Button, Form, Radio, Space, Select, Input } from "antd";

import { getCustomerInfo } from "../store/features/customerSlice";
import { getPaymentMethods } from "../store/features/paymentSlice";
import type { RadioChangeEvent } from "antd";
import PaymentAddressModal from "../components/PaymentAddressModal";
import PaymentMethods from "../components/PaymentMethods";
import style from "./Pgaes.module.css";
const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];

const Checkout: React.FC = () => {
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const [showPayment, setShowPayment] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const [remainingTotal, setRemainingTotal] = useState(0); // To store the remaining billable amount
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const paymentMethods = useAppSelector(
    (state) => state.Payment.payment_methods
  );
  console.log(paymentMethods);

  const dispatch = useAppDispatch();
  const credit = customerInfo.data?.user_account_credits || 0;
  console.log("Checked Orders", checkedOrders);
  const [value, setValue] = useState(1);
  const [paymentPopupEnable, setPaymentPopupEnable] = useState(false);
  const [PaymentCards, setPaymentCards] = useState([]);
  const onChange1 = (e: RadioChangeEvent) => {
    console.log("radio checked", e.target.value);
    setValue(e.target.value);
  };
  console.log("value", value);
  const onChange = (value: string) => {
    console.log(`selected ${value}`);
  };

  const onSearch = (value: string) => {
    console.log("search:", value);
  };

  // Filter `option.label` match the user type `input`
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  console.log(paymentMethods);

  useEffect(() => {
    if (checkedOrders.length > 0) {
      let newTotalPrice = 0;
      checkedOrders.forEach((order) => {
        const product = order;
        if (product) {
          newTotalPrice += order.Product_price?.grand_total
            ? order.Product_price?.grand_total
            : order.Product_price?.credit_charge;
        }
      });
      setGrandTotal(newTotalPrice);

      // Calculate remaining total after applying the credit
      if (credit >= newTotalPrice) {
        setRemainingTotal(0); // No additional payment needed
        setShowPayment(true); // Show account credit only
      } else {
        setRemainingTotal(newTotalPrice - credit); // Deduct credit from total
        setShowPayment(false); // Show credit card and other payment methods
      }
    }
  }, [checkedOrders, grandTotal, credit]);

  const onChangePaymentMethod = (e: any) => {
    setValue(e.target.value);
  };
  const displayTurtles = (
    <div className="w-full flex flex-start flex-col justify-self-start ">
      <p className="w-full text-center pt-4">
        <Button
          key="submit"
          className=" max-md:w-full w-[170px] md:mx-8 mt-2  text-gray-500"
          size={"large"}
          type="default"
        >
          Remove selected
        </Button>
      </p>

      <p className=" w-full text-center pt-4">
        <Button
          key="submit"
          className="max-md:w-full  w-[170px]  md:mx-8 mt-2 "
          size={"large"}
          type="primary"
          onClick={() => setPaymentPopupEnable(true)}
        >
          Add New Credit Card
        </Button>
      </p>

      <p className="w-full text-center pt-4">
        <Button
          key="submit"
          className="max-md:w-full w-[170px]  md:mx-8 mt-2  "
          size={"large"}
          type="primary"
          onClick={() => setPaymentPopupEnable(true)}
        >
          Add Paypal
        </Button>
      </p>
      <p className="w-full text-center pt-4 b">
        <Button
          key="submit"
          className={`max-md:w-full w-[170px] md:mx-8 mt-2 ${style.pay_button} `}
          size={"large"}
          onClick={() => setPaymentPopupEnable(true)}
        >
          Pay
        </Button>
      </p>
    </div>
  );

  return (
    <div className="flex justify-end items-center w-full h-full p-8 max-lg:p-4 max-md:flex-col max-md:mt-12 k">
      <div className="w-7/12 flex flex-col justify-center items-center h-[600px] max-md:h-[400px] md:border-r-2 max-md:border-b-2 max-md:mb-8 max-xl:px-8">
        <div className="text-left text-gray-400 -mt-6 bg ">
          <p className="text-lg pb-4  font-bold">Summary</p>
          <p className="pt-6 pb-3 text-gray-400 font-bold">
            This following amount will be billed to your payment method:
            <br />
            <br />
          </p>
          <p className="pt-6 flex justify-between  font-bold text-sm">
            <span>Order Count:</span>
            <span>{checkedOrders.length}</span>
          </p>
          <p className="text-sm flex pt-6 justify-between  font-bold">
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </p>
          <p className="text-sm border-b-2 pt-6 flex justify-between font-bold">
            <span>Account Credits:</span>
            <span>(${credit || 0})</span>
          </p>
          <p className="text-sm flex pt-6 justify-between  font-bold">
            <span>Billable amount:</span>
            <span>
              ${remainingTotal > 0 ? remainingTotal.toFixed(2) : `(0)`}
            </span>
          </p>
        </div>
      </div>
      {/* <div className="w-1/2 max-lg:w-9/12 max-md:w-full flex flex-col justify-start items-center md:ml-16">
        <Form layout="horizontal" className="w-full flex flex-col items-center">
          <p className="text-lg font-bold -ml-12 text-gray-400">
            My Payment Methods
          </p>
          <div className="w-full ">
            {paymentMethods?.data?.paymentMethods?.map((method, index) => (
              <Radio.Group
                className="text-gray-400  flex w-full justify-center"
                onChange={onChange1}
                value={value}
              >
                <Radio
                  value={method?.maskedNumber}
                  className="text-gray-400 align-text-top pt-3 flex justify-center items-center "
                >
                  <strong className="flex justify-center items-center gap-4 ">
                    {method?.maskedNumber} - {method?.expirationDate}
                    <img src={method?.imageUrl} alt="" className="w-[40px]" />
                  </strong>
                </Radio>
              </Radio.Group>
            ))}
          </div>
          <Radio.Group
            onChange={onChangePaymentMethod}
            value={value}
            className="w-full flex flex-start flex-col justify-self-start"
          >
            <Space direction="vertical" className="text-gray-400">
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
        remainingTotal={remainingTotal}
      /> */}
      <PaymentMethods remainingTotal={remainingTotal} />
    </div>
  );
};

export default Checkout;
