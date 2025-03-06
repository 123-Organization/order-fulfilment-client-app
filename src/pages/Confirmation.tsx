import { Button, Result, ConfigProvider, Card, Col, Row } from "antd";
import { useEffect, useState } from "react";
import { useAppSelector } from "../store";
import style from "./Pgaes.module.css";
import { Steps } from "antd";

export default function Confirmation() {
  const [isLoadeing, setIsLoading] = useState(false);
  const [icon, setIcon] = useState<"success" | "error" | "info" | "warning">(
    "success"
  );
  const [title, setTitle] = useState("All Orderes Successfully Purchased ");
  const [subTitle, setSubTitle] = useState(
    "Order number: 201718281882818288 Confirmation takes 1-10 seconds"
  );
  const paymentStatus = useAppSelector((state) => state.Payment.status);
  const [confirmation, setConfirmation] = useState({first:"Finished", second:"Finished"});
  const [step , setStep] = useState(3);
  const [stepStatus, setStepStatus] = useState<"error" | "finish" | "wait" | "process" | undefined>("finish");

  useEffect(() => {
    if (paymentStatus === "succeeded") {
      setIsLoading(false);
    } else if (paymentStatus === "failed") {
      setIsLoading(true);
      setIcon("error");
      setTitle("Transaction Failed");
      setSubTitle("Payment has been declined. Please try again.");
      setConfirmation({ first: "Error", second: "in progress" });
      setStep(1)
      setStepStatus("error")
    }
  }, [paymentStatus]);

  const description = "Select the orders";
  const step2_description = "Make A payment";
  const step3_description = " Order Confirmation";
  const ButtonName = confirmation.first === "Finished" ? "Continue Shopping" : "Back to payment";
  return (
    <div>
      <div className="p-4 mb-2  ">
        <Steps
          current={step}
          status={stepStatus}
          items={[
            {
              title: "Finished",
              description,
            },
            {
              title: confirmation.first,
              description: step2_description,
            },
            {
              title: confirmation.second,
              description: step3_description,
            },
          ]}
        />
      </div>
      <ConfigProvider
        theme={{
          components: {
            Result: {
              iconFontSize: 90,
            },
          },
        }}
      >
        <Result
          status={icon}
          title={title}
          subTitle={subTitle}
          className=""
          extra={[
            <div className="w-full flex justify-center">
              <button color="danger" className={`${ confirmation.first === "Finished"? style.btn : style.btnError} bg-black  ` } style={{textTransform: "uppercase"}}>
                {ButtonName}
              </button>
            </div>,
          ]}
        />
      </ConfigProvider>
    </div>
  );
}
