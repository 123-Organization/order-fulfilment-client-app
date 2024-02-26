import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select
} from 'antd';

import uploadYourLogo from "../assets/images/upload-your-logo.svg";
import { getStates } from "country-state-picker";
import type { SelectProps } from 'antd';
import { countryType } from '../types/ICountry';

const  countryList = require("../json/country.json");


const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]['size'];

const MyCompany: React.FC = () => {
  const [componentSize, setComponentSize] = useState<SizeType | 'default'>('default');
  const [stateData, setStateData] = useState<SelectProps['options']>([]);
  
  const setStates = (value: string='us') => {
    let states = getStates(value);
    let data:countryType[] = (states || []).map((d:string) => ({
      label: d,
      value: d
    }));

    setStateData(data);
    
  }

  const onChange = (value: string) => {
    console.log(`selected ${value}`);
    setStates(value?.toLowerCase());
    
  };

  const onSearch = (value: string) => {
    console.log('search:', value);
    //setStates(value);
  };
  
  // Filter `option.label` match the user type `input`
  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    setStates()
  },[]);

  const displayTurtles =  <Form
  labelCol={{ span: 4 }}
  wrapperCol={{ span: 14 }}
  layout="horizontal"
  initialValues={{ size: componentSize }}
  className="w-full flex flex-col items-center"
>
      <Form.Item name="country_code" className='w-full sm:ml-[200px]' >
      <div className="relative">
        
        <Select
          allowClear
          className='fw-input1 '
          showSearch
          defaultValue={'US'}
          onChange={onChange}
          onSearch={onSearch}
          filterOption={filterOption}
          options={countryList}

        >
        
        </Select>
        <label htmlFor="floating_outlined" className="fw-label">Country</label>
      </div>

      </Form.Item>
      <Form.Item
        name="company_name"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">My Company Name</label>
        </div>
      </Form.Item>
      <Form.Item
        name="first_name"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">First Name</label>
        </div>
      </Form.Item>
      <Form.Item
        name="last_name"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Last Name</label>
        </div>
      </Form.Item>
      <Form.Item
        name="address_1"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Address Line 1</label>
        </div>
      </Form.Item>
      <Form.Item
        name="address_2"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Address Line 2</label>
        </div>
      </Form.Item>
      <Form.Item
        name="city"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">City</label>
        </div>
      </Form.Item>

      
      <Form.Item
        name="state"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
          <Select
            allowClear
            showSearch
            className='fw-input1 '
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
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Zip</label>
        </div>
      </Form.Item>

      <Form.Item
        name="phone"
        className='w-full sm:ml-[200px]'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Phone</label>
        </div>
      </Form.Item>

</Form>      

  return (
     <div className="flex max-md:flex-col  justify-end items-center w-full h-full p-8">
      <div className="w-1/2 max-md:w-full flex flex-col justify-center md:border-r-2 max-md:border-b-2 max-md:mb-8 items-center h-[600px]">
        <div className="text-left text-gray-400 pt-4">
          <p className='text-lg  font-bold' >My Company Info  </p>
          <p className='pt-5'>You can change this info later within your account.</p>
          <p>This information will be used as the sender on packing <br /> slips and shiping labels.</p>
          <p className='text-lg py-4 ' >Optional logo  </p>
          <img className='py-2 border-gray-300 border-2 rounded-lg '  src={uploadYourLogo} />
          <p className='py-5'>If provided, will appear on packing slips and <br /> shipping labels. Please upload a PNG or JPG file. <br /> This will be resized and saved as 600*180 pixels. </p>
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
