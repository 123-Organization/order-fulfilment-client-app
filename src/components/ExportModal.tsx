import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Tag, Spin } from "antd";
import { useAppDispatch, useAppSelector } from "../store";

import bigcommerce from "../assets/images/store-bigcommerce.svg";
import etsy from "../assets/images/store-etsy.svg";
import excel from "../assets/images/store-excel.svg";
import shopify from "../assets/images/store-shopify.svg";
import square from "../assets/images/store-square.svg";
import squarespace from "../assets/images/store-squarespace.svg";
import wix from "../assets/images/store-wix.svg";
import woocommerce from "../assets/images/store-woocommerce.svg";
import { exportOrders, exportToShopify } from "../store/features/InventorySlice";
import { useNotificationContext } from "../context/NotificationContext";
import { inventorySelectionClean } from "../store/features/InventorySlice";
import { resetStatus } from "../store/features/InventorySlice";
import Spinner from "./Spinner";
import { find, groupBy } from "lodash";
import { updateCompanyInfo } from "../store/features/companySlice";
import VariantSelectionModal from "./VariantSelectionModal";

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  inventorySelection: any;
  listInventory: any;
}

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

const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  inventorySelection,
  listInventory,
}) => {
  const handleProductCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onClose();
  };
  const companyInfo = useAppSelector((state) => state.company.company_info);
  console.log("companyInfo", companyInfo);
  const [selected, setSelected] = useState<string | null>(null);
  const [wooConnected, setWooConnected] = useState<string>("Disconnected");
  const [shopifyConnected, setShopifyConnected] = useState<string>("Disconnected");
  const [shopifyConnectionData, setShopifyConnectionData] = useState<{ shop: string; access_token: string } | null>(null);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [variantGroups, setVariantGroups] = useState<any[]>([]);
  const [pendingExportPlatform, setPendingExportPlatform] = useState<string | null>(null);
  const notificationApi = useNotificationContext();
  const exportResponse = useAppSelector(
    (state) => state.Inventory.exportResponse
  );
  const wordpressConnectionId = useAppSelector((state) => state.company.wordpress_connection_id);
  const accountKey = companyInfo?.data?.account_key || "";

  console.log("exportResponse", exportResponse);

  const exportStatus = useAppSelector((state) => state.Inventory.status);

  const dispatch = useAppDispatch();
  const importData = (imgname: string) => {
    // if (imgname === "Excel") {
    //   setOpenExcel(true);
    // }
    // if (imgname === "WooCommerce") {
    //   if (!openBtnConnected) {
    //     dispatch(
    //       ecommerceConnector({
    //         account_key: "81de5dba-0300-4988-a1cb-df97dfa4e372"
    //       })
    //     );
    //   }
    //   else{
    //     navigate("/importfilter?type=WooCommerce")
    //   }
    // }
  };
  useEffect(()=>{
    dispatch(updateCompanyInfo({}))
  },[])

  // Function to detect if any product might have variants
  // Uses full inventory data to find ALL variants, not just selected ones
  const detectProductsWithVariants = (selectedProducts: any[]): { hasVariants: boolean; variantGroups: any[] } => {
    console.log("🔍 Detecting variants for selected products:", selectedProducts);
    
    // Get full inventory data
    const fullInventory = listInventory?.data || [];
    console.log("🔍 Full inventory count:", fullInventory.length);
    
    const variantGroups: any[] = [];
    const processedImageGuids = new Set<string>();
    const processedParentSkus = new Set<string>();
    
    // For each selected product, find ALL variants from the full inventory
    selectedProducts.forEach((selectedProduct) => {
      console.log("🔍 Processing selected product:", {
        sku: selectedProduct.sku,
        image_guid: selectedProduct.image_guid,
        parent_sku: selectedProduct.parent_sku,
        has_children: selectedProduct.has_children
      });
      
      // Method 1: Find all products with same image_guid from FULL inventory
      if (selectedProduct.image_guid && !processedImageGuids.has(selectedProduct.image_guid)) {
        const allVariantsByImageGuid = fullInventory.filter(
          (p: any) => p.image_guid === selectedProduct.image_guid
        );
        
        console.log(`🔍 Found ${allVariantsByImageGuid.length} products with image_guid ${selectedProduct.image_guid}`);
        
        if (allVariantsByImageGuid.length > 1) {
          processedImageGuids.add(selectedProduct.image_guid);
          
          // Mark which ones were originally selected
          const productsWithSelection = allVariantsByImageGuid.map((p: any) => ({
            ...p,
            isSelected: selectedProducts.some(sp => sp.sku === p.sku)
          }));
          
          variantGroups.push({
            imageGuid: selectedProduct.image_guid,
            imageName: selectedProduct.name || "Product Group",
            imageUrl: selectedProduct.image_url_1 || "",
            products: productsWithSelection,
            reason: `${allVariantsByImageGuid.length} variants share this image`,
            selectedCount: productsWithSelection.filter((p: any) => p.isSelected).length
          });
        }
      }
      
      // Method 2: Find all products with same parent_sku from FULL inventory
      if (selectedProduct.parent_sku && !processedParentSkus.has(selectedProduct.parent_sku)) {
        const allVariantsByParent = fullInventory.filter(
          (p: any) => p.parent_sku === selectedProduct.parent_sku || p.sku === selectedProduct.parent_sku
        );
        
        console.log(`🔍 Found ${allVariantsByParent.length} products with parent_sku ${selectedProduct.parent_sku}`);
        
        // Check if not already captured by image_guid
        const alreadyCaptured = variantGroups.some(g => 
          g.products.some((p: any) => allVariantsByParent.some((v: any) => v.sku === p.sku))
        );
        
        if (!alreadyCaptured && allVariantsByParent.length > 1) {
          processedParentSkus.add(selectedProduct.parent_sku);
          
          const productsWithSelection = allVariantsByParent.map((p: any) => ({
            ...p,
            isSelected: selectedProducts.some(sp => sp.sku === p.sku)
          }));
          
          variantGroups.push({
            imageGuid: `parent-${selectedProduct.parent_sku}`,
            imageName: `Variants of ${selectedProduct.parent_sku}`,
            imageUrl: selectedProduct.image_url_1 || "",
            products: productsWithSelection,
            reason: `${allVariantsByParent.length} variants share parent SKU`,
            selectedCount: productsWithSelection.filter((p: any) => p.isSelected).length
          });
        }
      }
      
      // Method 3: If product has_children, find all children from FULL inventory
      if (selectedProduct.has_children && !processedParentSkus.has(selectedProduct.sku)) {
        const allChildren = fullInventory.filter(
          (p: any) => p.parent_sku === selectedProduct.sku
        );
        
        console.log(`🔍 Found ${allChildren.length} children for parent ${selectedProduct.sku}`);
        
        if (allChildren.length > 0) {
          processedParentSkus.add(selectedProduct.sku);
          
          // Include parent + all children
          const allVariants = [selectedProduct, ...allChildren];
          const productsWithSelection = allVariants.map((p: any) => ({
            ...p,
            isSelected: selectedProducts.some(sp => sp.sku === p.sku)
          }));
          
          variantGroups.push({
            imageGuid: `children-of-${selectedProduct.sku}`,
            imageName: selectedProduct.name || "Parent Product",
            imageUrl: selectedProduct.image_url_1 || "",
            products: productsWithSelection,
            reason: `Parent product with ${allChildren.length} variants`,
            isParentOnly: true,
            selectedCount: productsWithSelection.filter((p: any) => p.isSelected).length
          });
        }
      }
    });
    
    console.log("🔍 Final variant groups:", variantGroups);
    console.log("🔍 Has variants:", variantGroups.length > 0);
    
    return {
      hasVariants: variantGroups.length > 0,
      variantGroups
    };
  };

  // Handle variant selection confirmation
  const handleVariantConfirm = async (selections: { primary: any; variants: any[] }[]) => {
    console.log("Variant selections confirmed:", selections);
    setVariantModalVisible(false);
    
    // Format products with primaryItem flag for the API
    // Each group has a primary product and its variants
    const formattedProductsList: any[] = [];
    
    selections.forEach((group) => {
      // Add primary product with primaryItem: true
      if (group.primary) {
        formattedProductsList.push({
          ...group.primary,
          primaryItem: true
        });
      }
      
      // Add variants without primaryItem flag (or with primaryItem: false)
      group.variants.forEach((variant) => {
        formattedProductsList.push({
          ...variant,
          primaryItem: false
        });
      });
    });
    
    console.log("Formatted products list for export:", formattedProductsList);
    
    if (pendingExportPlatform === "WooCommerce") {
      await dispatch(exportOrders({ data: formattedProductsList, domainName: wordpressConnectionId }));
      dispatch(resetStatus());
    } else if (pendingExportPlatform === "Shopify" && shopifyConnectionData) {
      await dispatch(exportToShopify({ 
        productsList: formattedProductsList, 
        storeName: shopifyConnectionData.shop,
        accessToken: shopifyConnectionData.access_token,
        accountKey: accountKey
      }));
      dispatch(resetStatus());
    }
    
    setPendingExportPlatform(null);
  };

  // Handle skipping variant configuration (export as individual products)
  const handleSkipVariants = async () => {
    console.log("Skipping variant configuration, exporting as individual products");
    setVariantModalVisible(false);
    
    if (pendingExportPlatform === "WooCommerce") {
      await dispatch(exportOrders({ data: inventorySelection, domainName: wordpressConnectionId }));
      dispatch(resetStatus());
    } else if (pendingExportPlatform === "Shopify" && shopifyConnectionData) {
      await dispatch(exportToShopify({ 
        productsList: inventorySelection, 
        storeName: shopifyConnectionData.shop,
        accessToken: shopifyConnectionData.access_token,
        accountKey: accountKey
      }));
      dispatch(resetStatus());
    }
    
    setPendingExportPlatform(null);
  };

  const handleExport = async (imgname: string) => {
    console.log("📦 Export clicked for:", imgname);
    console.log("📦 Inventory selection:", inventorySelection);
    console.log("📦 List inventory data:", listInventory);
    console.log("📦 Full inventory array:", listInventory?.data);
    console.log("📦 Full inventory length:", listInventory?.data?.length);
    
    // Log sample product to see available fields
    if (inventorySelection?.length > 0) {
      console.log("📦 Sample selected product fields:", Object.keys(inventorySelection[0]));
      console.log("📦 Sample selected product:", inventorySelection[0]);
    }
    if (listInventory?.data?.length > 0) {
      console.log("📦 Sample inventory product fields:", Object.keys(listInventory.data[0]));
      console.log("📦 Sample inventory product:", listInventory.data[0]);
    }

    if (selected === imgname) {
      setSelected(null);
    } else {
      setSelected(imgname);
    }

    if (imgname === "WooCommerce" && wooConnected === "Connected") {
      // Get the list of already exported products
      const exportedProducts = inventorySelection.filter(
        (product: any) => product.third_party_integrations?.woocommerce_product_id
      );
  
      if (exportedProducts.length > 0) {
        notificationApi.warning({
          message: "Products Already Exported",
          description: `${exportedProducts.length} product(s) have already been exported to WooCommerce. Please select only unexported products.`,
        });
        return;
      }
  
      // Check for variant groups before exporting
      const { hasVariants, variantGroups: detectedVariants } = detectProductsWithVariants(inventorySelection);
      if (hasVariants) {
        // Products with variants detected - show variant selection modal
        setVariantGroups(detectedVariants);
        setPendingExportPlatform("WooCommerce");
        setVariantModalVisible(true);
        return;
      }

      // If no variants, proceed with normal export
      await dispatch(exportOrders({ data: inventorySelection, domainName: wordpressConnectionId }));
      dispatch(resetStatus())
    }
    else if(imgname === "WooCommerce" && wooConnected === "Disconnected"){
      notificationApi.error({
        message: "WooCommerce Not Connected",
        description: `Please connect to WooCommerce to export products`,
      });
    } 
    // Handle Shopify Export
    else if (imgname === "Shopify" && shopifyConnected === "Connected") {
      // Get the list of already exported products to Shopify (check both shopify_product_id and shopify_graphql_product_id)
      const exportedProducts = inventorySelection.filter(
        (product: any) => 
          (product.third_party_integrations?.shopify_product_id && product.third_party_integrations?.shopify_product_id !== 0) ||
          (product.third_party_integrations?.shopify_graphql_product_id && product.third_party_integrations?.shopify_graphql_product_id !== 0)
      );
  
      if (exportedProducts.length > 0) {
        notificationApi.warning({
          message: "Products Already Exported",
          description: `${exportedProducts.length} product(s) have already been exported to Shopify. Please select only unexported products.`,
        });
        return;
      }

      if (!shopifyConnectionData) {
        notificationApi.error({
          message: "Shopify Connection Error",
          description: "Could not retrieve Shopify connection details.",
        });
        return;
      }

      // Check for variant groups before exporting
      const { hasVariants: hasShopifyVariants, variantGroups: detectedShopifyVariants } = detectProductsWithVariants(inventorySelection);
      if (hasShopifyVariants) {
        // Products with variants detected - show variant selection modal
        setVariantGroups(detectedShopifyVariants);
        setPendingExportPlatform("Shopify");
        setVariantModalVisible(true);
        return;
      }
  
      // If no variants, proceed with normal export
      await dispatch(exportToShopify({ 
        productsList: inventorySelection, 
        storeName: shopifyConnectionData.shop,
        accessToken: shopifyConnectionData.access_token,
        accountKey: accountKey
      }));
      dispatch(resetStatus())
    }
    else if(imgname === "Shopify" && shopifyConnected === "Disconnected"){
      notificationApi.error({
        message: "Shopify Not Connected",
        description: `Please connect to Shopify to export products`,
      });
    }
    else if(imgname !== "WooCommerce" && imgname !== "Shopify"){
      notificationApi.warning({
        message: "Platform is not supported",
        description: `This platform is not supported yet`,
      });
    }
   
  };

  useEffect(() => {
    if (exportStatus === "success") {
      notificationApi.success({
        message: "Products Exported Successfully",
        description: `${inventorySelection.length} products exported  `,
      });
      onClose();
      dispatch(inventorySelectionClean());
      setSelected(null);
    } else if (exportStatus === "error") {
      notificationApi.error({
        message: "Products Export Failed",
        description: `${inventorySelection.length} products failed to export  `,
      });
    }
  }, [exportStatus, notificationApi]);


  useEffect(()=>{
    if(companyInfo?.data?.connections?.length){
      // Check WooCommerce connection
      let wooObj = find(companyInfo.data.connections, {"name":"WooCommerce"});
      if(wooObj?.name){
        setWooConnected("Connected");
      } else {
        setWooConnected("Disconnected");
      }

      // Check Shopify connection
      let shopifyObj = find(companyInfo.data.connections, {"name":"Shopify"});
      if(shopifyObj?.name){
        setShopifyConnected("Connected");
        // Parse the Shopify connection data to get shop and access_token
        try {
          const shopifyData = JSON.parse(shopifyObj.data);
          setShopifyConnectionData({
            shop: shopifyData.shop,
            access_token: shopifyData.access_token
          });
        } catch (error) {
          console.error("Error parsing Shopify connection data:", error);
          setShopifyConnectionData(null);
        }
      } else {
        setShopifyConnected("Disconnected");
        setShopifyConnectionData(null);
      }
    }
  }, [companyInfo]);

  const handleSelection = (name: string) => {
    if (selected === name) {
      setSelected(null);
    } else {
      setSelected(name);
    }
  };

  console.log("coco", companyInfo);

  return (
    <>
    <Modal
      title="Select Export option"
      visible={visible}
      width={"55%"}
      onCancel={onClose}
      footer={null}
      bodyStyle={{ minHeight: "400px" }}
    >
      <div className="w-full" style={{ minHeight: "400px" }}>
        {exportStatus === "loading" ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ minHeight: "350px" }}
          >
            <Spinner message={"Exporting Products"} />
          </div>
        ) : (
          <div className="container mx-auto px-5 py-2 lg:px-10 justify-center items-center">
            <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
              {images.map((image, index) => {
                // Determine connection status for platforms
                const isWooCommerce = image.name === "WooCommerce";
                const isShopify = image.name === "Shopify";
                const isConnected = isWooCommerce ? wooConnected === "Connected" : 
                                    isShopify ? shopifyConnected === "Connected" : false;
                const connectionStatus = isWooCommerce ? wooConnected : 
                                         isShopify ? shopifyConnected : null;
                
                return (
                <div
                  key={index}
                  className="flex w-1/3 max-sm:w-1/2 max-[400px]:w-full flex-wrap"
                >
                  <div
                    className="w-full md:p-2 flex flex-col items-center"
                    onClick={() => importData(image.name)}
                  >
                    {(isWooCommerce || isShopify) && (
                      <Tag className={`absolute ml-12 -mt-3 ${isConnected ? "bg-[#52c41a] text-white" : "bg-red-500 text-white ml-7" }`}>
                        {connectionStatus}
                      </Tag>
                    )}
                    <img
                      onClick={() => handleExport(image.name)}
                      className={`block h-[100px] w-[100px] border-2 cursor-pointer rounded-lg object-cover object-center ${
                        selected === image.name
                          ? "border-blue-500"
                          : "border-gray-300"
                      } ${
                        (isWooCommerce || isShopify)
                          ? "grayscale-0"
                          : "grayscale"
                      }`}
                      src={image.img}
                      alt={image.name}
                    />
                    <p className="text-center pt-2 font-bold text-gray-400">
                      {image.name}
                    </p>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>

    {/* Variant Selection Modal */}
    <VariantSelectionModal
      visible={variantModalVisible}
      onClose={() => {
        setVariantModalVisible(false);
        setPendingExportPlatform(null);
      }}
      onConfirm={handleVariantConfirm}
      onSkip={handleSkipVariants}
      variantGroups={variantGroups}
      platform={pendingExportPlatform || ""}
    />
    </>
  );
};

export default ExportModal;
