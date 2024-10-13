import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import { Button, Form, Radio, Space } from "antd";

import { getCustomerInfo, getPaymentMethods } from "../store/features/orderSlice";
const Checkout: React.FC = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const [remainingTotal, setRemainingTotal] = useState(0); // To store the remaining billable amount
  const [value, setValue] = useState(1);

  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const companyInfo = useAppSelector((state) => state.order.company_info);
  const customerInfo = useAppSelector((state) => state.order.customer_info);
  const paymentMethods = useAppSelector((state) => state.order.payment_methods);

  const dispatch = useAppDispatch();
  const credit = 60;

  useEffect(() => {
    if (checkedOrders.length > 0) {
      let newTotalPrice = 0;
      checkedOrders.forEach((order) => {
        const product = order;
        if (product) {
          newTotalPrice += product.Product_price;
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

  useEffect(() => {
    dispatch(getCustomerInfo());
    dispatch(getPaymentMethods(companyInfo?.data?.payment_profile_id));
  }, [dispatch, companyInfo]);

  const onChangePaymentMethod = (e: any) => {
    setValue(e.target.value);
  };

  return (
    <div className="flex justify-end items-center w-full h-full p-8 max-md:flex-col max-md:mt-12">
      <div className="w-1/2 flex flex-col justify-center items-center h-[600px] max-md:h-[400px] md:border-r-2 max-md:border-b-2 max-md:mb-8">
        <div className="text-left text-gray-400 -mt-6">
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
          <p className="text-sm border-b-2 pt-6 flex justify-between  font-bold">
            <span>Account Credits:</span>
            <span>(${credit || 0})</span>
          </p>
          <p className="text-sm flex pt-6 justify-between  font-bold">
            <span>Billable amount:</span>
            <span>${remainingTotal > 0 ? remainingTotal.toFixed(2) :  `(0)`}</span>
          </p>
        </div>
      </div>
      <div className="w-1/2 max-md:w-full flex flex-col justify-start items-center md:ml-16">
        <Form layout="horizontal" className="w-full flex flex-col items-center">
          <p className="text-lg font-bold -ml-12 text-gray-400">My Payment Methods</p>
          <Radio.Group className="text-gray-400 ml-8" onChange={onChangePaymentMethod} value={value}>
            <Space direction="vertical" className="text-gray-400">
              {!showPayment ? (
                <>
                  <Radio value={1} className="text-gray-400 align-text-top pt-3">
                    <strong>Visa.. 1111 - Expires 06/2027</strong>
                  </Radio>
                  <Radio className="text-gray-400 pt-3" value={2}>
                    <strong>MasterCard..4444 - Expires 08/2025</strong>
                  </Radio>
                  <Radio className="text-gray-400 pt-3" value={3}>
                    <strong>PayPal Account - john@doe.com</strong>
                  </Radio>
                </>
              ) : (
                <Radio className="text-gray-400 pt-3" value={4}>
                  <strong>Account Credit - ${credit || 0}</strong>
                </Radio>
              )}
            </Space>
          </Radio.Group>

          <div className="w-full flex flex-start flex-col justify-self-start">
            <p className="w-full text-center pt-4">
              <Button key="submit" className="max-md:w-full w-[50%] md:mx-8 mt-2" size="large" type="default">
                Remove selected
              </Button>
            </p>

            {!showPayment ? (
              <>
                <p className="w-full text-center pt-4">
                  <Button key="submit" className="max-md:w-full w-[50%] md:mx-8 mt-2" size="large" type="primary">
                    Add New Credit Card
                  </Button>
                </p>
                <p className="w-full text-center pt-4">
                  <Button key="submit" className="max-md:w-full w-[50%] md:mx-8 mt-2" size="large" type="primary">
                    Add Paypal
                  </Button>
                </p>
              </>
            ) : (
              <p className="w-full text-center pt-4">
                <Button key="submit" className="max-md:w-full w-[50%] md:mx-8 mt-2" size="large" type="primary">
                  Account Credit
                </Button>
              </p>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Checkout;
