import React, { useEffect, useRef, useState } from "react";
import { Button, Tag } from "antd";
import { ReactSpreadsheetImport } from "react-spreadsheet-import";

import bigcommerce from "../assets/images/store-bigcommerce.svg";
import etsy from "../assets/images/store-etsy.svg";
import excel from "../assets/images/store-excel.svg";
import shopify from "../assets/images/store-shopify.svg";
import square from "../assets/images/store-square.svg";
import squarespace from "../assets/images/store-squarespace.svg";
import wix from "../assets/images/store-wix.svg";
import woocommerce from "../assets/images/store-woocommerce.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { ecommerceConnector } from "../store/features/ecommerceSlice";
import { updateCompanyInfo} from "../store/features/companySlice";
import { useAppDispatch, useAppSelector } from "../store";
import { useNotificationContext } from "../context/NotificationContext";
import { updateApp } from "../store/features/orderSlice";
import { resetStatus } from "../store/features/ecommerceSlice";
// import { connectAdvanced } from "react-redux";
import { find } from "lodash";

const images = [
  { name: "Squarespace", img: squarespace },
  { name: "Shopify", img: shopify },
  { name: "Wix", img: wix },
  { name: "BigCommerce", img: bigcommerce },
  { name: "Square", img: square },
  { name: "WooCommerce", img: woocommerce },
  { name: "Etsy", img: etsy },
  { name: "Excel", img: excel }
];

export enum StepType {
  upload = "upload",
  selectSheet = "selectSheet",
  selectHeader = "selectHeader",
  matchColumns = "matchColumns",
  validateData = "validateData"
}

