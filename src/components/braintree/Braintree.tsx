import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { useLocation } from "react-router-dom";
import dropin, { Dropin, PaymentMethodPayload } from "braintree-web-drop-in";
import "./Braintree.css";
import { useAppSelector } from "../../store";
// https://developer.paypal.com/braintree/docs/guides/credit-cards/testing-go-live/node#test-value-6243030000000001

type BraintreeProps = {
  clientToken: string;
  show: boolean;
  checkout: (nonce: string) => void;
  addPaymentMethod: (payload: any) => void;
  remainingTotal: number;
  
};

const Braintree = ({
  clientToken,
  show,
  checkout,
  addPaymentMethod,
  remainingTotal,
}: BraintreeProps) => {
  const [braintreeInstance, setBraintreeInstance] = useState<
    Dropin | undefined
  >();

  const location = useLocation();
  const SelectedCard = useAppSelector((state) => state.Payment.selectedCard);
  console.log("SelectedCard", SelectedCard);

  useEffect(() => {
    if (show) {
      console.log("clientToken...", clientToken);
      const config = {
        authorization: clientToken,
        container: "#braintree-drop-in-div",
        paypal: {
          flow: "vault",
        },
        vault: true,
      };

      /**
       * InitializeBraintree Method Callback
       * @param error
       * @param instance
       */
      const callback = (error: object | null, instance: Dropin | undefined) => {
        if (error) console.error(error);
        else setBraintreeInstance(instance);
      };

      const initializeBraintree = () => dropin.create(config, callback);

      if (braintreeInstance) {
        braintreeInstance.teardown().then(() => {
          initializeBraintree();
        });
      } else {
        initializeBraintree();
      }
    }
  }, [show]);
  const companyInfo = useAppSelector((state) => state.company?.company_info);

  const requestPaymentMethod = () => {
    /**
     * RequestPaymentMethod Callback
     * @param error
     * @param payload
     */
    const callback = (error: object | null, payload: PaymentMethodPayload) => {
      if (error) {
        console.error(error);
      } else {
        const nonceFromClient = payload.nonce;
        const paymentMethodNonce = payload.nonce;
        const customerId = companyInfo?.data?.payment_profile_id;

        console.log("payment method nonce", payload.nonce);
        const finalPayload = {
          nonceFromClient,
          customerId,
          amount: 0,
          vault: true,
        };
        console.log("finalPayload", finalPayload);
        // TODO: use the paymentMethodNonce to
        // call you server and complete the payment here
        addPaymentMethod(finalPayload);
        // checkout(paymentMethodNonce);
      }
    };

    braintreeInstance && braintreeInstance.requestPaymentMethod(callback);
  };

  const BbuttonName =
    location.pathname === "/checkout" ? "Add Card" : "Add Card";

  return (
    <div
      className="braintree w-full"
      style={{ display: `${show ? "block" : "none"}` }}
    >
      <div id={"braintree-drop-in-div"} />
      {braintreeInstance && (
        <div className="flex justify-center  w-full">
          <button
            disabled={!braintreeInstance}
            onClick={requestPaymentMethod}
            color="danger"
            className="btn-grad  "
            
          >
            {BbuttonName}
          </button>
        </div>
      )}
    </div>
  );
};

export default Braintree;
