import React, { useEffect, useState } from "react";
import { Form, Input, InputNumber, Select } from "antd";

import { updateCompany } from "../store/features/orderSlice";
import uploadYourLogo from "../assets/images/upload-your-logo.svg";
import { getStates } from "country-state-picker";
import type { SelectProps } from "antd";
import { countryType } from "../types/ICountry";
import { useAppDispatch, useAppSelector } from "../store";
import convertUsStateAbbrAndName from "../services/state";
import { on } from "events";

/*////////////////////////////////////////////////////*/

const countryList = require("../json/country.json");
type SizeType = Parameters<typeof Form>[0]["size"];

const MyCompany: React.FC = () => {
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const [stateData, setStateData] = useState<SelectProps["options"]>(
    [] as SelectProps["options"]
  );
  const [countryCode, setCountryCode] = useState("us");
  const [stateCodeShort, setStateCodeShort] = useState<String | null>("");
  const [stateCode, setStateCode] = useState<String | null>("");
  const [form] = Form.useForm();
  const [companyAddress, setCompanyAddress] = useState({
    country_code: "US",
    company_name: "",
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "",
    state_code: "",
    zip_postal_code: "",
    phone: "",
  });
const [validFields, setValidFields] = useState({
    company_name: false,
    first_name: false,
    last_name: false,
    address_1: false,
    city: false,
    state_code: false,
    zip_postal_code: false,
    phone: false,
  });

  /*////////////////////////////////////////////////////*/
  const dispatch = useAppDispatch();
  const businessInfo = useAppSelector(
    (state) => state.order?.company_info?.data?.business_info
  );

  const setStates = (value: string = "us") => {
    let states = getStates(value);
    let data: { label: string; value: string }[] = (states || []).map(
      (d: string) => ({
        label: d,
        value: d,
      })
    );

    setStateData(data);
  };

  const onChange = (value: string) => {
    let country_code = value?.toLowerCase();
    console.log(`selected ${country_code}`);
    setStates(country_code?.toLowerCase());
    setCountryCode(country_code);
  };

  const onChangeState = (value: string | null) => {
    let state_code: string | null = value?.toLowerCase();
    console.log(`onChangeState ${state_code}`);
    setStateCode(state_code);
    countryCode === "us" &&
      setStateCodeShort(convertUsStateAbbrAndName(state_code));
    console.log(`onChangeState ${stateCodeShort}`);
  };

  const onFinish = (values) => {
    const updatedValues = { ...companyAddress, ...values };
    updatedValues.country_code = countryCode;
    updatedValues.state_code = countryCode === "us" ? stateCodeShort : stateCode;
  
    // Get form validation errors
    form.validateFields()
      .then(() => {
        // If validation is successful, dispatch the updateCompany action
        dispatch(updateCompany({ business_info: updatedValues, validFields: {} }));
      })
      .catch((errorInfo) => {
        // Handle form validation errors
        const errors = errorInfo.errorFields.reduce((acc, field) => {
          acc[field.name[0]] = field.errors;
          return acc;
        }, {});
  
        // Pass errors to the dispatch
        dispatch(updateCompany({ business_info: updatedValues, validFields: errors }));
      });
  };

  const onSearch = (value: string) => {
    console.log("search:", value);
    let empty = _.isEmpty(value);
    console.log("empty:", empty);
    //setStates(value);
  };

  // Filter `option.label` match the user type `input`
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    onChange(countryCode); // Initialize country states
  }, []);

  useEffect(() => {
    onFinish(companyAddress);
  }, [stateCode, stateCodeShort]);

  useEffect(() => {
    form.setFieldsValue(businessInfo);
    if (businessInfo?.company_name) {
      setTimeout(() => {
        if (businessInfo?.state_code) {
          // onChangeState(convertUsStateAbbrAndName(businessInfo?.state_code));
          setStateCodeShort(businessInfo?.state_code);
        }
      }, 1000);
    }
  }, [businessInfo]);

  useEffect(() => {
    if (businessInfo) {
      setCompanyAddress(businessInfo);
      form.setFieldsValue(businessInfo);
    }
  }, [businessInfo]);

  const handleInputChange = (e, field) => {
    const { value } = e?.target || "";
    setCompanyAddress((prev) => ({ ...prev, [field]: value }));
    form.setFieldsValue({ [field]: value });
    onFinish({ ...companyAddress, [field]: value });
  };
  const displayTurtles = (
    <Form
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ size: componentSize }}
      onFinish={onFinish}
      className="w-full flex flex-col items-center"
    >
      <Form.Item name="country_code" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Select
            allowClear
            className="fw-input1 "
            showSearch
            defaultValue={"US"}
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={countryList}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Country
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: "Please enter your company name!" }]}
        name="company_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            value={companyAddress?.company_name}
            onChange={(e) => handleInputChange(e, "company_name")}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            My Company Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: "Please enter your first name!" },
          {
            pattern: new RegExp(/^[a-zA-Z ]+$/i),
            message: "Please enter only alphabet characters!",
          },
          {
            pattern: new RegExp(/^[a-zA-Z ]{2,}$/i),
            message: "Please enter at least two characters!",
          },
        ]}
        name="first_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            value={companyAddress?.first_name}
            onChange={(e) => handleInputChange(e, "first_name")}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            First Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: "Please enter your last name!" },
          {
            pattern: new RegExp(/^[a-zA-Z]+$/i),
            message: "Please enter only alphabet characters!",
          },
          {
            pattern: new RegExp(/^[a-zA-Z ]{2,}$/i),
            message: "Please enter at least two characters!",
          },
        ]}
        name="last_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            value={companyAddress?.last_name}
            onChange={(e) => handleInputChange(e, "last_name")}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Last Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: "Please enter your address line 1 !" },
        ]}
        name="address_1"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            value={companyAddress?.address_1}
            onChange={(e) => handleInputChange(e, "address_1")}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Address Line 1
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: false, message: "Please enter your address line 2" },
        ]}
        name="address_2"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            value={companyAddress?.address_2}
            onChange={(e) => handleInputChange(e, "address_2")}
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
            className="fw-input"
            value={companyAddress?.city}
            onChange={(e) => handleInputChange(e, "city")}
          />
          <label htmlFor="floating_outlined" className="fw-label">
            City
          </label>
        </div>
      </Form.Item>

      <Form.Item
        // rules={[{ required: true, message: 'Please enter your state!' }]}
        name="state_code"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Select
            allowClear
            showSearch
            className="fw-input1 "
            onChange={onChangeState}
            filterOption={filterOption}
            options={stateData}
            value={
              companyAddress && !stateCode
                ? businessInfo?.state_code &&
                  convertUsStateAbbrAndName(businessInfo?.state_code)
                : stateCode && stateCode
            }
          >
            <label htmlFor="floating_outlined" className="fw-label">
              State
            </label>
          </Select>
        </div>
      </Form.Item>

      <Form.Item
        rules={[
          { required: true, message: "Please enter your zip!" },
          {
            pattern: new RegExp(/^[0-9]{2,7}$/),
            message: "Please enter a valid zip !",
          },
        ]}
        name="zip_postal_code"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <InputNumber
            type="number"
            value={companyAddress?.zip_postal_code}
            onChange={(e) => handleInputChange(e, "zip_postal_code")}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Zip
          </label>
        </div>
      </Form.Item>

      <Form.Item
        rules={[
          { required: true, message: "Please enter your phone number!" },
          {
            pattern: new RegExp(/^[0-9]{2,14}$/),
            message: "Please enter a valid phone number!",
          },
        ]}
        name="phone"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <InputNumber
            type="number"
            value={companyAddress?.phone}
            onChange={(e) => handleInputChange(e, "phone")}
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
    <div className="flex max-md:flex-col  justify-end items-center w-full h-full p-8">
      <div className="w-1/2 max-md:w-full flex flex-col justify-center md:border-r-2 max-md:border-b-2 max-md:mb-8 items-center h-[600px]">
        <div className="text-left text-gray-400 pt-4">
          <p className="text-lg  font-bold">My Company Info </p>
          <p className="pt-5">
            You can change this info later within your account.
          </p>
          <p>
            This information will be used as the sender on packing <br /> slips
            and shiping labels.
          </p>
          <p className="text-lg py-4 ">Optional logo </p>
          <img
            className="py-2 border-gray-300 border-2 rounded-lg "
            src={uploadYourLogo}
          />
          <p className="py-5">
            If provided, will appear on packing slips and <br /> shipping
            labels. Please upload a PNG or JPG file. <br /> This will be resized
            and saved as 600*180 pixels.{" "}
          </p>
        </div>
      </div>
      <div className="w-1/2 max-md:w-full">
        <div className="container mx-auto px-5 py-2 lg:px-8 md:px-4 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            {displayTurtles}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCompany;
