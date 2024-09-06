import React, { useEffect, useState } from "react";
import { Button, PaginationProps, Spin, notification } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { updateCompanyInfo, updateCompany, ecommerceConnector, getImportOrders, saveOrder } from "../store/features/orderSlice";

type NotificationType = 'success' | 'info' | 'warning' | 'error';
interface NotificationAlertProps {
  type: NotificationType,
  message : string,
  description : string
}


const BottomIcon: React.FC = (): JSX.Element => {
  const orders = useAppSelector((state) => state.order.orders);
  const product_details = useAppSelector((state) => state.order.product_details);
  const ecommerceGetImportOrders = useAppSelector((state) => state.order.ecommerceGetImportOrders);

  console.log('product_details ....',product_details)

  const [backVisiable, setBackVisiable] = useState<Boolean>(true);
  const [nextVisiable, setNextVisiable] = useState<Boolean>(false);
  const [totalVisiable, setTotalVisiable] = useState<Boolean>(false);
  const [nextSpinning, setNextSpinning] = useState<Boolean>(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [api, contextHolder] = notification.useNotification();

  const openNotificationWithIcon = ({ type, message, description }: NotificationAlertProps) => {
    api[type]({
      message,
      description
    });
  };
  
  const pathNameAvoidBackButton = ["/mycompany","/virtualinventory","/importfilter"];
  const pathNameAvoidUpdateProfile = ["/importfilter"];

  const myCompanyInfoFilled = useAppSelector(
    (state) => state.order.myCompanyInfoFilled
  );

  const myImport = useAppSelector(
    (state) => state.order.myImport
  );

  const saveOrderInfo = useAppSelector(
    (state) => state.order.saveOrderInfo
  );

  const myBillingInfoFilled = useAppSelector(
    (state) => state.order.myBillingInfoFilled
  );
  
  const companyInfo = useAppSelector(
    (state) => state.order.company_info
  );
  
  const [stateData, setStateData] = useState<Boolean>(false);
  const dispatch = useAppDispatch();
  let isLoadingImgDelete = false;
  const location = useLocation();
  console.log(location.pathname);
  
  if ( pathNameAvoidBackButton.includes(location.pathname)  ) {
    backVisiable && setBackVisiable(false);
  } else {
    !backVisiable && setBackVisiable(true);
  }

  if (location.pathname === "/importlist") {
    !totalVisiable  && setTotalVisiable(true);
  }else {
    totalVisiable  && setTotalVisiable(false);
  }

  const navigate = useNavigate();
  const onChange: PaginationProps["onChange"] | any = (
    filterPageNumber: number
  ) => {
    console.log("Page: ", filterPageNumber);
  };

  const onNextHandler = async() => {
    if (location.pathname === "/mycompany") {
      if ( 
          myCompanyInfoFilled?.business_info &&
          !isNaN(myCompanyInfoFilled?.business_info?.zip_postal_code) &&
          !isNaN(myCompanyInfoFilled?.business_info?.phone)
        
        ) {
          setNextSpinning(true)
          dispatch(updateCompanyInfo(myCompanyInfoFilled));
         
        
      } else {
        alert("Billing info missing");
      }
    }

    if (location.pathname === "/importfilter") {
      if (
            (myImport?.start_date) ||
            (myImport?.end_date) ||
            (myImport?.status)
        ) {
            setNextSpinning(true)
            // dispatch(updateCompanyInfo(myImport));
            dispatch(
              getImportOrders(
                { ...{
                    account_key: "81de5dba-0300-4988-a1cb-df97dfa4e372"
                  },...myImport
                }
              )
            );
          
        } else {
          alert("Import info missing");
        }
    }

    if (location.pathname === "/billingaddress") {
      if ( 
        myBillingInfoFilled.billing_info &&
          !isNaN(myBillingInfoFilled.billing_info.zip_postal_code) &&
          !isNaN(myBillingInfoFilled.billing_info.phone)
        
        ) {
          setNextSpinning(true)
          dispatch(updateCompanyInfo(myBillingInfoFilled));
         
        
      } else {
        alert("Billing info missing");
      }
    }
    // alert("next");
    // navigate('/BillingAddress')
  };
  
  const onDeleteHandler = () => {};

  const onBackHandler = () => {
    if (location.pathname === "/billingaddress") 
      navigate('/mycompany')
    if (location.pathname === "/paymentaddress")   
      navigate('/billingaddress')
  };

  const onDownloadHandler = () => {};
  useEffect(() => {
    if (
        myCompanyInfoFilled?.business_info &&
        !isNaN(myCompanyInfoFilled?.business_info?.zip_postal_code) &&
        !isNaN(myCompanyInfoFilled?.business_info?.phone)
      ) {
        !nextVisiable && setNextVisiable(true);
    } else{
      nextVisiable && setNextVisiable(false);
    }
    console.log('nextVisiable',nextVisiable)
  }, [myCompanyInfoFilled]);


  useEffect(() => {
    if (
      myBillingInfoFilled.billing_info &&
        !isNaN(myBillingInfoFilled.billing_info.zip_postal_code) &&
        !isNaN(myBillingInfoFilled.billing_info.phone)
      ) {
        !nextVisiable && setNextVisiable(true);
    } else {
      nextVisiable && setNextVisiable(false);
    }
    console.log('nextVisiable',nextVisiable)
  }, [myBillingInfoFilled]);

  useEffect(() => {
    if (location.pathname === "/importfilter") {
      if (
            (myImport?.start_date) ||
            (myImport?.end_date) ||
            (myImport?.status)
        ) {
          !nextVisiable && setNextVisiable(true);
      } else{
        nextVisiable && setNextVisiable(false);
      }
      console.log('nextVisiable',nextVisiable)
    }
  }, [myImport]);

  useEffect(() => {
    if (location.pathname === "/importfilter") {
      if (
        (myImport?.start_date) ||
        (myImport?.end_date) ||
        (myImport?.status)
      ) {
         console.log('ecommerceGetImportOrders',ecommerceGetImportOrders);
          if (
            (ecommerceGetImportOrders?.accountId)
            ) {
              if(!(ecommerceGetImportOrders?.orders?.length)){
                openNotificationWithIcon( {type:'error', message:'Error',description:'We couldn’t find any records matching your search criteria. Please check the information you’ve entered and try again.'})   
                setNextSpinning(false)
                !nextVisiable && setNextVisiable(true);
              } else {
                dispatch(saveOrder(ecommerceGetImportOrders));
              }
          }
          else if (
            (ecommerceGetImportOrders?.data?.status===400) ||
            (ecommerceGetImportOrders?.data?.status>=500)
            ) {
              openNotificationWithIcon( 
                {
                  type:'error', 
                  message:'Error',
                  description:ecommerceGetImportOrders?.message?ecommerceGetImportOrders?.message:"Something went wrong"
                })
              setNextSpinning(false)
              !nextVisiable && setNextVisiable(true);
          }
          else{
            nextVisiable && setNextVisiable(false);
          }
      }
    }

  }, [ecommerceGetImportOrders]);

  useEffect(() => {
    if (location.pathname === "/importfilter") {
      if (
        (myImport?.start_date) ||
        (myImport?.end_date) ||
        (myImport?.status)
      ) {
          if (
            (saveOrderInfo?.statusCode===200)
            ) {
              openNotificationWithIcon( {type:'success', message:'Success',description:'Import and Export have been done successfully'})
              
              navigate('/importlist')
          } 
          else if (
            (saveOrderInfo?.statusCode===400)
            ) {
              openNotificationWithIcon( {type:'error', message:'Error',description:saveOrderInfo.message})
              setNextSpinning(false)
              !nextVisiable && setNextVisiable(true);
          }
          else{
            nextVisiable && setNextVisiable(false);
          }
      }
    }

  }, [saveOrderInfo]);

  useEffect(() => {
    if(companyInfo?.data?.account_id && nextVisiable){
      if (location.pathname === "/mycompany") 
        navigate('/billingaddress')
      if (location.pathname === "/billingaddress")   
        navigate('/paymentaddress')
      // if (location.pathname === "/paymentaddress")  
      //   navigate('/')
      setNextSpinning(false)
      setNextVisiable(false);
      openNotificationWithIcon( {type:'success', message:'Success',description:'Information has been saved'})
    }
    else if(companyInfo?.statusCode===400){
      setNextSpinning(false)
      setNextVisiable(false);
      openNotificationWithIcon( {type:'error', message:'Error',description:'Something went wrong'})
    }
  }, [companyInfo]);

  useEffect(() => {
    if ( !pathNameAvoidBackButton.includes(location.pathname)  ) {
      dispatch(updateCompanyInfo({}));
    }
  }, []);

  return isLoadingImgDelete ? (
    <div className="pt-5 pb-2">
      <Spin tip="Deleting files...">
        <></>
      </Spin>
    </div>
  ) : (
    <div className="flex">
      <div>
        {contextHolder}
      </div>
      <div className="flex fixed bottom-0 left-0  w-full h-16 bg-white  border-b mt-2 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <div className="grid h-full max-w-lg grid-cols-2 font-medium basis-1/2">
          {false && (
            <>
              {1 && (
                <button
                  onClick={onDownloadHandler}
                  type="button"
                  className="max-md:ml-4 inline-flex flex-col items-center ml-20 justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                >
                  <svg
                    className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 19"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 15h.01M4 12H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3M9.5 1v10.93m4-3.93-4 4-4-4"
                    />
                  </svg>
                  <span className="max-md:whitespace-normal text-sm whitespace-nowrap text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                    Download Selected
                  </span>
                </button>
              )}
              <button
                onClick={onDeleteHandler}
                data-tooltip-target="tooltip-document"
                type="button"
                className="max-md:pl-2 inline-flex ml-20 flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
              >
                <svg
                  className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 18 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                  />
                </svg>
                {/* <span className="sr-only">New document</span> */}
                <span className="max-md:whitespace-normal text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                  Delete Selected
                </span>
              </button>
            </>
          )}

          {backVisiable && (
            <Button
              key="submit"
              className="  w-44 mx-8 mt-2  text-gray-500"
              size={"large"}
              type="default"
              onClick={onBackHandler}
            >
              Back
            </Button>
          )}
        </div>
        <div className="grid h-full max-w-lg grid-cols-1 font-medium basis-1/2">
          {totalVisiable && (
            <div className="flex flex-col font-bold text-gray-400 pt-2">
              <span>Order Count : {orders?.data?.length}</span>
              <span>Grant Total : {product_details?.totalPrice && '$'+product_details?.totalPrice}</span>
            </div>
          )}
        </div>
        <div className="grid h-full max-w-lg grid-cols-2/3 font-medium basis-1/2 relative ">
          {nextVisiable && (
            <Spin tip="Updating..." spinning={nextSpinning}>
                <Button
                  onClick={onNextHandler}
                  className="my-2 w-44 absolute right-2"
                  type="primary"
                  size="large"
                >
                    Next
                </Button>
            </Spin>
          )}
        </div>
      </div>
    </div>
  );
};

export default BottomIcon;
