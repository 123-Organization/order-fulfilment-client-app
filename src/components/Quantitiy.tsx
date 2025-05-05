import React, { useState, useEffect } from "react";
import { InputNumber, Space } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import { increaseProductQuantity } from "../store/features/productSlice";
import { setQuantityUpdated } from "../store/features/productSlice";
import { useNotificationContext } from "../context/NotificationContext";
import { fetchOrder } from "../store/features/orderSlice";
type QuantityInputProps = {
  quantity: number;
  clicking: boolean;
  setclicking: (clicking: boolean) => void;
  orderFullFillmentId: string;
  product_guid: string;
};

const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  clicking,
  setclicking,
  orderFullFillmentId,
  product_guid,
}) => {
  const [value, setValue] = useState<number>(quantity);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const dispatch = useAppDispatch();
  const quantityUpdated = useAppSelector(
    (state) => state.ProductSlice.quantityUpdated
  );
  console.log("quantity test", quantity, orderFullFillmentId, product_guid);
  const { status, error } = useAppSelector((state) => state.ProductSlice);
  const notificationApi = useNotificationContext();
  const product_status = useAppSelector((state) => state.ProductSlice.status);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const updateQuantity = (newValue: number) => {
    setValue(newValue);

    if (clickTimer) clearTimeout(clickTimer);
    setclicking(true);

    // Store the timer in a ref to avoid race conditions
    const newTimer = setTimeout(() => {
      console.log("Updating quantity to:", newValue);

      dispatch(setQuantityUpdated(true));

      // First update the quantity in the API
      dispatch(
        increaseProductQuantity({
          orderFullFillmentId,
          product_guid,
          new_quantity: newValue,
        })
      ).then(() => {
        setTimeout(() => {
          notificationApi.success({
            message: "Quantity Updated",
            description: "Quantity has been successfully updated.",
          });
          dispatch(fetchOrder(customerInfo?.data?.account_id));
        }, 3000);
      });
    }, 1000); // Reduced timeout for better UX

    setClickTimer(newTimer);
  };

  const increase = () => updateQuantity(Math.min(value + 1, 1000));
  const decrease = () => updateQuantity(Math.max(value - 1, 1));

  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
    };
  }, [clickTimer]);

  // Add useEffect to monitor quantity prop changes
  useEffect(() => {
    if (quantity !== undefined && quantity !== null && quantity !== value) {
      console.log("Quantity prop changed, updating local state:", quantity);
      setValue(quantity);
    }
  }, [quantity]);

  return (
    <div className="flex items-center space-x-2 w-[115px]">
      <Space direction="vertical">
        <InputNumber
          type="number"
          value={value}
          onChange={(newVal) => updateQuantity(newVal || 1)}
          addonBefore={
            <span
              onClick={decrease}
              className="cursor-pointer  text-base "
              onMouseDown={(e) => e.preventDefault()}
            >
              -
            </span>
          }
          addonAfter={
            <span
              onClick={increase}
              className="cursor-pointer text-base"
              onMouseDown={(e) => e.preventDefault()}
            >
              +
            </span>
          }
          style={{ width: "120px", textAlign: "center" }}
        />
      </Space>
    </div>
  );
};

export default QuantityInput;
