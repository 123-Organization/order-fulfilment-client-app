import React, { useEffect, useState, useRef  } from "react";
import { Form, Input, InputNumber, Select, Switch, Modal, Button } from "antd";

import { updateCompany, updateCompanyInfo } from "../store/features/companySlice";
import uploadYourLogo from "../assets/images/upload-your-logo.svg";
import { getStates } from "country-state-picker";
import type { SelectProps } from "antd";
import { countryType } from "../types/ICountry";
import { useAppDispatch, useAppSelector } from "../store";
import convertUsStateAbbrAndName from "../services/state";
import { updateIframeState } from "../store/features/companySlice";
import _ from 'lodash';
import  styles  from "./Pgaes.module.css";   
import placeholder from "../assets/images/placeholder.jpg";

/*////////////////////////////////////////////////////*/

const countryList = require("../json/country.json");
const allowedCountry = {
  label: 'United States',
  value: 'US'
}
type SizeType = Parameters<typeof Form>[0]["size"];

const MyCompany: React.FC = () => {
  const dispatch = useAppDispatch();
  const businessInfo = useAppSelector(
    (state) => state.company?.company_info?.data?.business_info
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const com_info = useAppSelector((state) => state.company?.company_info);
  console.log("com_info", com_info);
  console.log("businessInfo", businessInfo);
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const [stateData, setStateData] = useState<SelectProps["options"]>(
    [] as SelectProps["options"]
  );
  const [countryCode, setCountryCode] = useState("");
  const [stateCodeShort, setStateCodeShort] = useState<String | null>("");
  const [stateCode, setStateCode] = useState<String | null>("");
  const [form] = Form.useForm();
  const [useStateInput, setUseStateInput] = useState(false);
  const [showLocationOverlay, setShowLocationOverlay] = useState(false);
  const [companyAddress, setCompanyAddress] = useState({
    country_code: "us",
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

  /*////////////////////////////////////////////////////*/

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

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
    setCompanyAddress({ ...companyAddress, country_code: country_code });
    if (businessInfo?.state_code) {
      if (country_code === "us") {
        onFinish({ ...companyAddress, country_code: country_code });
      } else {
        onFinish({
          ...companyAddress,
          country_code: country_code,
          state_code: "",
        });
      }
    }
  };
  const onChangeState = (value: string) => {
    let state_code: string | null = value?.toLowerCase();
    console.log(`onChangeState ${state_code}`, countryCode);
    setStateCode(state_code);
    if (countryCode === "us")
      setStateCodeShort(convertUsStateAbbrAndName(state_code));
    else setStateCodeShort(state_code);
    onFinish({ ...companyAddress, state_code: state_code });
  };

  const onFinish = (values) => {
    console.log("veve", values);
    let updatedValues = { ...companyAddress, ...values };
    // updatedValues.country_code = countryCode;
    if (countryCode === "us" && updatedValues.state_code) {
      // Only convert if it's NOT already an abbreviation (2 characters)
      // This ensures we always send the state code, not the full name
      if (updatedValues.state_code.length !== 2) {
        updatedValues.state_code = convertUsStateAbbrAndName(
          updatedValues?.state_code
        );
      }
    }
    if (countryCode !== "us" && updatedValues.state_code) {
      updatedValues.province = updatedValues?.state_code;
      updatedValues.state_code = "";
    }
    updatedValues.phone = updatedValues?.phone?.toString();
    updatedValues.zip_postal_code = updatedValues?.zip_postal_code?.toString();
    console.log("uptp", updatedValues);
    // Get form validation errors
    form
      .validateFields()
      .then(() => {
        // If validation is successful, dispatch the updateCompany action
        dispatch(
          updateCompany({ business_info: updatedValues, validFields: {} })
        );
      })
      .catch((errorInfo) => {
        console.log("errorInfo", errorInfo);
        // Handle form validation errors
        const errors = errorInfo.errorFields.reduce((acc, field) => {
          acc[field.name[0]] = field.errors;
          return acc;
        }, {});

        // Pass errors to the dispatch
        dispatch(
          updateCompany({ business_info: updatedValues, validFields: errors })
        );
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
  console.log("add", companyAddress);

  useEffect(() => {
    let state = countryCode === "us" ? stateCodeShort : stateCode;
    state = convertUsStateAbbrAndName(state as string);
    console.log("stoto", state);
    setCompanyAddress({ ...companyAddress, state_code: state as string });
    dispatch(updateCompany({ business_info: businessInfo, validFields: {} }));
  }, [stateCode, stateCodeShort, countryCode]);
  console.log("compa", companyAddress?.company_name );

  useEffect(() => {
    // Check if this is the first time the user visits this page
    const hasVisitedBefore = localStorage.getItem('hasVisitedCompanyPage');
    
    // Only show overlay if not visited before and no business info
    setTimeout(() => {
    if (!businessInfo?.company_name || companyAddress?.country_code !== "us") {
        setShowLocationOverlay(true);
     
    }
    }, 2000);

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
    if (businessInfo?.first_name) {
      setCompanyAddress(businessInfo);
      setCountryCode(businessInfo?.country_code);
      setStates(businessInfo?.country_code);
      form.setFieldsValue(businessInfo);
      dispatch(updateCompany({ business_info: businessInfo, validFields: {} }));
    }
  }, [businessInfo, form]);

  const handleInputChange = (e: any, field: any) => {
    const value = e?.target ? e.target.value : e;
    setCompanyAddress((prev) => ({ ...prev, [field]: value }));
    form.setFieldsValue({ [field]: value });
    onFinish({ ...companyAddress, [field]: value });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!["image/png", "image/jpeg"].includes(file.type)) {
    Modal.error({
      title: "Invalid file type",
      content: "Please upload a PNG or JPG image.",
    });
    return;
  }

  try {
    const base64Logo = await fileToBase64(file);

    const payload = {
      account_key: com_info?.data?.account_key, 
      logo_data: base64Logo,
      // logo_url: "",
    };

    dispatch(updateCompanyInfo(payload));
  
  } catch (error: any) {
    Modal.error({
      title: "Upload failed",
      content: error.message || "Something went wrong",
    });
  }
}

  const displayTurtles = (
    <Form
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ size: componentSize }}
      onFinish={onFinish}
      className="w-full flex flex-col items-center "
    >
      <Form.Item name="country_code" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Select
            allowClear
            className="fw-input1 "
            showSearch
            defaultValue={"US"}
            onChange={onChange}
            value={countryCode?.toUpperCase() || "US"}
            onSearch={onSearch}
            filterOption={filterOption}
            options={[allowedCountry]}
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
            className="fw-input "
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
        name="state_code"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          {countryCode === "us" ? (
            <Select
              allowClear
              showSearch
              className="fw-input1"
              onChange={onChangeState}
              filterOption={filterOption}
              options={stateData}
              value={
                companyAddress && !stateCode
                  ? businessInfo?.state_code &&
                    convertUsStateAbbrAndName(businessInfo?.state_code)
                  : stateCode || ""
              }
            />
          ) : (
            <div className="relative">
              <Input
                className="fw-input"
                value={stateCode || businessInfo?.province || ""}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setStateCode(inputValue);
                  onFinish({ ...companyAddress, state_code: inputValue });
                }}
                placeholder="Enter province/region"
              />
            </div>
          )}
          <label htmlFor="floating_outlined" className="fw-label">
            {countryCode === "us" ? "State" : "Province/Region"}
          </label>
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
            pattern: new RegExp(/^[\d\s\-\(\)]{10,20}$/),
            message:
              "Please enter a valid phone number (digits, spaces, dashes, and parentheses allowed)!",
          },
        ]}
        name="phone"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            value={companyAddress?.phone || ""}
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

  // Handlers for the location overlay
  const handleUSSelected = () => {
    setCountryCode('us');
    setStates('us');
    setShowLocationOverlay(false);
    
  };

  const handleNonUSSelected = () => {
    setShowLocationOverlay(false);
    localStorage.setItem('hasVisitedCompanyPage', 'true');
    // Show contact information
    Modal.info({
      title: 'Contact FinerWorks',
      content: (
        <div>
          <p>Our services are currently optimized for US-based businesses.</p>
          <p>Please contact FinerWorks support for assistance with international business registration.</p>
          <p>Email: support@finerworks.com</p>
          <p>Phone: 1-888-555-1234</p>
        </div>
      ),
      onOk() {},
    });
  };
  const handleDeleteButton = () => {
    dispatch(updateCompanyInfo({ logo_url: "Delete" }));
  };

  // For development testing only

  return (
    <div className="flex max-md:flex-col justify-end items-center w-full h-full p-8">
      {/* Location Selection Modal */}
      <Modal
        title="Business Location"
        open={showLocationOverlay}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-6">Is your business based in the United States?</h3>
          <div className="flex justify-center space-x-4">
            <Button 
              type="primary" 
              size="large" 
              onClick={handleUSSelected}
              className="w-32"
            >
              Yes, US-based
            </Button>
            <Button 
              size="large" 
              onClick={handleNonUSSelected}
              className="w-32"
            >
              No, International
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Development testing button - only visible in development */}
    
      
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
          <div 
            className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${com_info?.data?.logo_url ? "py-2 w-[600px]" : "w-[600px] h-[300px]"}`}
            onClick={openFilePicker}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleLogoUpload }
            />
            {!com_info?.data?.logo_url && (
              <>
                <svg 
                  className="w-12 h-12 text-gray-400 mb-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 text-center mb-1">Click to upload your company logo</p>
                <p className="text-sm text-gray-400 text-center">PNG or JPG (Recommended: 600×180px)</p>
              </>
            )}
            {com_info?.data?.logo_url && (
              <img 
                src={com_info.data.logo_url} 
                alt="Company logo" 
                className="max-w-full max-h-[180px] object-contain"
              />
            )}
          </div>
         
          <div className="flex justify-between  items-center">
          <p className="py-5">
            If provided, will appear on packing slips and <br /> shipping
            labels. Please upload a PNG or JPG file. <br /> This will be resized
            and saved as 600*180 pixels.
          </p>
         {com_info?.data?.logo_url  && <button
            style={{
              border: "none",
              padding:" 10px 25px",
              borderRadius: "10px",
              textTransform: "capitalize",
              fontWeight: "400",
             
             
             
            }}
            className={`${styles.btn}`}
            onClick={() => {
              handleDeleteButton();
            }}
          >
            Delete
          </button>}
        </div>
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
