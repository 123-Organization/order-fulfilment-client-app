import React, { useState } from 'react';
import { Radio, Space, Form } from 'antd';
import type { RadioChangeEvent } from 'antd';

interface ShippingPreferencesOptionProps {
  onChange: (value: number) => void; 
}

const ShippingPreferencesOption: React.FC<ShippingPreferencesOptionProps> = ({ onChange }) => {
  const [value, setValue] = useState<number>(1);

  const onChange1 = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      className="w-full "
    >
      <Radio.Group className="text-gray-400" onChange={onChange1} value={value}>
        <Space direction="vertical" className="text-gray-400">
          <Radio value={1} className="text-gray-400 align-text-top">
            <strong>Most Economical</strong>
            <br />
            <span>
              It is usually used to let the browser see your Radio.Group as a real "group" and
              keep the default behavior.
            </span>
          </Radio>
          <Radio className="text-gray-400" value={2}>
            <strong>Ship Prints Rolled</strong>
            <br />
            <span>
              It is usually used to let the browser see your Radio.Group as a real "group" and
              keep the default behavior.
            </span>
          </Radio>
          <Radio className="text-gray-400" value={3}>
            <strong>Ship Prints Flat</strong>
            <br />
            <span>
              It is usually used to let the browser see your Radio.Group as a real "group" and
              keep the default behavior.
            </span>
          </Radio>
          <Radio className="text-gray-400" value={4}>
            <strong>Fastest</strong>
            <br />
            <span>
              It is usually used to let the browser see your Radio.Group as a real "group" and
              keep the default behavior.
            </span>
          </Radio>
        </Space>
      </Radio.Group>
    </Form>
  );
};

export default ShippingPreferencesOption;
