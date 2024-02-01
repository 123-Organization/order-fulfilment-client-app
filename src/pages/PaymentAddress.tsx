import React, { useState } from 'react';
import {
  Checkbox,
  Form,
  Input,
  Select
} from 'antd';


const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]['size'];

const PaymentAddress: React.FC = () => {
  const [componentSize, setComponentSize] = useState<SizeType | 'default'>('default');


  const onChange = (value: string) => {
    console.log(`selected ${value}`);
  };

  const onSearch = (value: string) => {
    console.log('search:', value);
  };
  
  // Filter `option.label` match the user type `input`
  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


  const displayTurtles =  <Form
  labelCol={{ span: 4 }}
  wrapperCol={{ span: 14 }}
  layout="horizontal"
  initialValues={{ size: componentSize }}
  className="w-full "
>
      <Form.Item name="country_code" >
      <div className="relative">
        
        <Select
          // allowClear
          showSearch
    placeholder="Select a Card type"
    optionFilterProp="children"
    onChange={onChange}
    onSearch={onSearch}
    filterOption={filterOption}
    options={[
      {
        value: 'jack',
        label: 'Jack',
      },
      {
        value: 'lucy',
        label: 'Lucy',
      },
      {
        value: 'tom',
        label: 'Tom',
      },
    ]}
        >
       
        </Select>
        <label htmlFor="floating_outlined" className="fw-label">Card Type</label>
      </div>

      </Form.Item>
      <Form.Item
        name="company_name"
        className='w-f'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Card Number</label>
        </div>
      </Form.Item>

      <Form.Item name="country_code" >
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
        value: 'jack',
        label: 'Jack',
      },
      {
        value: 'lucy',
        label: 'Lucy',
      },
      {
        value: 'tom',
        label: 'Tom',
      },
    ]}
        >
       
        </Select>
        <label htmlFor="floating_outlined" className="fw-label">Expiry Month</label>
      </div>

      </Form.Item>


      <Form.Item name="country_code" >
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
        value: 'jack',
        label: 'Jack',
      },
      {
        value: 'lucy',
        label: 'Lucy',
      },
      {
        value: 'tom',
        label: 'Tom',
      },
    ]}
        >
       
        </Select>
        <label htmlFor="floating_outlined" className="fw-label">Expiry Year</label>
      </div>

      </Form.Item>

      <Form.Item
        name="first_name"
        className='w-f'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">CVV</label>
        </div>
      </Form.Item>
      <p>
            <Checkbox
              className="py-10 align-text-top  text-gray-400 "
              checked
            >
              Check if same as company address
            </Checkbox>
          </p>
</Form>      

  return (
     <div className="flex justify-end items-center w-full h-full p-8">
      <div className="w-1/2 flex flex-col justify-center border-r-2 items-center h-[600px]">
        <div className="text-left text-gray-400 pt-4">
          <p className='text-lg  font-bold' >Add Payment Method  </p>
          <p className='pt-5'>
            This will be used for orders you submit for Fulfilment.<br/>
            Name and address must be assigned to billing address<br/>
            from the previous step.<br/>
          </p>
        
        </div>
      </div>
      <div className="w-1/2">
        <div className="container mx-auto px-5 py-2 lg:px-32 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            {displayTurtles}
          </div>
        </div>
      </div>
    </div>
   
  );
};

export default PaymentAddress;