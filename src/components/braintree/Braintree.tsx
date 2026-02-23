import React, { useEffect, useState } from "react";
import { Button, notification } from "antd";
import { useLocation } from "react-router-dom";
import dropin, { Dropin, PaymentMethodPayload } from "braintree-web-drop-in";
import "./Braintree.css";
import { useAppDispatch, useAppSelector } from "../../store";
import { getPaymentToken } from "../../store/features/paymentSlice";
// https://developer.paypal.com/braintree/docs/guides/credit-cards/testing-go-live/node#test-value-6243030000000001

type BraintreeProps = {
  clientToken: string;
  show: boolean;
  checkout: (nonce: string) => void;
  addPaymentMethod: (payload: any) => void;
  remainingTotal: number;
  onClose?: () => void;
};

const Braintree = ({
  clientToken,
  show,
  checkout,
  addPaymentMethod,
  remainingTotal,
  onClose,
}: BraintreeProps) => {
  const [braintreeInstance, setBraintreeInstance] = useState<
    Dropin | undefined
  >();
  const [dropped, setDropped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const SelectedCard = useAppSelector((state) => state.Payment.selectedCard);
  const cardRemoved = useAppSelector((state) => state.Payment.cardRemoved);
  const dispatch = useAppDispatch();
  console.log("SelectedCard", SelectedCard);
  const config = {
    authorization: clientToken,
    container: "#braintree-drop-in-div",
    paypal: {
      flow: "vault" as "vault",
    },
    vault: true,
  };

  const callback = (error: object | null, instance: Dropin | undefined) => {
    if (error) console.error(error);
    else {
      console.log("Braintree instance created successfully");
      setBraintreeInstance(instance);
    }
  };

  useEffect(() => {
    if (show) {
      console.log("clientToken...", clientToken);

      /**
       * InitializeBraintree Method Callback
       * @param error
       * @param instance
       */
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

  useEffect(() => {
    if (cardRemoved) {
      braintreeInstance?.teardown();
      const initializeBraintree = () => dropin.create(config, callback);
      initializeBraintree();
    }
  }, [cardRemoved, braintreeInstance, clientToken]);

  useEffect(() => {
    if (braintreeInstance) {
      braintreeInstance.on("paymentMethodRequestable", (event) => {
        console.log("eveve", event);
        if (event.paymentMethodIsSelected && event.type === "PayPalAccount") {
          requestPaymentMethod();
        }
      });

      braintreeInstance.on("paymentOptionSelected", (event) => {
      
      });

      braintreeInstance.on("changeActiveView", (event) => {
        if(event.newViewId === "card") {
          setDropped(!dropped)
        }else{
          setDropped(false)
        }
      });
    }
  }, [braintreeInstance]);

  const companyInfo = useAppSelector((state) => state.company?.company_info);

  const requestPaymentMethod = () => {
    console.log("Requesting payment method...");
    setIsSubmitting(true);
    /**
     * RequestPaymentMethod Callback
     * @param error
     * @param payload
     */
    const callback = (error: object | null, payload: PaymentMethodPayload) => {
      setIsSubmitting(false);

      if (error) {
        console.error("Payment method error:", error);
        notification.error({
          message: "Payment Method Error",
          description:
            "There was an error adding your payment method. Please try again.",
        });
      } else {
        console.log("Payment method success, payload:", payload);
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

        // Close modal and show success notification
        if (onClose) {
          onClose();
        }

        notification.success({
          message: "Payment Method Added",
          description: "Your payment method has been successfully added.",
          duration: 4,
        });
        dispatch(
          getPaymentToken({
            paymentProfileId: customerId,
          })
        );

        // Reset the form state
        setDropped(false);
      }
    };

    if (braintreeInstance) {
      braintreeInstance.requestPaymentMethod(callback);
    } else {
      console.error("No Braintree instance available");
      setIsSubmitting(false);
    }
  };

  const BbuttonName =
    location.pathname === "/checkout" ? "Add Card" : "Add Card";

  return (
    <div
      className="braintree w-full"
      style={{ display: `${show ? "block" : "none"}` }}
    >
      <div id={"braintree-drop-in-div"}  />
      {braintreeInstance && (
        <div
          className={`flex justify-center w-full ${
            dropped ? "block" : "hidden"
          }`}
        >
          <button
            disabled={!braintreeInstance || isSubmitting}
            onClick={requestPaymentMethod}
            color="danger"
            className={`btn-grad ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Processing..." : BbuttonName}
          </button>
        </div>
      )}
    </div>
  );
};

export default Braintree;
