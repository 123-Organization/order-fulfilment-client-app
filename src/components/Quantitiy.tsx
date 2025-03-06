import React, { useState, useEffect } from "react";
import { InputNumber, Space } from "antd";
import QuantityMessage from "./QuantityMessage";

type QuantityInputProps = {
  quantity: number;
  clicking: boolean;
  setclicking: (clicking: boolean) => void;
};

const QuantityInput: React.FC<QuantityInputProps> = ({ quantity, clicking, setclicking }) => {
  const [value, setValue] = useState<number>(quantity);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  const updateQuantity = (newValue: number) => {
    setValue(newValue);

    if (clickTimer) clearTimeout(clickTimer);
    setclicking(true);
    const newTimer = setTimeout(() => {
      setclicking(false);
    }, 4000);

    setClickTimer(newTimer);
  };

  const increase = () => updateQuantity(Math.min(value + 1, 50));
  const decrease = () => updateQuantity(Math.max(value - 1, 1));

  useEffect(() => {
    return () => {
      if (clickTimer){ clearTimeout(clickTimer)}
    };
  }, [clickTimer]);

  return (
    <div className="flex items-center space-x-2 w-[105px]">
      <Space direction="vertical" >
        <InputNumber
          type="number"
          value={value}
          onChange={(newVal) => updateQuantity(newVal || 1)}
          addonBefore={
            <span
              onClick={decrease}
              className="cursor-pointer  text-base "
              onMouseDown={(e) => e.preventDefault()}
            >
              -
            </span>
          }
          addonAfter={
            <span
              onClick={increase}
              className="cursor-pointer text-base"
              onMouseDown={(e) => e.preventDefault()}
            >
              +
            </span>
          }
          style={{ width: "105px" }}
        />
      </Space>

    </div>
  );
};

export default QuantityInput;
