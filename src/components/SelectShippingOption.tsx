import React, { useEffect, useState, useMemo } from 'react';
import { Radio, Select, Form } from 'antd';
import { useAppSelector } from "../store";  
import type { RadioChangeEvent } from 'antd';

const SelectShippingOption: React.FC = ({ poNumber }: any) => {
  const shipping_option = useAppSelector((state) => state.order.shippingOptions);

  // Find matching shipping details based on poNumber
  let shipping_details = useMemo(() => {
    return shipping_option?.find((sd) => Object.keys(sd)[0] === poNumber)?.[poNumber] || null;
  }, [shipping_option, poNumber]);

  const [value, setValue] = useState<string>("");
  const [componentSize, setComponentSize] = useState<SizeType | "default">("default");

  const onChange = (value: string) => {
    setValue(value);
  };

  const onSearch = (value: string) => {
    setValue(value);
  };

  // Filter `option.label` matching the user's input
  const filterOption = (input: string, option?: { label: string; value: string }) => 
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // Extract preferred option from shipping details
  const preferred_option = shipping_details?.preferred_option?.rate;

  useEffect(() => {
    if (preferred_option) {
      setValue(`${preferred_option}-$${shipping_details?.preferred_option?.shipping_method}`);
    }
  }, [preferred_option, shipping_details]);

  // Memoize select options to avoid unnecessary recalculation
  const selectOptions = useMemo(() => {
    return shipping_details?.options?.map((option) => ({
      value: `${option.rate}-$${option.shipping_method}`,
      label: `${option.shipping_method} - $${option.rate}`,
    })) || [];
  }, [shipping_details]);

  return (
    <>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        initialValues={{ size: componentSize }}
        className="w-full country_code_importlist_form"
      >
        <Form.Item name="country_code_importlist">
          <div className="relative w-full text-gray-500">
            <Select
              className="w-full"
              showSearch
              placeholder="Order status"
              optionFilterProp="children"
              onChange={onChange}
              onSearch={onSearch}
              filterOption={filterOption}
              value={value}
              options={selectOptions}
            />
            <label htmlFor="floating_outlined" className="fw-label">Shipping Method</label>
          </div>
        </Form.Item>
      </Form>

      <div className="w-full text-sm pt-11"></div>
      <div className="w-full text-sm">Sub Total: $75.00</div>
      <div className="w-full text-sm">Discount: ($0.00)</div>
      <div className="w-full text-sm">Shipping : ${value.split('-$')[0]}</div>
      <div className="w-full text-sm">Sales Tax : $5.25</div>
    </>
  );
};

export default SelectShippingOption;
