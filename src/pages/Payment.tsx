import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import PaymentHttpClient, {
  IBraintreeToken,
  ITransactionRequest,
  ITransactionResponse,
} from '../services/payments';
import Braintree from '../components/braintree/Braintree';
import { getCustomerInfo } from '../store/features/customerSlice';
import { updateCompanyInfo } from '../store/features/companySlice';
import { getPaymentMethods } from '../store/features/paymentSlice';
import { notification } from 'antd';

type PaymentProps = { 
  remainingTotal: number;
  onCloseModal?: () => void;
};

export default function Payment({ remainingTotal, onCloseModal }: PaymentProps) {
  const [clientToken, setClientToken] = useState('');
  const [showBraintreeDropIn, setShowBraintreeDropIn] = useState(false);
  const dispatch = useAppDispatch();
  const companyInfo = useAppSelector((state) => state.company.company_info);

  useEffect(() => {
    PaymentHttpClient.generateToken()
      .then(({ token }: IBraintreeToken) => {
        console.log('token',token)
        setClientToken(token);
        setShowBraintreeDropIn(true)
      })
      .catch((error: Error) => {
        console.log(error);
        notification.error({
          message: 'Error',
          description: 'Failed to initialize payment system. Please try again.',
        });
      });
  }, []);

  const initiatePayment = (paymentMethodNonce: string) => {
    // TODO : Based on inputs we have to create payload
    // Example - Amount based on cart and price per item
    const payload: ITransactionRequest = {
      amount: '10',
      paymentMethodNonce,
    };
    console.log('payload',payload)
    PaymentHttpClient.checkout(payload)
      .then((result: ITransactionResponse) => {
        notification.success({
          message: 'Success',
          description: 'Payment successfully completed',
        });
        console.log(result);
      })
      .catch((error: Error) => {
        notification.error({
          message: 'Payment Failed',
          description: 'There was an error processing your payment. Please try again.',
        });
        console.log(error);
      });
  };

  const addPaymentMethod = (paymentMethodNonce: string) => {
    // TODO : Based on inputs we have to create payload
    // Example - Amount based on cart and price per item
    const payload: ITransactionRequest = {
      amount: '10',
      paymentMethodNonce,
    };

    const nonceFromClient = paymentMethodNonce;
    console.log('nonceFromClient',nonceFromClient)
    const customerId = '86584217823'; 

    const finalPayload = {nonceFromClient,customerId};

    PaymentHttpClient.addPaymentMethod(paymentMethodNonce)
      .then((result: ITransactionResponse) => {
        console.log(result);
        dispatch(getPaymentMethods(companyInfo?.data?.payment_profile_id));
        
        // Close the modal after successful payment method addition
        if (onCloseModal) {
          onCloseModal();
        }
      })
      .catch((error: Error) => {
        notification.error({
          message: 'Failed',
          description: 'Failed to add payment method. Please try again.',
        });
        console.log(error);
      });
  };

  return (
    <div className='container-fluid w-full'>
      {/* <div className='text-center'>
        <h1>Payment</h1>
        {!showBraintreeDropIn && (
          <button
            onClick={() => {
              setShowBraintreeDropIn(true);
            }}
          >
            Go to Checkout
          </button>
        )}
      </div> */}

      <div className='row justify-content-center'>
        <div className='col-4 text-center'>
          <Braintree
            clientToken={clientToken}
            show={showBraintreeDropIn}
            checkout={initiatePayment}
            addPaymentMethod={addPaymentMethod}
            remainingTotal={remainingTotal}
            onClose={onCloseModal}
          />
        </div>
      </div>
    </div>
  );
}