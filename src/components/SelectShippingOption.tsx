import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Select, Form } from "antd";
import { useAppSelector } from "../store";

const SelectShippingOption: React.FC<{ poNumber: string }> = ({ poNumber }) => {
  console.log("poNumber...", poNumber);

  const shipping_option = useAppSelector(
    (state) => state.order.shippingOptions
  );
  console.log("shipping_option main...", shipping_option);

  // Memoize shipping_details to avoid re-filtering on every render
  const shipping_details = useMemo(() => {
    const details = shipping_option?.find(
      (sd) => Object.keys(sd)[0] == poNumber
    )?.[poNumber];
    return details || null;
  }, [shipping_option, poNumber]);

  const [value, setValue] = useState("");
  const preferred_option = shipping_details?.preferred_option?.rate;

  useEffect(() => {
    if (preferred_option) {
      setValue(
        `${preferred_option}-$${shipping_details?.preferred_option?.shipping_method}`
      );
      console.log(`preferred_option ${preferred_option}`);
    }
  }, [preferred_option, shipping_details]);

  // Memoize the change handler
  const onChange = useCallback((value: string) => {
    console.log(`selected ${value}`);
    setValue(value);
  }, []);

  // Memoize the search handler
  const onSearch = useCallback((value: string) => {
    console.log("search:", value);
    setValue(value);
  }, []);

  // Filter the Select options
  const filterOption = useCallback(
    (input: string, option?: { label: string; value: string }) =>
      (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
    []
  );

  if (!shipping_details) {
    return <div>No shipping options available for this order.</div>;
  }

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
              onChange={onChange}
              onSearch={onSearch}
              filterOption={filterOption}
              value={value}
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

      <div className="w-full text-sm pt-11"></div>
      <div className="w-full text-sm">Sub Total: $75.00</div>
      <div className="w-full text-sm">Discount: ($0.00)</div>
      <div className="w-full text-sm">Shipping: ${value.split("-$")[0]}</div>
      <div className="w-full text-sm">Sales Tax: $5.25</div>
    </>
  );
};

export default SelectShippingOption;
