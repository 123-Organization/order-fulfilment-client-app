import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Select, Form } from "antd";
import { useAppSelector } from "../store";
import Spinner from "./Spinner";

const SelectShippingOption: React.FC<{ poNumber: string; orderItems: any }> = ({
  poNumber,
  orderItems,
  onShippingOptionChange,
}) => {
  const shipping_option = useAppSelector(
    (state) => state.order.shippingOptions[0] || []
  );

  const shipping_details = useMemo(
    () => shipping_option?.find((option) => option.order_po == poNumber),
    [shipping_option, poNumber]
  );

  const [selectedOption, setSelectedOption] = useState<any>(null);

  // Set initial preferred option if available
  useEffect(() => {
    if (shipping_details?.preferred_option) {
      setSelectedOption(shipping_details.preferred_option);
    }
  }, [shipping_details]);

  const handleOptionChange = useCallback(
    (value: string) => {
      const option = shipping_details?.options?.find(
        (opt) => `${opt.rate}-$${opt.shipping_method}` === value
      );
      if (option) {
        setSelectedOption(option);
        // Notify the parent about the updated shipping price
        onShippingOptionChange(
          poNumber,
          option.calculated_total.order_grand_total
        );
      }
    },
    [shipping_details, poNumber, onShippingOptionChange]
  );

  if (!shipping_details) {
    return (
      <div className="flex-col items-center text-center p-12">
        {" "}
        <Spinner message={"Retrieving shipping options"} />{" "}
      </div>
    );
  }

  const subTotal = selectedOption?.calculated_total?.order_subtotal || 0;
  const discount = selectedOption?.calculated_total?.order_discount || 0;
  const shipping = selectedOption?.calculated_total?.order_shipping_rate || 0;
  const salesTax = selectedOption?.calculated_total?.order_sales_tax || 0;
  const grandTotal = selectedOption?.calculated_total?.order_grand_total || 0;

  return (
    <>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        className="w-full country_code_importlist_form"
      >
        <Form.Item name="shipping_option">
          <div className="relative w-full text-gray-500">
            <Select
              className="w-full"
              showSearch
              placeholder="Select Shipping Method"
              optionFilterProp="children"
              onChange={handleOptionChange}
              value={
                selectedOption
                  ? `${selectedOption.rate}-$${selectedOption.shipping_method}`
                  : undefined
              }
              options={shipping_details?.options?.map((option) => ({
                value: `${option.rate}-$${option.shipping_method}`,
                label: `${option.shipping_method} - $${option.rate}`,
              }))}
            />
            <label htmlFor="shipping_method" className="fw-label">
              Shipping Method
            </label>
          </div>
        </Form.Item>
      </Form>

      <div className="w-full text-sm pt-5"></div>
      <div className="w-full text-sm">Sub Total: ${subTotal.toFixed(2)}</div>
      <div className="w-full text-sm">Discount: (${discount.toFixed(2)})</div>
      <div className="w-full text-sm">Shipping: ${shipping.toFixed(2)}</div>
      <div className="w-full text-sm">Sales Tax: ${salesTax.toFixed(2)}</div>
      <div className="w-full text-sm">GrandTotal: {grandTotal}</div>
    </>
  );
};

export default SelectShippingOption;
