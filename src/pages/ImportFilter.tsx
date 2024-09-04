import React, { useState, useEffect } from "react";
import { Checkbox, Form, Input, DatePicker, Select } from "antd";

import { getStates } from "country-state-picker";
import type { SelectProps } from "antd";
import { countryType } from "../types/ICountry";
import type { CheckboxProps } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import { updateBilling } from "../store/features/orderSlice";
import convertUsStateAbbrAndName from "../services/state";

const countryList = require("../json/order_status.json");
const { RangePicker } = DatePicker; 
const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];

const ImportFilter: React.FC = () => {
  const [countryCode, setCountryCode] = useState("us");
  const [copyCompanyAddress, setCopyCompanyAddress] = useState(false);
  const billingInfo = useAppSelector(
    (state) => state.order?.company_info?.data?.billing_info 
  );
  const [companyAddress, setCompanyAddress] = useState({ last_name: "" });
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const [stateData, setStateData] = useState<SelectProps["options"]>([]);
  const [stateCode, setStateCode] = useState("");
  const [stateCodeShort, setStateCodeShort] = useState<string | null>("");
  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const dispatch = useAppDispatch();

  const businessInfo = useAppSelector(
    (state) => state.order?.company_info?.data?.business_info 
  );

  const checkboxClick: CheckboxProps["onChange"] = (e) => {
    e.preventDefault();
    console.log("value......", e.target.checked, businessInfo);
    if (e.target.checked) {
      // let billingInfo = businessInfo
      // form1.resetFields();
      form1.setFieldsValue(
        businessInfo
        // {'order_id':"werwer"}
      );
      setCopyCompanyAddress(true);
    } else {
      !companyAddress?.last_name && setCompanyAddress(businessInfo)
      setCopyCompanyAddress(false);
      // form1.resetFields();
    }
  };

  const onChangeState = (value: string) => {
    let state_code = value?.toLowerCase();
    console.log(`onChangeState ${state_code}`,countryCode);
    setStateCode(state_code);
    if(countryCode === "us") 
      setStateCodeShort(convertUsStateAbbrAndName(state_code));
    else
      setStateCodeShort((state_code));
  };

  const onChange = (value: string) => {
    let country_code = value?.toLowerCase();
    console.log(`selected ${country_code}`);
    setStates(country_code?.toLowerCase());
    setCountryCode(country_code);
  };

  const setStates = (value: string = "us") => {
    let states = getStates(value);
    let data: countryType[] = (states || []).map((d: string) => ({
      label: d,
      value: d
    }));

    setStateData(data);
  };

  const onValid = () => {
    // form1.resetFields();
    let value = form1.getFieldsValue();
    value.country_code = countryCode;
    value.state_code = countryCode === "us" ? stateCodeShort : stateCode;
    // value.address_order_po="this is test";
    //https://dev.to/bayusyaits/using-antd-and-react-for-editable-cells-implementation-and-table-2b5m

    console.log(`onValid `, value);
    let eveVal = Object.values(value).every(Boolean);
    if (!eveVal) {
      form1.submit();
    }
    // value.email = "james@gmail.com";
    value.province = "";
    // value.address_3=null;
    console.log(`eveVal `, eveVal);
    // const isFormValid = () => form1.getFieldsError().some((item) => item.errors.length > 0)
    // https://github.com/ant-design/ant-design/issues/15674
    // console.log('isFormValid',form1.getFieldsError(),isFormValid(),valid)
    if (eveVal) {
      // let valid = form1.validateFields();
      form1
        .validateFields()
        .then(() => {
          // do whatever you need to
          dispatch(updateBilling({ billing_info: value }));
        })
        .catch((err) => {
          console.log(err);
        });
      // console.log('isFormValid',valid)
      // dispatch(updateCompany({billing_info:value}));
    }

    // return true;
  };

  const onSearch = (value: string) => {
    console.log("search:", value);
  };

  // Filter `option.label` match the user type `input`
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    // if(orders && !orders?.data?.length) {
    //dispatch(updateCompanyInfo(21));
    // }
    // onChange(countryCode);
    // setTimeout(() => {
    // }, 3000);
  }, []);

  useEffect(() => {
    if(billingInfo?.country_code){

      console.log('effect countryCode',billingInfo?.country_code)
      // let cntCode = convertUsStateAbbrAndName(billingInfo?.country_code)+"";
      onChange(billingInfo?.country_code);
      setTimeout(() => {
        setStateCode(convertUsStateAbbrAndName(billingInfo?.state_code));
        setCompanyAddress(billingInfo)
        form1.setFieldsValue(
          billingInfo
        );
      }, 1000);
    }
  }, [billingInfo]);

  const displayTurtles = (
    <Form
      form={form1}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 24 }}
      layout="horizontal"
      // initialValues={companyAddress}
      className="w-full flex flex-col items-end"
    >
      <Form.Item name="country_code" className="w-full sm:ml-[100px]">
        <div className="relative">
          <Select
            // allowClear
            showSearch
            // defaultValue={"US"}
            placeholder="Select a status"
            optionFilterProp="children"
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={countryList}
            onBlur={onValid}
            // value={
            //   convertUsStateAbbrAndName(countryCode.toUpperCase())
            // }
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Order Status
          </label>
        </div>
      </Form.Item>
      <RangePicker className="w-full sm:ml-[100px]" />
         
    </Form>
  );
  
  const displayTurtles2 = (
    <Form
      form={form2}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      // initialValues={companyAddress}
      className="w-full flex flex-col items-center"
    >
      <Form.Item
        rules={[
          { required: true, message: "Please enter your Order ID!" },
          {
            pattern: new RegExp(/^[0-9]{2,14}$/),
            message: "Please enter a valid Order ID!"
          }
        ]}
        name="order_id"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) =>
              setCompanyAddress({
                ...companyAddress,
                ...{ order_id: e?.target?.value }
              })
            }
            value={copyCompanyAddress ? businessInfo?.order_id : companyAddress?.order_id}
            className="fw-input"
            
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Order Number/ ID
          </label>
        </div>
      </Form.Item>
         
    </Form>
  );


  return (
    <div className="flex justify-end items-center w-full h-full p-8 max-md:flex-col max-md:mt-12">
      <div
        className="
          w-1/2  flex flex-col justify-center items-center h-[600px] max-md:w-full 
          md:border-r-2 max-md:border-b-2 max-md:mb-8
        "
      >
        <div className="text-left text-gray-400 pt-4">
          <p className="text-lg  font-bold">My Import</p>
          <p className="pt-5 pb-7">
            Import orders  or even a single orders
          </p>
          <p>
          {displayTurtles}
          </p>
        </div>
      </div>
      <div className="w-1/2 max-md:w-full">
        <div className="container mx-auto px-5 py-2 lg:px-8 md:px-4 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            {displayTurtles2}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportFilter;
