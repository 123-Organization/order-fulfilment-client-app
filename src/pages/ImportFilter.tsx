import React, { useState, useEffect } from "react";
import { Checkbox, Form, Input, DatePicker, Select, notification } from "antd";

import { getStates } from "country-state-picker";
import type { SelectProps } from "antd";
import { countryType } from "../types/ICountry";
import type { CheckboxProps } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import {  fetchOrder, fetchWporder, updateImport } from "../store/features/orderSlice";
import convertUsStateAbbrAndName from "../services/state";
import { useLocation } from "react-router-dom";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { updateWporder } from "../store/features/orderSlice";

const countryList = require("../json/order_status_same_label.json");
const { RangePicker } = DatePicker; 
const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];
dayjs.extend(customParseFormat);


const currentDate = dayjs();
const formattedDate = currentDate.format('YYYY-MM-DD');
console.log(formattedDate,formattedDate);

const ImportFilter: React.FC = () => {
  const [countryCode, setCountryCode] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [copyCompanyAddress, setCopyCompanyAddress] = useState(false);
  const billingInfo = useAppSelector(
    (state) => state.company?.company_info?.data?.billing_info 
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

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeValue = queryParams.get("type");
  const dateFormat = 'YYYY-MM-DD';

  console.log(location.pathname,typeValue);

  const businessInfo = useAppSelector(
    (state) => state.company?.company_info?.data?.business_info 
  );
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);

  // useEffect(()=>{
  //   dispatch(fetchOrder(customerInfo?.data?.account_id))
  // },[customerInfo?.data?.account_id])

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
  const wporder = useAppSelector((state) => state.order.Wporder);
  console.log('wporder',wporder)

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
    if(value){

      console.log(`selected ${value}`);
      let country_code = value;
      setStates(country_code);
      setCountryCode(country_code);
    }
  };

  const setStates = (value: string = "us") => {
    let states = getStates(value);
    let data: countryType[] = (states || []).map((d: string) => ({
      label: d,
      value: d
    }));

    setStateData(data);
  };

  const onValid = (date:[]) => {
      let importData = { };
      
      // Add status if selected
      if(countryCode) {
        importData = {...importData, status: countryCode}
      }
      
      // Add dates if selected
      if(date && date.length === 2) { 
        importData = {...importData, start_date: date[0], end_date: date[1]}
        setDateRange(date)
      }
      
      // Dispatch if we have either dates or status
      if(Object.keys(importData).length > 0) {
        console.log('importData', importData)
        dispatch(updateImport(importData));
      }
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

  const [orderIds, setOrderIds] = useState<string[]>([]);

  const getWporder = (values: string[]) => {
    console.log('getWporder', values);
    if (values && values.length > 0) {
      dispatch(updateWporder(values.join(',')));
    }
  };

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
            onChange={(value) => {
              onChange(value);
              // Dispatch immediately when status changes
              let importData: any = { status: value };
              if(dateRange && dateRange.length === 2) {
                importData = {...importData, start_date: dateRange[0], end_date: dateRange[1]};
              }
              dispatch(updateImport(importData));
            }}
            onSearch={onSearch}
            filterOption={filterOption}
            options={countryList}
            // value={
            //   convertUsStateAbbrAndName(countryCode.toUpperCase())
            // }
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Order Status
          </label>
        </div>
      </Form.Item>
      {/* <Form.Item name="range_picker" label="Date range" 
      > */}
        <RangePicker 
        // onBlur={onValid}
          maxDate={(dayjs(currentDate, dateFormat))}
          onChange={(_,info) =>
            { 
              console.log('onChange:', info,currentDate); 
              onValid(info)
            }
          }

         className="w-full sm:ml-[100px]" 
        />
        
      {/* </Form.Item> */}
         
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
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Enter order numbers"
            onChange={getWporder}
            tokenSeparators={[',']}
            className="fw-input-importfilter"
          />
          <label htmlFor="floating_outlined" className="fw-label-importfilter">
            Order Numbers (separate with comma or Enter key)
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
          <p className="text-lg  font-bold">{typeValue} Import</p>
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
