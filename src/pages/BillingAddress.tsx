import React, { useState, useEffect } from 'react';
import {
  Checkbox,
  Form,
  Input,
  Select
} from 'antd';

import { getStates } from "country-state-picker";
import type { SelectProps } from 'antd';
import { countryType } from '../types/ICountry';
import type { CheckboxProps } from 'antd';
import { useAppDispatch, useAppSelector } from "../store";
import { updateBilling } from "../store/features/orderSlice";
import convertUsStateAbbrAndName from '../services/state';

const  countryList = require("../json/country.json");

const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]['size'];

const BillingAddress: React.FC = () => {

  const [countryCode, setCountryCode] = useState('us');
  const [componentSize, setComponentSize] = useState<SizeType | 'default'>('default');
  const [stateData, setStateData] = useState<SelectProps['options']>([]);
  const [stateCode, setStateCode] = useState('');
  const [stateCodeShort, setStateCodeShort] = useState<String | null>('');
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();

  const myCompanyInfoFilled = useAppSelector(
    (state) => state.order.myCompanyInfoFilled
  );
  
  const checkboxClick : CheckboxProps['onChange'] = (e) => {
    console.log('value......',e.target.checked,myCompanyInfoFilled.business_info)
    if(e.target.checked){
      // let billingInfo = myCompanyInfoFilled.business_info
      form.setFieldsValue(
        // myCompanyInfoFilled.business_info
        {'first_name':"werwer"}
      );
    } else {
      // form.resetFields();
    }
  }
  const onChangeState = (value: string) => {
    let state_code = value?.toLowerCase();
    console.log(`onChangeState ${state_code}`);
    setStateCode(state_code);
    countryCode==='us' && setStateCodeShort(convertUsStateAbbrAndName(state_code))
  };

  const onChange = (value: string) => {
    let country_code = value?.toLowerCase();
    console.log(`selected ${country_code}`);
    setStates(country_code?.toLowerCase());
    setCountryCode(country_code)
  };

  const setStates = (value: string='us') => {
    let states = getStates(value);
    let data:countryType[] = (states || []).map((d:string) => ({
      label: d,
      value: d
    }));

    setStateData(data);
    
  }

  const onValid = () => {
    // form.resetFields();
    let value = form.getFieldsValue()
    value.country_code = countryCode;
    value.state_code = countryCode==='us'?stateCodeShort:stateCode;
    // value.address_order_po="this is test";
    
    
    console.log(`onValid `,value);
    let eveVal = Object.values(value).every(Boolean)
    if(!eveVal){
      form.submit()

    }
    // value.email = "james@gmail.com";
    value.province="";
    // value.address_3=null;
    console.log(`eveVal `,eveVal);
    // const isFormValid = () => form.getFieldsError().some((item) => item.errors.length > 0)
    // https://github.com/ant-design/ant-design/issues/15674
    // console.log('isFormValid',form.getFieldsError(),isFormValid(),valid)
    if(eveVal){
      // let valid = form.validateFields();
      form.validateFields()
      .then(() => {
        // do whatever you need to
        dispatch(updateBilling({billing_info:value}));
      })
      .catch((err) => {
        console.log(err);
      });
      // console.log('isFormValid',valid)
      // dispatch(updateCompany({billing_info:value}));
    }

    // return true;

  }


  const onSearch = (value: string) => {
    console.log('search:', value);
  };
  
  // Filter `option.label` match the user type `input`
  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


  useEffect(() => {
    // if(orders && !orders?.data?.length) {
      //dispatch(updateCompanyInfo(21));
      // } 
      onChange(countryCode);
      // setTimeout(() => {
      // }, 3000);
  },[]);

  const displayTurtles =  <Form
  form={form} 
  labelCol={{ span: 4 }}
  wrapperCol={{ span: 14 }}
  layout="horizontal"
  initialValues={{ size: componentSize }}
  className="w-full flex flex-col items-center"
>
      <Form.Item name="country_code" className='w-full sm:ml-[200px]' >
      <div className="relative">
        
        <Select
          // allowClear
          showSearch
          defaultValue={'US'}
    placeholder="Select a country"
    optionFilterProp="children"
    onChange={onChange}
    onSearch={onSearch}
    filterOption={filterOption}
    options={countryList}
    onBlur={onValid}  
        >
       
        </Select>
        <label htmlFor="floating_outlined" className="fw-label">Country</label>
      </div>

      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: 'Please input your Company Name!' }]}
        name="company_name"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input onBlur={onValid}   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">My Company Name</label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: 'Please input your First Name!' },
          { pattern: new RegExp(/^[a-zA-Z]+$/i), message: 'Please input only alphabet characters!' }
      ]}
        name="first_name"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input onBlur={onValid}   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">First Name</label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: 'Please input your Last Name!' },
          { pattern: new RegExp(/^[a-zA-Z]+$/i), message: 'Please input only alphabet characters!' }
        ]}
        name="last_name"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input onBlur={onValid}   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Last Name</label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: 'Please input your Address Line 1!' }]}
        name="address_1"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input onBlur={onValid}    className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Address Line 1</label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: 'Please input your Address Line 2!' }]}
        name="address_2"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input  onBlur={onValid}  className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Address Line 2</label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: 'Please input your city!' }]}
        name="city"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input onBlur={onValid}   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">City</label>
        </div>
      </Form.Item>

      
      <Form.Item
        // rules={[{ required: true, message: 'Please input your state!' }]}
        name="state_code"
        className='w-full sm:ml-[200px]'
      >
         <div className="relative">
          <Select
            allowClear
            showSearch
            onBlur={onValid} 
            className='fw-input1 '
            onChange={onChangeState}
            filterOption={filterOption}
            options={stateData}
          >
          <label htmlFor="floating_outlined" className="fw-label">State</label>
          </Select>
        </div>
      </Form.Item>

      
      <Form.Item
        name="zip_postal_code"
        className='w-full sm:ml-[200px]'
        rules={[{ required: true, message: 'Please input your Zip!' },
        {
          pattern: new RegExp(/\d{2,}/g),
          message: 'The input should be a number'
        }]}
      >
        <div className="relative">
        
          <Input  onBlur={onValid}  className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Zip</label>
        </div>
      </Form.Item>

      <Form.Item
        name="phone"
        className='w-full sm:ml-[200px]'
        rules={[{ required: true, message: 'Please input your Phone!' },
        {
          pattern: new RegExp(/\d{2,}/g),
          message: 'The input should be a number'
        }]}
      >
        <div className="relative">
        
          <Input onBlur={onValid}   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Phone</label>
        </div>
      </Form.Item>

</Form>      

  return (
     <div className="flex justify-end items-center w-full h-full p-8 max-md:flex-col max-md:mt-12">
      <div className="
          w-1/2  flex flex-col justify-center items-center h-[600px] max-md:w-full 
          md:border-r-2 max-md:border-b-2 max-md:mb-8
        ">
        <div className="text-left text-gray-400 pt-4">
          <p className='text-lg  font-bold' >My Billing Address  </p>
          <p className='pt-5'>You can change this info later within your account.</p>
          <p>
            <Checkbox
              className="py-10 align-text-top  text-gray-400 "
              onChange={checkboxClick}
              // checked
            >
              Check if same as company address
            </Checkbox>
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

export default BillingAddress;