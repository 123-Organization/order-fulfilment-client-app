import React from "react";
import { Flex, Spin, Switch } from "antd";

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message = "" }) => {
  const [auto, setAuto] = React.useState(false);
  const [percent, setPercent] = React.useState(-50);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  //css for spinner

  const style = {
    color: "#798645",
    backGroundColor: "#798645",
  };
  React.useEffect(() => {
    timerRef.current = setTimeout(() => {
      setPercent((v) => {
        const nextPercent = v + 5;
        return nextPercent > 150 ? -50 : nextPercent;
      });
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [percent]);

  const mergedPercent = percent;

  return (
    <Flex align="center" gap="middle" className="flex-col">
      <Spin percent={mergedPercent} size="large" style={style} />
      <p className="text-gray-600 mt-4 text-base ">
        {" "}
       {message}
      </p>
    </Flex>
  );
};

export default Spinner;
