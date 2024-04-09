import React, { useState } from 'react';
import {
  Checkbox,
  Form,
  Input,
  Select,
  Tabs,
  Radio, 
  Space
} from 'antd';
import type { TabsProps } from 'antd';
import type { RadioChangeEvent } from 'antd';

const onChange = (key: string) => {
  console.log(key);
};

const ShippingPreference: React.FC = () => {
  const [componentSize, setComponentSize] = useState<SizeType | 'default'>('default');
  const [value, setValue] = useState(1);
  const onChange1 = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
  };

  const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]['size'];


const displayTurtles =  <Form
labelCol={{ span: 4 }}
wrapperCol={{ span: 14 }}
layout="horizontal"
className="w-full "
>
  
      
    <Radio.Group className='text-gray-400' onChange={onChange1} value={value}>
      <Space direction="vertical" className='text-gray-400'>
        <Radio value={1} className='text-gray-400 align-text-top'>
          <strong>
            Most Economical
          </strong>
          <br />
          <span>
          It is usually used to let the browser see your Radio.Group as a real "group" and keep the default behavior. For example, using left/right
          </span> 
        </Radio>
        <Radio className='text-gray-400' value={2}>
        <strong>

          Ship Prints Rolled
        </strong>
          <br />
          <span>
          It is usually used to let the browser see your Radio.Group as a real "group" and keep the default behavior. For example, using left/right
          </span> 
        </Radio>
        <Radio className='text-gray-400' value={3}>
          <strong>

          Ship Prints Flat
          </strong>
          <br />
          <span>
          It is usually used to let the browser see your Radio.Group as a real "group" and keep the default behavior. For example, using left/right
          </span>
        </Radio>
        <Radio className='text-gray-400' value={4}>
          <strong>
            Fastest
          </strong>
          <br />
          <span>
          It is usually used to let the browser see your Radio.Group as a real "group" and keep the default behavior. For example, using left/right
          </span>
        </Radio>
      </Space>
    </Radio.Group>

</Form>      
 

 const items: TabsProps['items'] = [
  {
    key: '1',
    label: <strong  className='text-gray-400'>Preference 1</strong>,
    children: displayTurtles,
  },
  {
    key: '2',
    label: <strong  className='text-gray-400'>Preference 2</strong>,
    children: displayTurtles,
  },
  {
    key: '3',
    label: <strong  className='text-gray-400'>Preference 3</strong>,
    children: displayTurtles,
  },
];

 
  return (
     <div className="flex max-md:flex-col justify-end items-center  w-full h-full p-8 max-md:py-8 max-md:px-4 max-sm:-ml-[30px]">
      <div className="w-1/2 flex flex-col justify-start md:border-r-2 items-center md:h-[600px]">
        <div className="container mx-auto  py-2 md:px-32 justify-center items-center w-full text-gray-400 ">
          <p className='text-lg  font-bold' >Shipping Preferences  </p>
          <p className='pt-5'>
            You can have up to 3 shipping  preferences. In the rare instance a <br />
            option  is not available, the option in your next "preference" <br />
            will be used.
          </p>
    
        </div>
       
      </div>
      <div className="w-1/2 flex justify-start h-screen max-md:-ml-[30px]">
        <div className="container mx-auto md:px-5 py-2  justify-start items-center">
          <div className="mt-4 mx-4 flex flex-wrap md:-m-2 justify-start items-center">
          <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
   
  );
};

export default ShippingPreference;