import React, { useState, useEffect } from 'react';
import { Radio, Space, Form } from 'antd';
import type { RadioChangeEvent } from 'antd';

interface ShippingPreferencesOptionProps {
  onChange: (value: number) => void;
  initialValue?: string; 
}

const ShippingPreferencesOption: React.FC<ShippingPreferencesOptionProps> = ({ 
  onChange, 
  initialValue = "1"
}) => {
  const [value, setValue] = useState<number>(parseInt(initialValue) || 1);

  // Update value if initialValue changes
  useEffect(() => {
    if (initialValue) {
      setValue(parseInt(initialValue) || 1);
    }
  }, [initialValue]);

  const handleChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <Form
      layout="vertical"
      className="w-full"
    >
      <Radio.Group className="w-full" onChange={handleChange} value={value}>
        <Space direction="vertical" className="w-full" size={16}>
          <Radio value={1} className="w-full">
            <div className="flex flex-col text-gray-400">
              <strong className="text-base md:text-base">Most Economical</strong>
              <span className="text-sm md:text-base mt-1">
                It is usually used to let the browser see your Radio.Group as a real "group" and
                keep the default behavior.
              </span>
            </div>
          </Radio>
          <Radio value={2} className="w-full">
            <div className="flex flex-col text-gray-400">
              <strong className="text-base md:text-base">Ship Prints Rolled</strong>
              <span className="text-sm md:text-base mt-1">
                It is usually used to let the browser see your Radio.Group as a real "group" and
                keep the default behavior.
              </span>
            </div>
          </Radio>
          <Radio value={3} className="w-full">
            <div className="flex flex-col text-gray-400">
              <strong className="text-base md:text-base">Ship Prints Flat</strong>
              <span className="text-sm md:text-base mt-1">
                It is usually used to let the browser see your Radio.Group as a real "group" and
                keep the default behavior.
              </span>
            </div>
          </Radio>
          <Radio value={4} className="w-full">
            <div className="flex flex-col text-gray-400">
              <strong className="text-base md:text-base">Fastest</strong>
              <span className="text-sm md:text-base mt-1">
                It is usually used to let the browser see your Radio.Group as a real "group" and
                keep the default behavior.
              </span>
            </div>
          </Radio>
        </Space>
      </Radio.Group>
    </Form>
  );
};

export default ShippingPreferencesOption;
