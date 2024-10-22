import React, { useEffect, useState } from 'react';
import PaymentHttpClient, {
  IBraintreeToken,
  ITransactionRequest,
  ITransactionResponse,
} from '../services/payments';
import Braintree from '../components/braintree/Braintree';
type PaymentProps = { 
  remainingTotal: number;
};
export default function Payment({ remainingTotal }: PaymentProps) {
  const [clientToken, setClientToken] = useState('');
  const [showBraintreeDropIn, setShowBraintreeDropIn] = useState(false);

  useEffect(() => {
    PaymentHttpClient.generateToken()
      .then(({ token }: IBraintreeToken) => {
        console.log('token',token)
        setClientToken(token);
        setShowBraintreeDropIn(true)
      })
      .catch((error: Error) => {
        console.log(error);
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
        alert('Payment successfully completed');
        console.log(result);
      })
      .catch((error: Error) => {
        alert('Payment Failed');
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
        alert('Payment successfully completed');
        console.log(result);
      })
      .catch((error: Error) => {
        alert('Payment Failed');
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
          />
        </div>
      </div>
    </div>
  );
}