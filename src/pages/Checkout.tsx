import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import { Button, Form, Radio, Space, Select, Input } from "antd";
import type { RadioChangeEvent } from "antd";
import PaymentAddressModal from "../components/PaymentAddressModal";
import PaymentMethods from "../components/PaymentMethods";
import style from "../pages/Pgaes.module.css";
import LoadingOverlay from "../components/LoadingOverlay";

const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];

interface Order {
  Product_price: {
    grand_total?: number;
    credit_charge?: number;
  };
}

const Checkout: React.FC = () => {
  const [componentSize, setComponentSize] = useState<SizeType | "default">("default");
  const [showPayment, setShowPayment] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const [remainingTotal, setRemainingTotal] = useState(0);
  const [value, setValue] = useState(1);
  const [paymentPopupEnable, setPaymentPopupEnable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const paymentStatus = useAppSelector((state) => state.Payment.status);
  const credit = customerInfo.data?.user_account_credits || 0;

  useEffect(() => {
    if (checkedOrders.length > 0) {
      let newTotalPrice = 0;
      checkedOrders.forEach((order: Order) => {
        if (order) {
          newTotalPrice += order.Product_price?.grand_total || order.Product_price?.credit_charge || 0;
        }
      });
      setGrandTotal(newTotalPrice);

      if (credit >= newTotalPrice) {
        setRemainingTotal(0);
        setShowPayment(true);
      } else {
        setRemainingTotal(newTotalPrice - credit);
        setShowPayment(false);
      }
    }
  }, [checkedOrders, credit]);

  useEffect(() => {
    if (paymentStatus === "loading") {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [paymentStatus]);

  const onChangePaymentMethod = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };

  return (
    <span >
      <LoadingOverlay isLoading={isLoading} message="Processing Payment..." />
      <div className="flex justify-end items-center w-full h-full p-8 max-lg:p-4 max-md:flex-col max-md:mt-12">
        
        <div className="w-7/12 flex flex-col justify-center items-center h-[600px] max-md:h-[400px] md:border-r-2 max-md:border-b-2 max-md:mb-8 max-xl:px-8 max-md:w-full">
          <div className="text-left text-gray-400 -mt-6 bg">
            <p className="text-lg pb-4 font-bold">Summary</p>
            <p className="pt-6 pb-3 text-gray-400 font-bold">
              This following amount will be billed to your payment method:
              <br />
              <br />
            </p>
            <p className="pt-6 flex justify-between font-bold text-sm">
              <span>Order Count:</span>
              <span>{checkedOrders.length}</span>
            </p>
            <p className="text-sm flex pt-6 justify-between font-bold">
              <span>Grand Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </p>
            <p className="text-sm border-b-2 pt-6 flex justify-between font-bold">
              <span>Account Credits Used:</span>
              <span>(${grandTotal - remainingTotal})</span>
            </p>
            <p className="text-sm flex pt-6 justify-between font-bold">
              <span>Billable amount:</span>
              <span>${remainingTotal > 0 ? remainingTotal.toFixed(2) : `(0)`}</span>
            </p>
          </div>
        </div>
        <div className="w-6/12 flex flex-col justify-center items-center h-[600px] max-md:h-[400px] max-md:w-full ">
          <PaymentMethods remainingTotal={remainingTotal} />
        </div>
      </div>
    </span>
  );
};

export default Checkout;