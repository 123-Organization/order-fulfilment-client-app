import React, { useEffect, useState } from 'react';
import {
  Radio,
  Select,
  Form
}  from 'antd';
import { useAppSelector } from "../store";  
import type { RadioChangeEvent } from 'antd';


const SelectShippingOption: React.FC = ({ poNumber}:any) => {

  const shipping_option = useAppSelector((state) => state.order.shippingOptions);
  console.log('shipping_option main...',shipping_option)

  let shipping_details = shipping_option && (shipping_option.filter((sd,i) => 
  {
    console.log(` $==${poNumber} `,Object.keys(sd)[0])
    return (Object.keys(sd)[0]==poNumber)
  }
  ))

  shipping_details.length && (shipping_details=shipping_details[0][poNumber])

  // if (!shipping_details.length) return <></>;

  const [value, setValue] = useState("");
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const onChange = (value: string) => {
    console.log(`selected ${value}`);
    setValue(value)
  };

  const onSearch = (value: string) => {
    console.log("search:", value);
    setValue(value)
  };

  // Filter `option.label` match the user type `input`
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  
  console.log(`shipping_details `,shipping_details,poNumber);
  
  let preferred_option = shipping_details?.preferred_option?.rate
  useEffect(() => {
    // setTimeout(() => {
      preferred_option && setValue(preferred_option+'-$'+shipping_details?.preferred_option?.shipping_method)
      console.log(`preferred_option ${preferred_option}`);
    // }, 5000);
  },[preferred_option]);

  useEffect(() => {

  },[shipping_details])
  

  

  return  <><Form
  labelCol={{ span: 4 }}
  wrapperCol={{ span: 14 }}
  layout="horizontal"
  initialValues={{ size: componentSize }}
  className="w-full country_code_importlist_form"
>
  <Form.Item name="country_code_importlist">
    <div className="relative w-full text-gray-500">
      <Select
        // allowClear
        className="w-full  "
        showSearch
        placeholder="Order status"
        optionFilterProp="children"
        onChange={onChange}
        onSearch={onSearch}
        filterOption={filterOption}
        value={value}
        options={
          shipping_details?.options?.map(option => {
            return {
              value:option.rate+'-$'+option.shipping_method,
              label:option.shipping_method+'- $'+option.rate
            }
          })

        //   [
        //   {
        //     value: "economy",
        //     label: "Economy Parcel - $14.95"
        //   },
        //   {
        //     value: "shipped",
        //     label: "Shipped Parcel - $18.95"
        //   }
        // ]
      }
        ></Select>
        <label htmlFor="floating_outlined" className="fw-label ">
          Shipping Method
        </label>
      </div>
    </Form.Item>
  </Form>
   <div className="w-full text-sm pt-11"></div>
   <div className="w-full text-sm">Sub Total: $75.00</div>
   <div className="w-full text-sm">Discount: ($0.00)</div>
   <div className="w-full text-sm">Shipping : ${value.split('-$')[0]}</div>
   <div className="w-full text-sm">Sales Tax : $5.25</div>
   </>    
}

export default SelectShippingOption