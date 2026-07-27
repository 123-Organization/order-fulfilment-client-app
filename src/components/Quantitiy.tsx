import React, { useState, useEffect, useRef } from "react";
import { InputNumber, Space } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import { increaseProductQuantity } from "../store/features/productSlice";
import { setQuantityUpdated } from "../store/features/productSlice";
import { useNotificationContext } from "../context/NotificationContext";
import { patchOrderItemQuantity } from "../store/features/orderSlice";

type QuantityInputProps = {
  quantity: number;
  clicking: boolean;
  setclicking: (clicking: boolean) => void;
  orderFullFillmentId: string;
  product_guid: string;
  onQuantityUpdated?: () => void;
  /** Called with (orderFullFillmentId, isLoading) when the API starts/finishes. */
  onLoadingChange?: (orderFullFillmentId: string, isLoading: boolean) => void;
};

const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  clicking,
  setclicking,
  orderFullFillmentId,
  product_guid,
  onQuantityUpdated,
  onLoadingChange,
}) => {
  const [value, setValue] = useState<number>(quantity);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const dispatch = useAppDispatch();
  const quantityUpdated = useAppSelector(
    (state) => state.ProductSlice.quantityUpdated
  );

  const { status, error } = useAppSelector((state) => state.ProductSlice);
  const notificationApi = useNotificationContext();
  const product_status = useAppSelector((state) => state.ProductSlice.status);
  const quantityUpdatedRef = useRef(false);

  useEffect(() => {
    if (quantityUpdated) {
      quantityUpdatedRef.current = true;
    }
  }, [quantityUpdated]);

  const updateQuantity = (newValue: number) => {
    setValue(newValue);

    if (clickTimer) clearTimeout(clickTimer);
    setclicking(true);

    // Optimistically update the quantity in local Redux state immediately
    // so the UI reflects the change without waiting for the API.
    dispatch(patchOrderItemQuantity({ orderFullFillmentId, product_guid, new_quantity: newValue }));

    // Signal loading start immediately so the order card can show a skeleton.
    onLoadingChange?.(orderFullFillmentId, true);

    const newTimer = setTimeout(() => {
      dispatch(setQuantityUpdated(true));

      // Persist the new quantity to the backend
      dispatch(
        increaseProductQuantity({
          orderFullFillmentId,
          product_guid,
          new_quantity: newValue,
        })
      ).then(() => {
        if (quantityUpdatedRef.current) {
          notificationApi.success({
            message: "Quantity Updated",
            description: "Quantity has been successfully updated.",
          });
          quantityUpdatedRef.current = false;
        }
        // Invalidate shipping cache for ONLY this order and re-fetch
        // shipping options for just this one order — NOT all orders.
        onQuantityUpdated?.();
        // Signal loading done after shipping re-fetch is triggered.
        onLoadingChange?.(orderFullFillmentId, false);
      });
    }, 1000);

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

  // Sync local value when the prop changes (e.g. after a full order re-fetch)
  useEffect(() => {
    if (quantity !== undefined && quantity !== null && quantity !== value) {
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
              className="cursor-pointer text-base"
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
