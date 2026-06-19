import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Button, Tag, Modal } from "antd";
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
import { updateOpenSheet } from "../store/features/orderSlice";
// import { connectAdvanced } from "react-redux";
import SpreadSheet from "../components/SpreadSheet";
import PlatformSettingsModal from "../components/PlatformSettingsModal";
// Set to true when Shopify integration is fully ready
const SHOPIFY_ENABLED = false;

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
  const { isDark } = useTheme();
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
  const [showShopifyConnectModal, setShowShopifyConnectModal] = useState<boolean>(false);
  const [squarespaceConnectionStatus, setSquarespaceConnectionStatus] = useState<'idle' | 'verifying' | 'connected' | 'disconnected'>('idle');
  const [lastSquarespaceConnectionData, setLastSquarespaceConnectionData] = useState<string | null>(null);
  const [wixConnectionStatus, setWixConnectionStatus] = useState<'idle' | 'verifying' | 'connected' | 'disconnected'>('idle');
  const [lastWixConnectionData, setLastWixConnectionData] = useState<string | null>(null);

  // ── Order-sync toggle state ──────────────────────────────────────────────
  const [wixOrderSync, setWixOrderSync] = useState<boolean>(false);
  const [squarespaceOrderSync, setSquarespaceOrderSync] = useState<boolean>(false);
  const [shopifyOrderSync, setShopifyOrderSync] = useState<boolean>(false);
  const [wixOrderSyncLoading, setWixOrderSyncLoading] = useState<boolean>(false);
  const [squarespaceOrderSyncLoading, setSquarespaceOrderSyncLoading] = useState<boolean>(false);
  const [shopifyOrderSyncLoading, setShopifyOrderSyncLoading] = useState<boolean>(false);
  const [wixOrderSyncDisconnecting, setWixOrderSyncDisconnecting] = useState<boolean>(false);
  const [squarespaceOrderSyncDisconnecting, setSquarespaceOrderSyncDisconnecting] = useState<boolean>(false);
  const [shopifyOrderSyncDisconnecting, setShopifyOrderSyncDisconnecting] = useState<boolean>(false);
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

  // Disconnect notifications are now handled in DisconnectPlatformModal component
  // This useEffect has been removed to prevent duplicate notifications

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
    const availablePlatforms = ["WooCommerce", "Excel", "Squarespace", "Wix"];
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
      // Check if Shopify is enabled
      if (!SHOPIFY_ENABLED) {
        notificationApi.warning({
          message: "Coming Soon",
          description: "This platform is under development",
        });
        return;
      }

      // Check if user is logged in first
      if (!customerInfo?.data?.account_key && !cookies.AccountGUID) {
        window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`;
        return;
      }

      // If already connected, navigate to import filter
      if (shopifyConnectionStatus === 'connected') {
        navigate("/importfilter?type=Shopify");
      } else if (customerInfo?.data?.user_profile_complete === true) {
        setShowShopifyConnectModal(true);
      } else {
        notificationApi.warning({
          message: "Please complete your profile",
          description: "Please complete your profile to connect to Shopify",
        });
      }
    }

    // Squarespace integration
    if (imgname === "Squarespace") {
      // Check if user is logged in first
      if (!customerInfo?.data?.account_key && !cookies.AccountGUID) {
        window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`;
        return;
      }

      // If already connected, navigate to import filter
      if (squarespaceConnectionStatus === 'connected') {
        navigate("/importfilter?type=Squarespace");
      } else if (customerInfo?.data?.user_profile_complete === true) {
        const accountKey = customerInfo?.data?.account_key;
        // return_url tells the backend where to redirect the user after OAuth completes
        const returnUrl = `${window.location.origin}/`;
        window.location.href = `https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/squarespace/auth?account_key=${accountKey}&return_url=${encodeURIComponent(returnUrl)}`;
      } else {
        notificationApi.warning({
          message: "Please complete your profile",
          description: "Please complete your profile to connect to Squarespace",
        });
      }
    }

    // Wix integration
    if (imgname === "Wix") {
      // Check if user is logged in first
      if (!customerInfo?.data?.account_key && !cookies.AccountGUID) {
        window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`;
        return;
      }

      // If already connected, navigate to import filter
      if (wixConnectionStatus === 'connected') {
        navigate("/importfilter?type=Wix");
      } else if (customerInfo?.data?.user_profile_complete === true) {
        const accountKey = customerInfo?.data?.account_key;
        const returnUrl = `${window.location.origin}/`;
        window.location.href = `https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/wix/oauth/start?account_key=${accountKey}&return_url=${encodeURIComponent(returnUrl)}`;
      } else {
        notificationApi.warning({
          message: "Please complete your profile",
          description: "Please complete your profile to connect to Wix",
        });
      }
    }
  };
  // ── Squarespace: status is derived from companyInfo.connections (see useEffect below) ──

  useEffect(() => {
    dispatch(updateApp(false));
  }, [dispatch]);

  // Check if user is returning from Shopify or Squarespace auth
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

    if (type === 'squarespace') {
      if (connected === 'true') {
        setSquarespaceConnectionStatus('connected');
        notificationApi.success({
          message: 'Squarespace Connected',
          description: 'Your Squarespace store has been successfully connected!',
        });
      } else if (error) {
        setSquarespaceConnectionStatus('disconnected');
        notificationApi.error({
          message: 'Squarespace Connection Failed',
          description: 'Failed to connect to your Squarespace store. Please try again.',
        });
      }
    }

    if (type === 'wix') {
      if (connected === 'true') {
        setWixConnectionStatus('connected');
        notificationApi.success({
          message: 'Wix Connected',
          description: 'Your Wix store has been successfully connected!',
        });
      } else if (error) {
        setWixConnectionStatus('disconnected');
        notificationApi.error({
          message: 'Wix Connection Failed',
          description: 'Failed to connect to your Wix store. Please try again.',
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

                // Read order_sync initial state from parsed data
                if (shopifyConnection.data && shopifyConnection.data.trim() !== "") {
                  try {
                    const pd = JSON.parse(shopifyConnection.data);
                    if (pd.order_sync !== undefined) {
                      setShopifyOrderSync(pd.order_sync === true || pd.order_sync === "true");
                    }
                  } catch (_) {}
                }
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

      // Handle Squarespace connection
      const squarespaceConnection = companyInfo.connections.find((conn: any) => conn.name === "Squarespace");
      console.log("=== SQUARESPACE CONNECTION CHECK ===");
      console.log("Squarespace connection found?:", !!squarespaceConnection);

      if (squarespaceConnection) {
        const sqIdentifier = `${squarespaceConnection.id || 'noid'}_${squarespaceConnection.data || 'nodata'}`;

        if (sqIdentifier !== lastSquarespaceConnectionData) {
          console.log("Squarespace connection changed or first load, processing...");
          setLastSquarespaceConnectionData(sqIdentifier);

          if (squarespaceConnection.id) {
            // Has an access token — check data for explicit disconnect flag
            let isConnected = true;
            if (squarespaceConnection.data && squarespaceConnection.data.trim() !== "") {
              try {
                const parsed = JSON.parse(squarespaceConnection.data);
                console.log("Squarespace parsed data:", parsed);
                if (parsed.isConnected === false || parsed.isConnected === "false") {
                  isConnected = false;
                }
                // Read order_sync initial state
                if (parsed.order_sync !== undefined) {
                  setSquarespaceOrderSync(parsed.order_sync === true || parsed.order_sync === "true");
                }
              } catch (e) {
                console.error("Error parsing Squarespace data:", e);
              }
            }
            console.log("Squarespace isConnected:", isConnected);
            setSquarespaceConnectionStatus(isConnected ? 'connected' : 'disconnected');
          } else {
            console.log("Squarespace entry found but no id — disconnected");
            setSquarespaceConnectionStatus('disconnected');
          }
        } else {
          console.log("Squarespace connection unchanged, skipping processing");
        }
      } else {
        console.log("No Squarespace connection in connections array — disconnected");
        if (lastSquarespaceConnectionData !== null) {
          setLastSquarespaceConnectionData(null);
          setSquarespaceConnectionStatus('disconnected');
        }
      }
      console.log("=== END SQUARESPACE CONNECTION CHECK ===");

      // Handle Wix connection
      const wixConnection = companyInfo.connections.find((conn: any) => conn.name === "Wix");
      console.log("=== WIX CONNECTION CHECK ===");
      console.log("Wix connection found?:", !!wixConnection);

      if (wixConnection) {
        const wixIdentifier = `${wixConnection.id || 'noid'}_${wixConnection.data || 'nodata'}`;

        if (wixIdentifier !== lastWixConnectionData) {
          console.log("Wix connection changed or first load, processing...");
          setLastWixConnectionData(wixIdentifier);

          if (wixConnection.id) {
            // Has an access token — check data for explicit disconnect flag
            let isConnected = true;
            if (wixConnection.data && wixConnection.data.trim() !== "") {
              try {
                const parsed = JSON.parse(wixConnection.data);
                console.log("Wix parsed data:", parsed);
                // Only mark disconnected if explicitly flagged — backend handles token refresh
                if (parsed.isConnected === false || parsed.isConnected === "false") {
                  isConnected = false;
                }
                // Read order_sync initial state
                if (parsed.order_sync !== undefined) {
                  setWixOrderSync(parsed.order_sync === true || parsed.order_sync === "true");
                }
              } catch (e) {
                console.error("Error parsing Wix data:", e);
              }
            }
            console.log("Wix isConnected:", isConnected);
            setWixConnectionStatus(isConnected ? 'connected' : 'disconnected');
          } else {
            console.log("Wix entry found but no id — disconnected");
            setWixConnectionStatus('disconnected');
          }
        } else {
          console.log("Wix connection unchanged, skipping processing");
        }
      } else {
        console.log("No Wix connection in connections array — disconnected");
        if (lastWixConnectionData !== null) {
          setLastWixConnectionData(null);
          setWixConnectionStatus('disconnected');
        }
      }
      console.log("=== END WIX CONNECTION CHECK ===");
    } else {
      // No connections available
      console.log("No connections available");
      dispatch(setConnectionVerificationStatus('disconnected'));
      setShopifyConnectionStatus('disconnected');
      setSquarespaceConnectionStatus('disconnected');
      setWixConnectionStatus('disconnected');
    }
  }, [companyInfo, lastConnectionData, lastShopifyConnectionData, lastSquarespaceConnectionData, lastWixConnectionData, dispatch]);

  // ── Per-platform connection status helpers ──────────────────────────────────
  const getStatus = (name: string) => {
    if (name === "WooCommerce") return connectionVerificationStatus;
    if (name === "Shopify")     return shopifyConnectionStatus;
    if (name === "Squarespace") return squarespaceConnectionStatus;
    if (name === "Wix")         return wixConnectionStatus;
    return "idle";
  };

  const ENABLED = ["WooCommerce", "Excel", "Squarespace", "Wix"];

  // ── Order-sync toggle API call ───────────────────────────────────────────
  const ORDER_SYNC_PLATFORMS: Record<string, boolean> = { Wix: true, Squarespace: true, Shopify: true };
  const platformToKey: Record<string, string> = { Wix: "wix", Squarespace: "squarespace", Shopify: "shopify" };

  const handleOrderSyncToggle = async (platform: string, newValue: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const accountKey = customerInfo?.data?.account_key;
    if (!accountKey) return;

    const setLoading = platform === "Wix"
      ? setWixOrderSyncLoading
      : platform === "Squarespace"
      ? setSquarespaceOrderSyncLoading
      : setShopifyOrderSyncLoading;

    const setSync = platform === "Wix"
      ? setWixOrderSync
      : platform === "Squarespace"
      ? setSquarespaceOrderSync
      : setShopifyOrderSync;

    const setDisconnecting = platform === "Wix"
      ? setWixOrderSyncDisconnecting
      : platform === "Squarespace"
      ? setSquarespaceOrderSyncDisconnecting
      : setShopifyOrderSyncDisconnecting;

    // When turning OFF, play the disconnect burst animation first
    if (!newValue) {
      setDisconnecting(true);
      await new Promise((r) => setTimeout(r, 560));
      setDisconnecting(false);
    }

    setLoading(true);
    try {
      // Build request body — Shopify needs storeName + access_token
      const body: Record<string, any> = {
        account_key: accountKey,
        platform: platformToKey[platform],
        order_sync: newValue,
      };

      if (platform === "Shopify") {
        // Read Shopify connection to get shop + access_token
        const shopifyConn = companyInfo?.connections?.find((c: any) => c.name === "Shopify");
        let storeName = "";
        let access_token = shopifyConn?.id || "";
        if (shopifyConn?.data) {
          try {
            const pd = JSON.parse(shopifyConn.data);
            storeName    = pd.shop         || pd.storeName    || "";
            access_token = pd.access_token || shopifyConn.id  || "";
          } catch (_) {}
        }
        body.storeName    = storeName;
        body.access_token = access_token;
      }

      const res = await fetch(
        "https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/stores/order-sync",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("API error");
      setSync(newValue);
      notificationApi.success({
        message: `Auto-sync ${newValue ? "enabled" : "disabled"}`,
        description: `Automatic order sync for ${platform} has been ${newValue ? "turned on" : "turned off"}.`,
      });
    } catch {
      notificationApi.error({
        message: "Sync toggle failed",
        description: "Could not update the automatic order sync setting. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Per-platform disconnect handler (passed into PlatformSettingsModal) ──
  const handlePlatformDisconnected = (platformName: string) => {
    if (platformName === "Wix") setWixConnectionStatus("disconnected");
    if (platformName === "Squarespace") setSquarespaceConnectionStatus("disconnected");
    if (platformName === "Shopify") setShopifyConnectionStatus("disconnected");
    if (platformName === "WooCommerce") dispatch(setConnectionVerificationStatus("disconnected"));
  };

  return (
    <div style={{ minHeight: "100%", background: isDark ? "#080c14" : "linear-gradient(135deg,#f0f4ff 0%,#fafbff 60%,#f4f8ff 100%)", padding: "40px 32px 60px" }}>

      <style>{`
        @keyframes lp-fade   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes lp-pop    { 0%{transform:scale(.94)} 100%{transform:scale(1)} }
        @keyframes lp-badge  { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        @keyframes gear-float { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-3px) rotate(8deg)} }
        .lp-card {
          transition: box-shadow .22s ease, transform .22s ease, border-color .22s ease;
          animation: lp-fade .3s ease both;
          position: relative;
          z-index: 1;
          will-change: transform;
        }
        .lp-card:hover {
          box-shadow: 0 16px 48px rgba(0,0,0,.18) !important;
          transform: translateY(-5px) !important;
          z-index: 10;
        }
        .lp-card:hover .lp-logo { transform: scale(1.08); }
        .lp-logo { transition: transform .25s ease; }
        .lp-card:active { transform: translateY(-1px) scale(.98) !important; z-index: 10; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ maxWidth: 900, margin: "0 auto 40px", textAlign: "center", animation: "lp-fade .35s ease both" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: isDark ? "#e8edf5" : "#0f1a2e", letterSpacing: -0.5 }}>
          Connect Your Store
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: 15, color: isDark ? "#8892a4" : "#6b7280", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Select a platform below to import orders directly into FinerWorks for fulfillment.
        </p>
      </div>

      {/* ── Platform grid ── */}
      <div style={{
        maxWidth: 1000,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 20,
        overflow: "visible",
        padding: "16px 16px 16px",
      }}>
        {images.map((image, i) => {
          const status   = getStatus(image.name);
          const enabled  = ENABLED.includes(image.name);
          const isConnected    = status === "connected";
          const hasOrderSync   = ORDER_SYNC_PLATFORMS[image.name] === true;
          const orderSyncOn    = image.name === "Wix" ? wixOrderSync    : image.name === "Shopify" ? shopifyOrderSync    : squarespaceOrderSync;
          const orderSyncLoad  = image.name === "Wix" ? wixOrderSyncLoading : image.name === "Shopify" ? shopifyOrderSyncLoading : squarespaceOrderSyncLoading;
          const isVerifying    = status === "verifying";
          const isDisconnected = status === "disconnected";

          return (
            <div
              key={image.name}
              className="lp-card"
              onClick={() => importData(image.name)}
              style={{
                background: isDark ? "#0f1724" : "#fff",
                borderRadius: 18,
                border: isConnected
                  ? "2px solid " + (isDark ? "#14b8a6" : "#52c41a")
                  : isDark ? "2px solid #1e2d42" : "2px solid #e8edf5",
                boxShadow: isConnected
                  ? "0 4px 20px rgba(82,196,26,.15)"
                  : "0 2px 12px rgba(0,0,0,.06)",
                padding: "28px 20px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                position: "relative",
                opacity: enabled ? 1 : 0.55,
                animationDelay: `${i * 0.04}s`,
              }}
            >
              {/* ── Status badge — top LEFT ── */}
              {isVerifying && enabled && (
                <span style={{ position: "absolute", top: 12, left: 12, background: "#dbeafe", color: "#1d4ed8", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, letterSpacing: .3, animation: "lp-pop .6s ease infinite alternate" }}>
                  VERIFYING
                </span>
              )}
              {isConnected && enabled && (
                <span style={{ position: "absolute", top: 12, left: 12, background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, letterSpacing: .3, animation: "lp-badge .3s ease both" }}>
                  ✓ CONNECTED
                </span>
              )}
              {isDisconnected && enabled && image.name !== "Excel" && (
                <span style={{ position: "absolute", top: 12, left: 12, background: "#fee2e2", color: "#b91c1c", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, letterSpacing: .3 }}>
                  DISCONNECTED
                </span>
              )}
              {!enabled && (
                <span style={{ position: "absolute", top: 12, right: 12, background: isDark ? "#1a2a40" : "#f3f4f6", color: isDark ? "#3a5070" : "#9ca3af", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, letterSpacing: .3 }}>
                  SOON
                </span>
              )}

              {/* ── Gear settings modal — top RIGHT corner, only when connected ── */}
              {isConnected && enabled && image.name !== "Excel" && (
                <PlatformSettingsModal
                  platform={image.name}
                  hasOrderSync={hasOrderSync}
                  orderSyncOn={orderSyncOn}
                  orderSyncLoading={orderSyncLoad}
                  orderSyncDisconnecting={image.name === "Wix" ? wixOrderSyncDisconnecting : image.name === "Shopify" ? shopifyOrderSyncDisconnecting : squarespaceOrderSyncDisconnecting}
                  onOrderSyncToggle={(val, e) => handleOrderSyncToggle(image.name, val, e)}
                  onDisconnected={() => handlePlatformDisconnected(image.name)}
                  isDark={isDark}
                />
              )}

              {/* Logo */}
              <div className="lp-logo" style={{
                width: 80, height: 80,
                borderRadius: 16,
                background: isDark ? (enabled ? "#1e2d44" : "#172034") : (enabled ? "#f8faff" : "#f3f4f6"),
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 12,
                border: isDark ? (enabled ? "1px solid #2d4260" : "1px solid #1d2e45") : "none",
                boxShadow: isDark ? (enabled ? "0 2px 8px rgba(0,0,0,.35)" : "none") : "inset 0 1px 3px rgba(0,0,0,.05)",
              }}>
                <img
                  src={image.img}
                  alt={image.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain", filter: enabled ? "none" : "grayscale(1) opacity(.5)" }}
                />
              </div>

              {/* Name */}
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: isDark ? (enabled ? "#e8edf5" : "#4e5a6e") : (enabled ? "#1e2a3b" : "#9ca3af"), textAlign: "center" }}>
                {image.name}
              </p>

              {/* Action label */}
              <p style={{ margin: 0, fontSize: 11, color: isConnected ? (isDark ? "#14b8a6" : "#15803d") : enabled ? (isDark ? "#8892a4" : "#6b7280") : (isDark ? "#253347" : "#c4c9d4"), fontWeight: 500 }}>
                {!enabled
                  ? "Coming soon"
                  : image.name === "Excel"
                  ? "Upload spreadsheet"
                  : isConnected
                  ? "Import orders →"
                  : "Click to connect"}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Modals ── */}
      {(openExcel || opensheet) && (
        <SpreadSheet isOpen={isOpen} onClose={onClose} />
      )}
      <Modal
        title="Connect to Shopify"
        open={showShopifyConnectModal}
        onCancel={() => setShowShopifyConnectModal(false)}
        footer={[
          <Button key="back" onClick={() => setShowShopifyConnectModal(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              setShowShopifyConnectModal(false);
              window.location.href = "https://admin.shopify.com/oauth/install_custom_app?client_id=9ee7cc6b8c1a84382149ca350fd90e1e&no_redirect=true&signature=eyJleHBpcmVzX2F0IjoxNzczNDA4MjYwLCJwZXJtYW5lbnRfZG9tYWluIjoiZmluZXJ3b3Jrcy1kZXYtMy5teXNob3BpZnkuY29tIiwiY2xpZW50X2lkIjoiOWVlN2NjNmI4YzFhODQzODIxNDljYTM1MGZkOTBlMWUiLCJwdXJwb3NlIjoiY3VzdG9tX2FwcCIsIm1lcmNoYW50X29yZ2FuaXphdGlvbl9pZCI6MTI4OTY2OTUyfQ%3D%3D--4832b27e6bfe92d776e673ae4f963674bfda836a";
            }}
          >
            Connect Store
          </Button>,
        ]}
      >
        <p>You need to link your Shopify account to FinerWorks to import orders.</p>
        <p>Would you like to authorize this app by opening the Shopify Admin connection panel?</p>
      </Modal>
    </div>
  );
};

export default Landing;
