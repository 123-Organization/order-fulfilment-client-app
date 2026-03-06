import React, { useState, useEffect } from "react";
import { Checkbox, Form, Input, Select, Spin } from "antd";
import Payment from "./Payment";
import { createCustomer } from "../store/features/paymentSlice";
import { getCustomerInfo } from "../store/features/customerSlice";
import { updateCompanyInfo } from "../store/features/companySlice";
import { useAppDispatch, useAppSelector } from "../store";

const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];

type PaymentAddressProps = { 
  remainingTotal: number;
  onClose?: () => void;
};

const PaymentAddress: React.FC <PaymentAddressProps> = ({remainingTotal, onClose}) => {
  const dispatch = useAppDispatch();
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );

  const fullCompanyInfo = useAppSelector((state) => state.company.company_info);
  const companyInfo = fullCompanyInfo?.data?.billing_info;
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const createCustomerStatus = useAppSelector((state) => state.Payment.createCustomerStatus);
  console.log("companyInfo", customerInfo);

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

  const displayTurtles = (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ size: componentSize }}
      className="w-full flex flex-col items-center"
    >
      <Form.Item name="country_code" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Select
            // allowClear
            showSearch
            placeholder="Select a Card type"
            optionFilterProp="children"
            className=""
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={[
              {
                value: "Master",
                label: "Master",
              },
              {
                value: "Visa",
                label: "Visa",
              },
              {
                value: "American Express",
                label: "American Express",
              },
            ]}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Card Type
          </label>
        </div>
      </Form.Item>
      <Form.Item name="company_name" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            Card Number
          </label>
        </div>
      </Form.Item>

      <Form.Item name="country_code" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Select
            // allowClear
            showSearch
            placeholder="Select a Month"
            optionFilterProp="children"
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={[
              {
                value: "jack",
                label: "Jack",
              },
              {
                value: "lucy",
                label: "Lucy",
              },
              {
                value: "tom",
                label: "Tom",
              },
            ]}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Expiry Month
          </label>
        </div>
      </Form.Item>

      <Form.Item name="country_code" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Select
            // allowClear
            showSearch
            placeholder="Select a Year"
            optionFilterProp="children"
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={[
              {
                value: "jack",
                label: "Jack",
              },
              {
                value: "lucy",
                label: "Lucy",
              },
              {
                value: "tom",
                label: "Tom",
              },
            ]}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Expiry Year
          </label>
        </div>
      </Form.Item>

      <Form.Item name="first_name" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            CVV
          </label>
        </div>
      </Form.Item>
      <p>
        <Checkbox className="py-10 align-text-top  text-gray-400 " checked>
          Make Primary Payment Method
        </Checkbox>
      </p>
    </Form>
  );
  useEffect(() => {
    if (!customerInfo?.data.payment_profile_id && customerInfo?.data?.account_id && createCustomerStatus === "idle") {
      dispatch(
        createCustomer({
          firstName: companyInfo?.first_name,
          lastName: companyInfo?.last_name,
          email: companyInfo?.email,
          company: companyInfo?.company_name,
          phone: companyInfo?.phone,
          account_key: customerInfo?.data?.account_key,
        })
      ).unwrap().then(() => {
        dispatch(getCustomerInfo());
        dispatch(updateCompanyInfo({}));
      }).catch((err) => {
        console.error("Failed to create customer:", err);
      });
    }
  }, [companyInfo, dispatch, customerInfo, createCustomerStatus]);
  
  return (
    <div className="flex justify-end items-center w-full h-full p-8 max-md:flex-col max-md:mt-12">
      <div
        className="
          w-1/2 flex flex-col justify-center items-center h-[600px] max-md:h-[400px]
          md:border-r-2 max-md:border-b-2 max-md:mb-8
        "
      >
        <div className="text-left text-gray-400 pt-4">
          <p className="text-lg  font-bold">Add Payment Method</p>
          <p className="pt-5">
            This will be used for orders you submit for Fulfilment.
            <br />
            Name and address must be assigned to billing address
            <br />
            from the previous step.
            <br />
          </p>
          <p></p>
        </div>
      </div>
      <div className="w-1/2 max-md:w-full">
        <div className="container mx-auto px-5 py-2 lg:px-8 md:px-4 justify-center items-center">
          <div className="-m-1 mx-4 flex items-center flex-wrap md:-m-2">
            {createCustomerStatus === "loading" || !customerInfo?.data?.payment_profile_id || !fullCompanyInfo?.data?.payment_profile_id ? (
              <div className="flex justify-center items-center w-full py-12">
                <Spin size="large" tip="Setting up your account..." />
              </div>
            ) : (
              <Payment
                remainingTotal={remainingTotal}
                onCloseModal={onClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAddress;
