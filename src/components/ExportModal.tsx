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
import { exportOrders, exportToShopify, exportToWix } from "../store/features/InventorySlice";
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
  onExportSuccess?: () => void; // Optional callback to refresh the inventory list after export
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
  onExportSuccess,
}) => {
  const handleProductCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onClose();
  };
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const [selected, setSelected] = useState<string | null>(null);
  const [wooConnected, setWooConnected] = useState<string>("Disconnected");
  const [shopifyConnected, setShopifyConnected] = useState<string>("Disconnected");
  const [shopifyConnectionData, setShopifyConnectionData] = useState<{ shop: string; access_token: string } | null>(null);
  const [wixConnected, setWixConnected] = useState<string>("Disconnected");
  const [wixConnectionData, setWixConnectionData] = useState<{ access_token: string } | null>(null);
  const [squarespaceConnected, setSquarespaceConnected] = useState<string>("Disconnected");
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [variantGroups, setVariantGroups] = useState<any[]>([]);
  const [pendingExportPlatform, setPendingExportPlatform] = useState<string | null>(null);
  const notificationApi = useNotificationContext();
  const exportResponse = useAppSelector(
    (state) => state.Inventory.exportResponse
  );
  const wordpressConnectionId = useAppSelector((state) => state.company.wordpress_connection_id);
  const accountKey = companyInfo?.data?.account_key || "";

  

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
  // Also returns standalone products (selected but not part of any variant group)
  const detectProductsWithVariants = (selectedProducts: any[]): { hasVariants: boolean; variantGroups: any[]; standaloneProducts: any[] } => {
    
    
    // Get full inventory data
    const fullInventory = listInventory?.data || [];
    
    
    const variantGroups: any[] = [];
    const processedImageGuids = new Set<string>();
    const processedParentSkus = new Set<string>();
    
    // For each selected product, find ALL variants from the full inventory
    selectedProducts.forEach((selectedProduct) => {
      
      
      // Method 1: Find all products with same image_guid from FULL inventory
      if (selectedProduct.image_guid && !processedImageGuids.has(selectedProduct.image_guid)) {
        const allVariantsByImageGuid = fullInventory.filter(
          (p: any) => p.image_guid === selectedProduct.image_guid
        );
        
        
        
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
    
    
    
    // Collect selected products that weren't captured in any variant group
    const coveredSkus = new Set<string>();
    variantGroups.forEach((group) => {
      group.products.forEach((p: any) => coveredSkus.add(p.sku));
    });
    const standaloneProducts = selectedProducts.filter((p) => !coveredSkus.has(p.sku));

    return {
      hasVariants: variantGroups.length > 0,
      variantGroups,
      standaloneProducts
    };
  };

  // Standalone products that have no variants — kept in sync with the last detectProductsWithVariants call
  const [standaloneProducts, setStandaloneProducts] = useState<any[]>([]);

  // Handle variant selection confirmation
  const handleVariantConfirm = async (selections: { primary: any; variants: any[] }[]) => {
    
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

    // Also include standalone products (selected but not part of any variant group)
    standaloneProducts.forEach((product) => {
      formattedProductsList.push({
        ...product,
        primaryItem: true
      });
    });
    
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
    } else if (pendingExportPlatform === "Wix" && wixConnectionData) {
      await dispatch(exportToWix({
        productList: formattedProductsList,
        accessToken: wixConnectionData.access_token,
        accountKey: accountKey,
      }));
      dispatch(resetStatus());
    }
    
    setPendingExportPlatform(null);
  };

  // Handle skipping variant configuration (export as individual products)
  const handleSkipVariants = async () => {
    
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
    } else if (pendingExportPlatform === "Wix" && wixConnectionData) {
      await dispatch(exportToWix({
        productList: inventorySelection,
        accessToken: wixConnectionData.access_token,
        accountKey: accountKey,
      }));
      dispatch(resetStatus());
    }
    
    setPendingExportPlatform(null);
  };

  const handleExport = async (imgname: string) => {
    
    
    

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
      const { hasVariants, variantGroups: detectedVariants, standaloneProducts: detectedStandalones } = detectProductsWithVariants(inventorySelection);
      if (hasVariants) {
        setVariantGroups(detectedVariants);
        setStandaloneProducts(detectedStandalones);
        setPendingExportPlatform("WooCommerce");
        setVariantModalVisible(true);
        return;
      }

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

      const { hasVariants: hasShopifyVariants, variantGroups: detectedShopifyVariants, standaloneProducts: detectedShopifyStandalones } = detectProductsWithVariants(inventorySelection);
      if (hasShopifyVariants) {
        setVariantGroups(detectedShopifyVariants);
        setStandaloneProducts(detectedShopifyStandalones);
        setPendingExportPlatform("Shopify");
        setVariantModalVisible(true);
        return;
      }
  
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
    // Handle Wix Export
    else if (imgname === "Wix" && wixConnected === "Connected") {
      const exportedProducts = inventorySelection.filter(
        (product: any) => product.third_party_integrations?.wix_product_id
      );

      if (exportedProducts.length > 0) {
        notificationApi.warning({
          message: "Products Already Exported",
          description: `${exportedProducts.length} product(s) have already been exported to Wix. Please select only unexported products.`,
        });
        return;
      }

      if (!wixConnectionData) {
        notificationApi.error({
          message: "Wix Connection Error",
          description: "Could not retrieve Wix connection details.",
        });
        return;
      }

      const { hasVariants: hasWixVariants, variantGroups: detectedWixVariants, standaloneProducts: detectedWixStandalones } = detectProductsWithVariants(inventorySelection);
      if (hasWixVariants) {
        setVariantGroups(detectedWixVariants);
        setStandaloneProducts(detectedWixStandalones);
        setPendingExportPlatform("Wix");
        setVariantModalVisible(true);
        return;
      }

      await dispatch(exportToWix({
        productList: inventorySelection,
        accessToken: wixConnectionData.access_token,
        accountKey: accountKey,
      }));
      dispatch(resetStatus());
    }
    else if (imgname === "Wix" && wixConnected === "Disconnected") {
      notificationApi.error({
        message: "Wix Not Connected",
        description: `Please connect to Wix to export products`,
      });
    }
    // Handle Squarespace — connection status is shown but export is not yet available
    else if (imgname === "Squarespace" && squarespaceConnected === "Connected") {
      notificationApi.warning({
        message: "Export to Squarespace Coming Soon",
        description: `Squarespace export is not yet supported. Please check back for updates.`,
      });
    }
    else if (imgname === "Squarespace" && squarespaceConnected === "Disconnected") {
      notificationApi.error({
        message: "Squarespace Not Connected",
        description: `Please connect to Squarespace to export products`,
      });
    }
    else if (imgname !== "WooCommerce" && imgname !== "Shopify" && imgname !== "Wix" && imgname !== "Squarespace") {
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
      // Re-fetch the inventory list so updated third_party_integrations are shown without a page reload
      if (onExportSuccess) {
        onExportSuccess();
      }
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

      // Check Wix connection
      let wixObj = find(companyInfo.data.connections, {"name":"Wix"});
      if (wixObj?.name) {
        setWixConnected("Connected");
        try {
          const wixData = JSON.parse(wixObj.data);
          setWixConnectionData({ access_token: wixData.access_token });
        } catch (error) {
          console.error("Error parsing Wix connection data:", error);
          setWixConnectionData(null);
        }
      } else {
        setWixConnected("Disconnected");
        setWixConnectionData(null);
      }

      // Check Squarespace connection
      let squarespaceObj = find(companyInfo.data.connections, {"name":"Squarespace"});
      if (squarespaceObj?.name) {
        setSquarespaceConnected("Connected");
      } else {
        setSquarespaceConnected("Disconnected");
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
          <>
            <style>{`
              @keyframes em-fade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
              @keyframes em-pop  { 0%{transform:scale(.94)} 100%{transform:scale(1)} }
              .em-card { transition: box-shadow .22s ease, transform .22s ease, border-color .22s ease; animation: em-fade .28s ease both; }
              .em-card:hover { box-shadow: 0 14px 40px rgba(0,0,0,.12) !important; transform: translateY(-4px) !important; }
              .em-card:hover .em-logo { transform: scale(1.08); }
              .em-logo { transition: transform .25s ease; }
            `}</style>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 16,
              padding: "8px 4px 4px",
            }}>
              {images.map((image, index) => {
                const isWooCommerce    = image.name === "WooCommerce";
                const isShopify        = image.name === "Shopify";
                const isWix            = image.name === "Wix";
                const isSquarespace    = image.name === "Squarespace";
                const isSupportedPlatform = isWooCommerce || isShopify || isWix || isSquarespace;
                const isConnected = isWooCommerce  ? wooConnected === "Connected"
                                  : isShopify      ? shopifyConnected === "Connected"
                                  : isWix          ? wixConnected === "Connected"
                                  : isSquarespace  ? squarespaceConnected === "Connected"
                                  : false;
                const isDisconnected = isSupportedPlatform && !isConnected;

                return (
                  <div
                    key={image.name}
                    className="em-card"
                    onClick={() => handleExport(image.name)}
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      border: isConnected
                        ? "2px solid #52c41a"
                        : selected === image.name
                        ? "2px solid #3b82f6"
                        : "2px solid #e8edf5",
                      boxShadow: isConnected
                        ? "0 4px 18px rgba(82,196,26,.14)"
                        : "0 2px 10px rgba(0,0,0,.06)",
                      padding: "22px 14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      position: "relative",
                      opacity: isSupportedPlatform ? 1 : 0.5,
                      animationDelay: `${index * 0.04}s`,
                    }}
                  >
                    {/* Status pill */}
                    {isConnected && (
                      <span style={{ position: "absolute", top: 10, right: 10, background: "#dcfce7", color: "#15803d", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, letterSpacing: .3 }}>
                        ✓ CONNECTED
                      </span>
                    )}
                    {isDisconnected && (
                      <span style={{ position: "absolute", top: 10, right: 10, background: "#fee2e2", color: "#b91c1c", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, letterSpacing: .3 }}>
                        DISCONNECTED
                      </span>
                    )}
                    {!isSupportedPlatform && (
                      <span style={{ position: "absolute", top: 10, right: 10, background: "#f3f4f6", color: "#9ca3af", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, letterSpacing: .3 }}>
                        SOON
                      </span>
                    )}

                    {/* Logo */}
                    <div className="em-logo" style={{
                      width: 68, height: 68,
                      borderRadius: 14,
                      background: isSupportedPlatform ? "#f8faff" : "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 10,
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,.05)",
                    }}>
                      <img
                        src={image.img}
                        alt={image.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain", filter: isSupportedPlatform ? "none" : "grayscale(1) opacity(.5)" }}
                      />
                    </div>

                    {/* Name */}
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: isSupportedPlatform ? "#1e2a3b" : "#9ca3af", textAlign: "center" }}>
                      {image.name}
                    </p>

                    {/* Action label */}
                    <p style={{ margin: 0, fontSize: 11, color: isConnected ? "#15803d" : isSupportedPlatform ? "#6b7280" : "#c4c9d4", fontWeight: 500 }}>
                      {!isSupportedPlatform ? "Coming soon" : isConnected ? "Click to export →" : "Connect first"}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
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
      standaloneProducts={standaloneProducts}
    />
    </>
  );
};

export default ExportModal;
