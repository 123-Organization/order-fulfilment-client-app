import React, { useEffect, useRef, useState } from "react";
import { Button, Tag } from "antd";
import { ReactSpreadsheetImport } from "react-spreadsheet-import";
import { useCookies } from "react-cookie";
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
import { 
  updateCompanyInfo,
  updateWordpressConnectionId,
  setConnectionVerificationStatus,
  resetVerificationStatus,
  updateShopifyCredentials
} from "../store/features/companySlice";
import { useAppDispatch, useAppSelector } from "../store";
import { useNotificationContext } from "../context/NotificationContext";
import { updateApp, UploadOrdersExcel } from "../store/features/orderSlice";
import { resetStatus } from "../store/features/ecommerceSlice";
import { updateOpenSheet } from "../store/features/orderSlice";
// import { connectAdvanced } from "react-redux";
import { find } from "lodash";
import SpreadSheet from "../components/SpreadSheet";
// Set to true when Shopify integration is fully ready
const SHOPIFY_ENABLED = true;

const images = [
  { name: "Squarespace", img: squarespace },
  { name: "Shopify", img: shopify },
  { name: "Wix", img: wix },
  { name: "BigCommerce", img: bigcommerce },
  { name: "Square", img: square },
  { name: "WooCommerce", img: woocommerce },
  { name: "Etsy", img: etsy },
  { name: "Excel", img: excel },
];

export enum StepType {
  upload = "upload",
  selectSheet = "selectSheet",
  selectHeader = "selectHeader",
  matchColumns = "matchColumns",
  validateData = "validateData",
}

