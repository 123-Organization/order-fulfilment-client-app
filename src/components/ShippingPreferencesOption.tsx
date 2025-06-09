import React, { useState, useEffect } from "react";
import { Radio, Space, Form } from "antd";
import type { RadioChangeEvent } from "antd";

interface ShippingPreferencesOptionProps {
  onChange: (value: number) => void;
  initialValue?: string;
}

const ShippingPreferencesOption: React.FC<ShippingPreferencesOptionProps> = ({
  onChange,
  initialValue = "1",
}) => {
  const [value, setValue] = useState<number>(parseInt(initialValue) || 1);

  // Update value if initialValue changes
  useEffect(() => {
    if (initialValue) {
      setValue(parseInt(initialValue) || 1);
    }
  }, [initialValue]);

  const handleChange = (e: RadioChangeEvent) => {
    console.log("radio checked", e.target.value);
    setValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <Form layout="vertical" className="w-full">
      <Radio.Group className="w-full " onChange={handleChange} value={value}>
        <Space direction="vertical" className="w-full" size={16}>
          <Radio value={1} className="w-full ">
            <div className="flex flex-col text-gray-400 ">
              <strong className="text-base md:text-base ">
                Most Economical
              </strong>
              <span className="text-sm md:text-base mt-1 ">
                Automatically selects the least expensive shipping method
                available for the order. Delivery times may vary depending on
                destination and shipping carrier. Ideal for customers who
                prioritize cost savings over speed.
              </span>
            </div>
          </Radio>
          <Radio value={2} className="w-full">
            <div className="flex flex-col text-gray-400">
              <strong className="text-base md:text-base">
                Ship Prints Rolled
              </strong>
              <span className="text-sm md:text-base mt-1">
                Prints are shipped rolled in a tube or tube-like box. This
                option helps reduce the risk of creases or bent corners during
                transit and is typically used for larger unframed prints or
                posters.
              </span>
            </div>
          </Radio>
          <Radio value={3} className="w-full">
            <div className="flex flex-col text-gray-400">
              <strong className="text-base md:text-base">
                Ship Prints Flat
              </strong>
              <span className="text-sm md:text-base mt-1">
                Prints are shipped flat, packed between rigid materials for
                extra protection. Recommended for smaller prints or when
                presentation upon unboxing is a priority.
              </span>
            </div>
          </Radio>
          <Radio value={4} className="w-full">
            <div className="flex flex-col text-gray-400">
              <strong className="text-base md:text-base">Fastest</strong>
              <span className="text-sm md:text-base mt-1">
                Prioritizes the quickest available shipping method. Ideal for
                rush orders or time-sensitive deliveries. Additional shipping
                charges may apply based on location and order size.
              </span>
            </div>
          </Radio>
        </Space>
      </Radio.Group>
    </Form>
  );
};

export default ShippingPreferencesOption;