const Landing: React.FC = (): JSX.Element => {

  const ecommerceGetImportOrders = useAppSelector((state) => state.Ecommerce.ecommerceGetImportOrders);
  const companyInfo = useAppSelector(
    (state) => state.company?.company_info?.data 
  );
 const order = useAppSelector((state)=>state.order.orders)
  console.log('companyInfo',companyInfo)
  console.log('ecommerceGetImportOrders',ecommerceGetImportOrders)
  const ecommerceDisconnectInfo = useAppSelector((state) => state.Ecommerce.status);

  const ecommerceConnectorInfo = useAppSelector(
    (state) => state.Ecommerce.ecommerceConnectorInfo
  );
  console.log("ecommerceConnectorInfo", ecommerceConnectorInfo);

  const [openExcel, setOpenExcel] = useState<Boolean>(false);
  const [openBtnConnected, setOpenBtnConnected] = useState(false);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  console.log("customerInfo", customerInfo);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeValue = queryParams.get("type");
  const notificationApi = useNotificationContext();
  const appLunched = useAppSelector((state)=>state.order.appLunched)

  console.log("islu", appLunched)

  console.log(location.pathname,typeValue);
  // const [isOpen, setOpenExcel] = useState<Boolean>(true);
  // Determines if modal is visible.
  const isOpen: boolean = true;
  console.log('order',order)

  // Called when flow is closed without reaching submit.
  function onClose() {
    setOpenExcel(false);
  }
  // Called after user completes the flow. Provides data array, where data keys matches your field keys.
  function onSubmit(data: any) {
    console.log("import", data);
    //  data.validData
    alert(data);
  }

  useEffect(() => {
    if (ecommerceDisconnectInfo === "succeeded") {
      notificationApi?.success({
        message: "WooCommerce disconnected successfully",
        description: "WooCommerce has been successfully disconnected.",
      });
      dispatch(resetStatus());
      setOpenBtnConnected(false);
    }else if (ecommerceDisconnectInfo === "failed") {
      notificationApi?.error({
        message: "WooCommerce disconnected failed",
        description: "WooCommerce has been failed to disconnect.",
      });
      dispatch(resetStatus());
    }
  }, [ecommerceDisconnectInfo, notificationApi, setOpenBtnConnected]);

  const fields = [
    {
      // Visible in table header and when matching columns.
      label: "Quantity",
      // This is the key used for this field when we call onSubmit.
      key: "product_qty",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input"
      },
      // Used in the first step to provide an example of what data is expected in this field. Optional.
      example: "Stephanie",
      // Can have multiple validations that are visible in Validation Step table.
      validations: [
        {
          // Can be "required" / "unique" / "regex"
          rule: "required",
          errorMessage: "Name is required",
          // There can be "info" / "warning" / "error" levels. Optional. Default "error".
          level: "error"
        }
      ]
    },
    {
      // Visible in table header and when matching columns.
      label: "SKU",
      // This is the key used for this field when we call onSubmit.
      key: "product_sku",
      // Allows for better automatic column matching. Optional.
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input"
      },
      // Used in the first step to provide an example of what data is expected in this field. Optional.
      example: "We are working on",
      // Can have multiple validations that are visible in Validation Step table.
      validations: [
        {
          // Can be "required" / "unique" / "regex"
          rule: "required",
          errorMessage: "Pitch is required",
          // There can be "info" / "warning" / "error" levels. Optional. Default "error".
          level: "error"
        }
      ]
    },
    {
      // Visible in table header and when matching columns.
      label: "Width",
      // This is the key used for this field when we call onSubmit.
      key: "product_image.pixel_width",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["states"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input"
      },
      // Used in the first step to provide an example of what data is expected in this field. Optional.
      example: "In Progress",
      // Can have multiple validations that are visible in Validation Step table.
      validations: [
        //  {
        //    // Can be "required" / "unique" / "regex"
        //   //  rule: "required",
        //   //  errorMessage: "Name is required",
        //    // There can be "info" / "warning" / "error" levels. Optional. Default "error".
        //   //  level: "error"
        //  }
      ]
    },
    {
      // Visible in table header and when matching columns.
      label: "Height",
      // This is the key used for this field when we call onSubmit.
      key: "product_image['pixel_height']",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input"
      },
      // Used in the first step to provide an example of what data is expected in this field. Optional.
      example: "Identified",
      // Can have multiple validations that are visible in Validation Step table.
      validations: [
        //  {
        //    // Can be "required" / "unique" / "regex"
        //    rule: "required",
        //    errorMessage: "Name is required",
        //    // There can be "info" / "warning" / "error" levels. Optional. Default "error".
        //    level: "error"
        //  }
      ]
    },
    {
      // Visible in table header and when matching columns.
      label: "Title",
      // This is the key used for this field when we call onSubmit.
      key: "title",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input"
      },
      // Used in the first step to provide an example of what data is expected in this field. Optional.
      example: "Stephanie",
      // Can have multiple validations that are visible in Validation Step table.
      validations: [
        {
          // Can be "required" / "unique" / "regex"
          rule: "required",
          errorMessage: "Name is required",
          // There can be "info" / "warning" / "error" levels. Optional. Default "error".
          level: "error"
        }
      ]
    }
  ] as const;

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const importData = (imgname: string) => {
    if (imgname === "Excel") {
      setOpenExcel(true);
    }
    console.log("imgname", imgname);
    if (imgname === "WooCommerce") {
      // Check if user is logged in first
      if (!customerInfo?.data?.account_key) {
        notificationApi.warning({
          message: "Login Required",
          description: "Please login to your account to continue",
        });
        return;
      }

      // If already connected, navigate to import filter
      // Otherwise connect to ecommerce
      if (openBtnConnected) {
        navigate("/importfilter?type=WooCommerce");
      } else {
        // Log the parameters to verify they're correct
        console.log("Connecting to WooCommerce with key:", customerInfo?.data?.account_key);
        
        dispatch(
          ecommerceConnector({
            account_key: customerInfo?.data?.account_key
          })
        );
      }
    }
  };
  useEffect(() => {
   
  dispatch(updateApp(false))
  }, []);


  useEffect(() => {
    if (ecommerceConnectorInfo.approval_url) {
      dispatch(updateCompanyInfo({
        "connections": [
          {
            "name": "WooCommerce",
            "id": ecommerceConnectorInfo.approval_url,
            "data": ""
          }
        ]
      }));
    }
  }, [ecommerceConnectorInfo]);

  useEffect(() => {
    dispatch(updateCompanyInfo({}));
  }, []);

  useEffect(() => {
    if(companyInfo?.connections?.length){
      let obj = find(companyInfo.connections, {"name":"WooCommerce"});
      if(obj?.name){
        setOpenBtnConnected(true);
      }
    }
  }, [companyInfo]);

  const displayTurtles = images.map((image) => (
    <div className="flex w-1/3 max-sm:w-1/2 max-[400px]:w-full flex-wrap">
      <div
        className="w-full mt-8 md:mt-0 md:p-2 flex flex-col items-center "
        onClick={() => importData(image.name)}
      >
        {
        (image.name === "WooCommerce" && openBtnConnected) &&
        <Tag className="absolute ml-12 -mt-3" color="#52c41a">
          Connected
        </Tag>
        }
        <img
          className={`block h-[100px] w-[100px] border-2 cursor-pointer rounded-lg object-cover object-center ${image.name === "WooCommerce" ? "grayscale-100": "grayscale"}`}
          src={image.img}
        />
        <p className="text-center pt-2 font-bold text-gray-400">{image.name}</p>
      </div>
    </div>
  ));

  useEffect(() => {}, []);
  const handleAppLaunch = ()=>{
    dispatch(updateApp(true))
    navigate("/mycompany");
  }

  return (
    <div className="flex justify-end max-md:flex-col items-center w-full h-full p-8">
      <div className="w-1/2 max-md:w-full flex flex-col justify-center max-md:border-b-2 md:border-r-2 items-center h-[600px] max-md:h-[300px]">
        <Button
          onClick={() => {
            handleAppLaunch()
          }}
          type="primary"
          size="large"
        >
          Launch wizard setup
        </Button>
        <div className="text-center text-gray-400 pt-4">
          <p>Edit basic account and payment information </p>
          <p>needed in order to import orders from your stores. </p>
        </div>
      </div>
      <div className="w-1/2 max-md:w-full">
        <div className="container mx-auto px-5 py-2 xl:px-32 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            {displayTurtles}
          </div>
        </div>
      </div>
      {openExcel && (
        <ReactSpreadsheetImport
          rowHook={(data, addError) => {
            // Validation
            // if (data['product_image.pixel_width'] === "John") {
            //   addError("name", { message: "No Johns allowed", level: "info" })
            // }
            // let product_image:object = {}
            // product_image.assign(product_image, { pixel_width: "xxx", age: "0" });
            // let product_image['pixel_width'] = data['product_image.pixel_width'];
            // Transformation
            return { ...data, name: "Not John" };
            // Sorry John
          }}
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={onSubmit}
          fields={fields}
        />
      )}
    </div>
  );
};

export default Landing;