const Landing: React.FC = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const ecommerceGetImportOrders = useAppSelector(
    (state) => state.Ecommerce.ecommerceGetImportOrders
  );
  const companyInfo = useAppSelector(
    (state) => state.company?.company_info?.data
  );
  const connectionVerificationStatus = useAppSelector(
    (state) => state.company?.connectionVerificationStatus
  );
  const [shopifyConnectionStatus, setShopifyConnectionStatus] = useState<'idle' | 'verifying' | 'connected' | 'disconnected'>('idle');
  const [lastShopifyConnectionData, setLastShopifyConnectionData] = useState<string | null>(null);
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const order = useAppSelector((state) => state.order.orders);
  const opensheet = useAppSelector((state) => state.order.openSheet);
  console.log("companyInfo", companyInfo);
  console.log("ecommerceGetImportOrders", ecommerceGetImportOrders);
  const ecommerceDisconnectInfo = useAppSelector(
    (state) => state.Ecommerce.status
  );

  const ecommerceConnectorInfo = useAppSelector(
    (state) => state.Ecommerce.ecommerceConnectorInfo
  );
  console.log("ecommerceConnectorInfo", ecommerceConnectorInfo);

  const [openExcel, setOpenExcel] = useState<Boolean>(false);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  console.log("customerInfo", customerInfo);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeValue = queryParams.get("type");
  const notificationApi = useNotificationContext();
  const appLunched = useAppSelector((state) => state.order.appLunched);

  console.log("islu", appLunched);

  console.log(location.pathname, typeValue);
  // const [isOpen, setOpenExcel] = useState<Boolean>(true);
  // Determines if modal is visible.
  const isOpen: boolean = true;
  console.log("order", order);

  // Called when flow is closed without reaching submit.
  function onClose() {
    setOpenExcel(false);
    dispatch(updateOpenSheet(false));
  }
  // Called after user completes the flow. Provides data array, where data keys matches your field keys.
  function onSubmit(data: any) {
    console.log("import", data);
    //  data.validData
    const postData = {
      accountId: customerInfo?.data?.account_id,
      payment_token: customerInfo?.data?.payment_profile_id ,
      orders: [
        {
          order_po: data?.all[0].order_po,
          recipient: {
            first_name: data?.all[0].ship_first_name,
            last_name: data?.all[0].ship_last_name,
            company_name: data?.all[0].ship_company_name,
            address_1: data?.all[0].ship_address_1,
            address_2: data?.all[0].ship_address_2,
            address_3: "",
            city: data?.all[0].ship_city,
            state_code: data?.all[0].ship_state_code,
            province: data?.all[0].ship_province,
            zip_postal_code: data?.all[0].ship_zip,
            country_code: data?.all[0].ship_country_code,
            phone: data?.all[0].ship_phone,
            email: "dumdum@gmail.com",
            address_order_po: "",
          },
          order_items: [
            {
              product_qty: 1,
              product_sku: data?.all[0].product_sku,
              product_image_file_url:
               data?.all[0].product_image_file_url,
              product_thumb_url:
                data?.all[0].product_image_file_url,
              product_cropping: data?.all[0].product_cropping,
            },
          ],
          order_status: "Processing",
          shipping_code: data?.all[0].shipping_code,
          test_mode: true,
        },
      ],
    };
    dispatch(UploadOrdersExcel({...postData}))
  }

  useEffect(() => {
    if (ecommerceDisconnectInfo === "succeeded") {
      notificationApi?.success({
        message: "WooCommerce has been successfully disconnected",
        description: "WooCommerce has been successfully disconnected.",
      });
      dispatch(resetStatus());
      dispatch(setConnectionVerificationStatus('disconnected'));
    } else if (ecommerceDisconnectInfo === "failed") {
      notificationApi?.error({
        message: "WooCommerce  has been failed to disconnect",
        description: "WooCommerce has been failed to disconnect.",
      });
      dispatch(resetStatus());
    }
  }, [ecommerceDisconnectInfo, notificationApi, dispatch]);

  const fields = [
    {
      // Visible in table header and when matching columns.
      label: "order_po",
      // This is the key used for this field when we call onSubmit.
      key: "order_po",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_first_name",
      // This is the key used for this field when we call onSubmit.
      key: "ship_first_name",
      // Allows for better automatic column matching. Optional.
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_last_name",
      // This is the key used for this field when we call onSubmit.
      key: "ship_last_name",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["states"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_company_name",
      // This is the key used for this field when we call onSubmit.
      key: "ship_company_name",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_address_1",
      // This is the key used for this field when we call onSubmit.
      key: "ship_address_1",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_address_2",
      // This is the key used for this field when we call onSubmit.
      key: "ship_address_2",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
      },
      // Used in the first step to provide an example of what data is expected in this field. Optional.
      example: "Stephanie",
      // Can have multiple validations that are visible in Validation Step table.
      validations: [] // Empty array means no validations required
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_city",
      // This is the key used for this field when we call onSubmit.
      key: "ship_city",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_state_code",
      // This is the key used for this field when we call onSubmit.
      key: "ship_state_code",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_province",
      // This is the key used for this field when we call onSubmit.
      key: "ship_province",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
      },
      // Used in the first step to provide an example of what data is expected in this field. Optional.
      example: "Stephanie",
      // Can have multiple validations that are visible in Validation Step table.
      validations: [] // Empty array means no validations required
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_zip",
      // This is the key used for this field when we call onSubmit.
      key: "ship_zip",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_phone",
      // This is the key used for this field when we call onSubmit.
      key: "ship_phone",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "ship_country_code",
      // This is the key used for this field when we call onSubmit.
      key: "ship_country_code",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "product_qty",
      // This is the key used for this field when we call onSubmit.
      key: "product_qty",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "product_sku",
      // This is the key used for this field when we call onSubmit.
      key: "product_sku",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "shipping_code",
      // This is the key used for this field when we call onSubmit.
      key: "shipping_code",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "product_thumb_url",
      // This is the key used for this field when we call onSubmit.
      key: "product_thumb_url",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "product_image_file_url",
      // This is the key used for this field when we call onSubmit.
      key: "product_image_file_url",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
    {
      // Visible in table header and when matching columns.
      label: "product_cropping",
      // This is the key used for this field when we call onSubmit.
      key: "product_cropping",
      // Allows for better automatic column matching. Optional.
      alternateMatches: ["first name", "first"],
      // Used when editing and validating information.
      fieldType: {
        // There are 3 types - "input" / "checkbox" / "select".
        type: "input",
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
          level: "error",
        },
      ],
    },
  ] as const;
  const importData = (imgname: string) => {
    // Check for platforms that are not yet available (including Shopify when disabled)
    const availablePlatforms = ["WooCommerce", "Excel"];
    if (SHOPIFY_ENABLED) {
      availablePlatforms.push("Shopify");
    }
    
    if (imgname && !availablePlatforms.includes(imgname)) {
      notificationApi.warning({
        message: "Coming Soon",
        description: "This platform is under development ",
      });
      return;
    }
    if (cookies.AccountGUID && imgname === "Excel") {
      setOpenExcel(true);
    } else if (!cookies.AccountGUID && imgname === "Excel") {
      window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`;
      return;
    }
    console.log("imgname", imgname);
    if (imgname === "WooCommerce") {
      // Check if user is logged in first
      if (!customerInfo?.data?.account_key && !cookies.AccountGUID) {
        window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`;
        return;
      }

      // If already connected, navigate to import filter
      // Otherwise connect to ecommerce
      if (connectionVerificationStatus === 'connected') {
        navigate("/importfilter?type=WooCommerce");
      } else if(customerInfo?.data?.user_profile_complete === true){
        // Log the parameters to verify they're correct
        console.log(
          "Connecting to WooCommerce with key:",
          customerInfo?.data?.account_key
        );

        dispatch(
          ecommerceConnector({
            account_key: customerInfo?.data?.account_key,
          })
        );
      } else {
        notificationApi.warning({
          message: "Please complete your profile",
          description: "Please complete your profile to connect to WooCommerce",
        });
      }
    }
    
    // Shopify integration
    if (imgname === "Shopify") {
      // Check if user is logged in first
      if (!customerInfo?.data?.account_key && !cookies.AccountGUID) {
        window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`;
        return;
      }

      // If already connected, navigate to import filter
      if (shopifyConnectionStatus === 'connected') {
        navigate("/importfilter?type=Shopify");
      } else if (customerInfo?.data?.user_profile_complete === true) {
        // TODO: In production, redirect to Shopify OAuth flow
        // For now, show a notification that OAuth setup is needed
        notificationApi.info({
          message: 'Connect to Shopify',
          description: 'Please set up your Shopify connection through the admin panel.',
        });
        
        // Temporarily for testing - use hardcoded credentials
        // Remove this block once OAuth is implemented
        dispatch(updateShopifyCredentials({
          shop: "finerworks-dev-store.myshopify.com",
          access_token: "shpua_9c16eb994c4401fa6c9d19a95a930795"
        }));
        navigate("/importfilter?type=Shopify");
      } else {
        notificationApi.warning({
          message: "Please complete your profile",
          description: "Please complete your profile to connect to Shopify",
        });
      }
    }
  };
  useEffect(() => {
    dispatch(updateApp(false));
  }, [dispatch]);

  // Check if user is returning from Shopify auth
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const type = queryParams.get('type');
    const connected = queryParams.get('connected');
    const error = queryParams.get('error');

    if (type === 'shopify') {
      if (connected === 'true') {
        setShopifyConnectionStatus('connected');
        notificationApi.success({
          message: 'Shopify Connected',
          description: 'Your Shopify store has been successfully connected!',
        });
      } else if (error) {
        setShopifyConnectionStatus('disconnected');
        notificationApi.error({
          message: 'Shopify Connection Failed',
          description: 'Failed to connect to your Shopify store. Please try again.',
        });
      }
    }
  }, [location.search, notificationApi]);

  // Initialize verification status if idle
  useEffect(() => {
    if (connectionVerificationStatus === 'idle') {
      dispatch(setConnectionVerificationStatus('verifying'));
    }
  }, [connectionVerificationStatus, dispatch]);

  useEffect(() => {
    if (ecommerceConnectorInfo.approval_url) {
      dispatch(
        updateCompanyInfo({
          connections: [
            {
              name: "WooCommerce",
              id: ecommerceConnectorInfo.approval_url,
              data: "",
            },
          ],
        })
      );
    }
  }, [ecommerceConnectorInfo, dispatch]);

  useEffect(() => {
    dispatch(updateCompanyInfo({}));
  }, [dispatch]);

  // Track the current connection data to detect changes
  const [lastConnectionData, setLastConnectionData] = useState<string | null>(null);

  useEffect(() => {
    if (companyInfo?.connections?.length) {
      console.log("All connections:", companyInfo.connections);
      
      // Handle WooCommerce connection
      const wooConnection = companyInfo.connections.find((conn: any) => conn.name === "WooCommerce");
      if (wooConnection) {
        let connectionId = wooConnection?.id;
        connectionId = connectionId.split("?")[0];
        console.log("WooCommerce connectionId", connectionId);
        dispatch(updateWordpressConnectionId(connectionId));
        
        if (wooConnection?.data) {
          try {
            // Parse the JSON string from the data field
            const parsedData = JSON.parse(wooConnection.data);
            console.log("WooCommerce parsedData", parsedData);
            
            // Check if the connection data has actually changed
            const currentDataString = JSON.stringify(parsedData);
            if (currentDataString !== lastConnectionData) {
              console.log("WooCommerce connection data changed, updating status...");
              setLastConnectionData(currentDataString);
              
              // Set verifying status first
              dispatch(setConnectionVerificationStatus('verifying'));
              
              // Add a delay to show verification state
              setTimeout(() => {
                // Check the isConnected property and set the button state accordingly
                const isConnected = parsedData.isConnected === true || parsedData.isConnected === "true";
                console.log("WooCommerce Final isConnected decision:", isConnected);
                
                // Update Redux state
                dispatch(setConnectionVerificationStatus(isConnected ? 'connected' : 'disconnected'));
              }, 1000); // 1 second delay to show "Verifying..." state
            } else {
              console.log("WooCommerce connection data unchanged, skipping verification");
            }
            
          } catch (error) {
            console.error("Error parsing WooCommerce connection data:", error);
            dispatch(setConnectionVerificationStatus('disconnected'));
          }
        } else {
          // No data available
          console.log("No WooCommerce connection data available");
          dispatch(setConnectionVerificationStatus('disconnected'));
        }
      } else {
        // No WooCommerce connection available
        console.log("No WooCommerce connection available");
        dispatch(setConnectionVerificationStatus('disconnected'));
      }

      // Handle Shopify connection
      const shopifyConnection = companyInfo.connections.find((conn: any) => conn.name === "Shopify");
      console.log("=== SHOPIFY CONNECTION CHECK ===");
      console.log("Shopify connection found?:", !!shopifyConnection);
      
      if (shopifyConnection) {
        console.log("Full Shopify connection object:", shopifyConnection);
        console.log("Shopify connection.id:", shopifyConnection.id);
        console.log("Shopify connection.data:", shopifyConnection.data);
        
        // Create a unique identifier for this connection state
        const connectionIdentifier = `${shopifyConnection.id}_${shopifyConnection.data || 'empty'}`;
        
        // Only process if this is a new/changed connection
        if (connectionIdentifier !== lastShopifyConnectionData) {
          console.log("Shopify connection changed or first load, processing...");
          setLastShopifyConnectionData(connectionIdentifier);
          
          // If connection exists with an ID (access token), it's connected
          if (shopifyConnection.id) {
            console.log("Setting Shopify to verifying...");
            setShopifyConnectionStatus('verifying');
            
            // Process the connection
            let isConnected = false;
            let shop = "";
            let access_token = shopifyConnection.id; // Use ID as access token by default
            
            // Try to parse data field if it exists
            if (shopifyConnection.data && shopifyConnection.data.trim() !== "") {
              try {
                const parsedData = JSON.parse(shopifyConnection.data);
                console.log("Shopify parsedData:", parsedData);
                
                // Check if explicitly disconnected, otherwise assume connected if data exists
                if (parsedData.isConnected === false || parsedData.isConnected === "false") {
                  isConnected = false;
                } else {
                  // If we have shop and access_token, or if isConnected is true, mark as connected
                  isConnected = true;
                }
                
                shop = parsedData.shop || "";
                access_token = parsedData.access_token || shopifyConnection.id;
              } catch (error) {
                console.error("Error parsing Shopify connection data:", error);
                // If parsing fails but connection exists, assume it's connected
                isConnected = true;
              }
            } else {
              // If no data field or empty, but connection exists, it's connected
              console.log("No Shopify data field, but connection exists with ID - marking as connected");
              isConnected = true;
            }
            
            console.log("Shopify Final isConnected decision:", isConnected);
            console.log("Shopify access_token to use:", access_token);
            console.log("Shopify shop to use:", shop);
            
            // Update state after a short delay
            setTimeout(() => {
              if (isConnected) {
                console.log("Setting Shopify status to CONNECTED");
                setShopifyConnectionStatus('connected');
                
                // Store Shopify credentials
                dispatch(updateShopifyCredentials({
                  shop: shop || "finerworks-dev-store.myshopify.com",
                  access_token: access_token
                }));
              } else {
                console.log("Setting Shopify status to DISCONNECTED (not connected)");
                setShopifyConnectionStatus('disconnected');
              }
            }, 1000);
          } else {
            console.log("Shopify connection exists but no ID - marking as disconnected");
            setShopifyConnectionStatus('disconnected');
          }
        } else {
          console.log("Shopify connection unchanged, skipping processing");
          console.log("Current status:", shopifyConnectionStatus);
        }
      } else {
        // No Shopify connection available
        console.log("No Shopify connection found in connections array");
        if (lastShopifyConnectionData !== null) {
          setLastShopifyConnectionData(null);
          setShopifyConnectionStatus('disconnected');
        }
      }
      console.log("=== END SHOPIFY CONNECTION CHECK ===");
    } else {
      // No connections available
      console.log("No connections available");
      dispatch(setConnectionVerificationStatus('disconnected'));
      setShopifyConnectionStatus('disconnected');
    }
  }, [companyInfo, lastConnectionData, lastShopifyConnectionData, dispatch, shopifyConnectionStatus]);

  const displayTurtles = images.map((image) => (
    <div className="flex w-1/3 max-sm:w-1/2 max-[400px]:w-full flex-wrap">
      <div
        className="w-full mt-8 md:mt-0 md:p-2 flex flex-col items-center relative"
        onClick={() => importData(image.name)}
      >
        {/* WooCommerce Status */}
        {image.name === "WooCommerce" && connectionVerificationStatus === 'verifying' ? (
          <Tag className="absolute top-0 right-4 z-10 bg-blue-500 text-white animate-pulse shadow-lg">
            Verifying...
          </Tag>
        ) : image.name === "WooCommerce" && connectionVerificationStatus === 'connected' ? (
          <Tag className="absolute top-0 right-4 z-10 shadow-lg" color="#52c41a">
            Connected
          </Tag>
        ) : image.name === "WooCommerce" && connectionVerificationStatus === 'disconnected' ? (
          <Tag className="absolute top-0 right-4 z-10 bg-red-500 text-white shadow-lg">
            Disconnected
          </Tag>
        ) : null}
        
        <img
          className={`block h-[100px] w-[100px] border-2 cursor-pointer rounded-lg object-cover object-center ${
            image.name === "WooCommerce" || image.name === "Excel"
              ? "grayscale-0"
              : "grayscale"
          }`}
          src={image.img}
          alt={image.name}
        />
        <p className="text-center pt-2 font-bold text-gray-400">{image.name}</p>
      </div>
    </div>
  ));

  useEffect(() => {}, []);
  const handleAppLaunch = () => {
    dispatch(updateApp(true));
    navigate("/mycompany");
  };

  return (
    <div className="flex justify-end max-md:flex-col items-center w-full h-full p-8">
      
      <div className="w-1/2 max-md:w-full flex flex-col justify-center max-md:border-b-2 md:border-r-2 items-center h-[600px] max-md:h-[300px]">
      
        <Button
          onClick={() => {
            handleAppLaunch();
          }}
          type="primary"
          size="large"
        >
         Launch Setup Wizard
        </Button>
        <div className="text-center text-gray-400 pt-4">
          <p>Edit basic account and payment information </p>
          <p>needed in order to import orders from your stores. </p>
        </div>
        
        {/* Test Button for Shopify Auth - Remove this in production */}
       
      </div>
      
      <div className="w-1/2 max-md:w-full">
        <div className="container mx-auto px-5 py-2 xl:px-32 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            {displayTurtles}
           
          </div>
        </div>
      </div>
      {(openExcel || opensheet) && (
      <SpreadSheet 
      isOpen={isOpen}
      onClose={onClose}
       />
      )}
    </div>
  );
};

export default Landing;
