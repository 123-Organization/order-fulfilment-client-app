import React, { useState, useEffect } from "react";
import { Checkbox, Form, Input, InputNumber, Select } from "antd";

import { getStates } from "country-state-picker";
import type { SelectProps } from "antd";
import { countryType } from "../types/ICountry";
import type { CheckboxProps } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import { updateBilling } from "../store/features/companySlice";
import convertUsStateAbbrAndName from "../services/state";
import PaymentMethods from "../components/PaymentMethods";
import { on } from "events";

const countryList = require("../json/country.json");

const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];

const BillingAddress: React.FC = () => {
  const [countryCode, setCountryCode] = useState("us");
  const [copyCompanyAddress, setCopyCompanyAddress] = useState(false);
  const billingInfo = useAppSelector(
    (state) => state.company?.company_info?.data?.billing_info 
  );
  console.log(billingInfo)
  const [companyAddress, setCompanyAddress] = useState({ last_name: "" });
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const [stateData, setStateData] = useState<SelectProps["options"]>([]);
  const [form1] = Form.useForm();
  const [stateCode, setStateCode] = useState("");
  const [stateCodeShort, setStateCodeShort] = useState<string | null>("");
  const dispatch = useAppDispatch();
console.log(stateCode, stateCodeShort)
  const businessInfo = useAppSelector(
    (state) => state.company?.company_info?.data?.business_info 
  );
  console.log("businessInfo", businessInfo);

  const checkboxClick: CheckboxProps["onChange"] = (e) => {
    e.preventDefault();
    console.log("value......", e.target.checked, businessInfo);
    if (e.target.checked) {
      // let billingInfo = businessInfo
      // form1.resetFields();
      form1.setFieldsValue(
        businessInfo
        // {'first_name':"werwer"}
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
  //update state_code on commponent mount 
  

  const onValid = () => {
    const values = form1.getFieldsValue();
    const normalizedStateCode =
      countryCode === "us"
        ? stateCodeShort
        : stateCode;
        console.log("normalizedStateCode", normalizedStateCode);
  
    const payload = {
      ...values,
      country_code: countryCode,
      state_code: normalizedStateCode,
    };
  
    console.log("Payload to dispatch:", payload);
    form1.validateFields().then((values) => {
      console.log("values", values);
      if (Object.values(payload).every(Boolean)) {
        dispatch(updateBilling({ billing_info: payload }));
      }
    }).catch(error => {
      console.error("Validation failed:", error);
    });
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
    // Initialize country
    onChange(countryCode);
  }, []);

  useEffect(() => {
    if (billingInfo?.country_code) {
      console.log("effect countryCode", billingInfo?.country_code);
      onChange(billingInfo?.country_code); // Update country
      setStates(billingInfo?.country_code);
      setStateCode(billingInfo?.state_code?.toLowerCase());
      setStateCodeShort( billingInfo?.state_code);
      console.log("stateCode", stateCode, stateCodeShort);
      setCompanyAddress(billingInfo); // Load states for the country
      dispatch(updateBilling ({ billing_info: billingInfo }));
      setTimeout(() => {
       
        form1.setFieldsValue({
          ...billingInfo,
        });
      }, 1000);
    }
  }, [billingInfo, dispatch, stateCode, stateCodeShort, form1]);

  const handleInputChange = (e, field) => {
    const { value } = e?.target || "";
    setCompanyAddress((prev) => ({ ...prev, [field]: value }));
    form1.setFieldsValue({ [field]: value });
   form1.validateFields().then(() => {
    dispatch(updateBilling({ billing_info: { ...companyAddress } }));
    }).catch((errorInfo) => {
      const errors = errorInfo.errorFields.reduce((acc, field) => {
        acc[field.name[0]] = field.errors;
        return acc;
      }, {});
      dispatch(updateBilling({ billing_info: { ...companyAddress }, validFields: errors }));
    });
  };
  

  const displayTurtles = (
    <Form
      form={form1}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      className="w-full flex flex-col items-center"
    >
      <Form.Item name="country_code" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Select
            showSearch
            defaultValue={"US"}
            placeholder="Select a country"
            optionFilterProp="children"
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={countryList}
            onBlur={onValid}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Country
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: "Please enter your Company Name!" }]}
        name="company_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) =>
              handleInputChange(e, "company_name")
            }
            value={copyCompanyAddress ? businessInfo?.company_name : companyAddress?.company_name}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            My Company Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: "Please enter your First Name!" },
          {
            pattern: new RegExp(/^[a-zA-Z ]+$/i),
            message: "Please enter only alphabet characters!"
          },
          {
            pattern: new RegExp(/^[a-zA-Z ]{2,}$/i),
            message: "Please enter at least two characters!"
          }
        ]}
        name="first_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) =>
             handleInputChange(e, "first_name")
            }
            value={copyCompanyAddress ? businessInfo?.first_name : companyAddress?.first_name}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            First Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { 
            required: true, 
            message: "Please enter your Last Name!" },
          {
            pattern: new RegExp(/^[a-zA-Z ]+$/i),
            message: "Please enter only alphabet characters!"
          },
          {
            pattern: new RegExp(/^[a-zA-Z ]{2,}$/i),
            message: "Please enter at least two characters!"
          }
        ]}
        name="last_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) =>
              handleInputChange(e, "last_name")
            }
            value={
              copyCompanyAddress 
                ? businessInfo?.last_name
                : companyAddress?.last_name
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Last Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: "Please enter your Address Line 1!" }
        ]}
        name="address_1"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) =>
              handleInputChange(e, "address_1")
            }
            value={
                copyCompanyAddress 
                  ? businessInfo?.address_1 
                  : companyAddress?.address_1
              }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Address Line 1
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: false, message: "Please enter your Address Line 2!" }
        ]}
        name="address_2"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) =>
              handleInputChange(e, "address_2")
            }
            value={
              copyCompanyAddress 
                ? businessInfo?.address_2 
                : companyAddress?.address_2
              }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Address Line 2
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: "Please enter your city!" }]}
        name="city"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) =>
              
              handleInputChange(e, "city")
            }
            value={copyCompanyAddress  ? businessInfo?.city : companyAddress?.city}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            City
          </label>
        </div>
      </Form.Item>

      <Form.Item
        name="state_code"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Select
            allowClear
            showSearch
            onBlur={onValid}
            className="fw-input1 "
            onChange={onChangeState}
            filterOption={filterOption}
            options={stateData}
            value={stateCodeShort || stateCode} // Ensure correct value is passed
          >
            <label htmlFor="floating_outlined" className="fw-label">
              State
            </label>
          </Select>
        </div>
      </Form.Item>

      <Form.Item
        name="zip_postal_code"
        className="w-full sm:ml-[200px]"
        rules={[
          { required: true, message: "Please enter your Zip!" },
          {
            pattern: new RegExp(/^[0-9]{2,7}$/),
            message: "Please enter a valid zip !"
          }
        ]}
      >
        <div className="relative">
          <InputNumber
            type="number"
            onBlur={onValid}
            onChange={(e) =>
              handleInputChange(e, "zip_postal_code")
            }
            value={copyCompanyAddress  ? businessInfo?.zip_postal_code : companyAddress?.zip_postal_code}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Zip
          </label>
        </div>
      </Form.Item>

      <Form.Item
        name="phone"
        className="w-full sm:ml-[200px]"
        rules={[
          { required: true, message: "Please enter your Phone Number!" },
          {
            pattern: new RegExp(/^[0-9]{2,14}$/),
            message: "Please enter a valid phone number!"
          }
        ]}
      >
        <div className="relative">
          <InputNumber
            type="number"
            value={copyCompanyAddress  ? businessInfo?.phone : companyAddress?.phone}
            onBlur={onValid}
            onChange={(e) =>
              handleInputChange(e, "phone")
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Phone
          </label>
        </div>
      </Form.Item>
    </Form>
  );

  return (
    <div className="flex flex-wrap justify-center w-full h-full p-4 md:p-8">
      {/* Payment Methods Section */}
      <div className="w-full lg:w-1/2 mb-8 lg:mb-0 lg:pr-0 pt-20">
        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-200">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md bg-white rounded-lg mt-12">
              <PaymentMethods />
            </div>
          </div>
        </div>
      </div>

      {/* Billing Address Section */}
      <div className="w-full lg:w-1/2">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-6 text-center mr-12">
            <h2 className="text-lg font-bold text-gray-600">My Billing Address</h2>
            <p className="text-gray-500 mt-2">
              You can change this info later within your account.
            </p>
            <div className="mt-4">
              <Checkbox
                className="text-gray-500"
                onChange={checkboxClick}
              >
                Check if same as company address
              </Checkbox>
            </div>
          </div>
          <div className="w-full">
            {displayTurtles}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingAddress;
