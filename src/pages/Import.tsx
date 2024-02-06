import React, { useState } from 'react';
import {
  Checkbox,
  Form,
  Input,
  Select
} from 'antd';


const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]['size'];

const Import: React.FC = () => {
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

    const displayTurtles1 =  <Form
    labelCol={{ span: 4 }}
    wrapperCol={{ span: 14 }}
    layout="horizontal"
    initialValues={{ size: componentSize }}
    className="w-full "
  >

 <Form.Item
        name="order_number_id"
        className='w-f'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">Order Number ID</label>
        </div>
      </Form.Item>

  </Form>  


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
    placeholder="Order status"
    optionFilterProp="children"
    onChange={onChange}
    onSearch={onSearch}
    filterOption={filterOption}
    options={[
      {
        value: 'not_shipped',
        label: 'Not Shipped',
      },
      {
        value: 'shipped',
        label: 'Shipped',
      },
      {
        value: 'on_way',
        label: 'On Way',
      },
    ]}
        >
       
        </Select>
        <label htmlFor="floating_outlined" className="fw-label">Order Status</label>
      </div>

      </Form.Item>
      <Form.Item
        name="from_date"
        className='w-f'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">From Date (Optional)</label>
        </div>
      </Form.Item>

     

      <Form.Item
        name="to_date"
        className='w-f'
      >
        <div className="relative">
        
          <Input   className='fw-input' />
          <label htmlFor="floating_outlined" className="fw-label">To Date (Optional)</label>
        </div>
      </Form.Item>

</Form>      

  return (
     <div className="flex justify-end items-center w-full h-full p-8">
      <div className="w-1/2 flex flex-col justify-center border-r-2 items-center h-[600px]">
        <div className="container mx-auto  py-2 px-32 justify-center items-center w-full text-gray-400 ">
          <p className='text-lg  font-bold' >Etsy Import  </p>
          <p className='pt-5'>
            Import orders or even a single orders
          </p>
    
        </div>
          <div className="container mx-auto px-5 py-2 lg:px-32 justify-center items-center w-full">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            {displayTurtles}
          </div>
        </div>

      </div>
      <div className="w-1/2">
        <div className="container mx-auto px-5 py-2 lg:px-32 justify-center items-center">
          <div className="mt-4 mx-4 flex flex-wrap md:-m-2">
            {displayTurtles1}
          </div>
        </div>
      </div>
    </div>
   
  );
};

export default Import;