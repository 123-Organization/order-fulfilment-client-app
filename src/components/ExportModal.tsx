import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Tag, Spin } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import { useCookies } from "react-cookie";

import bigcommerce from "../assets/images/store-bigcommerce.svg";
import etsy from "../assets/images/store-etsy.svg";
import excel from "../assets/images/store-excel.svg";
import shopify from "../assets/images/store-shopify.svg";
import square from "../assets/images/store-square.svg";
import squarespace from "../assets/images/store-squarespace.svg";
import wix from "../assets/images/store-wix.svg";
import woocommerce from "../assets/images/store-woocommerce.svg";
import { exportOrders, exportToShopify, exportToWix, exportToSquarespace } from "../store/features/InventorySlice";
import { useNotificationContext } from "../context/NotificationContext";
import { inventorySelectionClean } from "../store/features/InventorySlice";
import { resetStatus, setExportLoading, setExportResult } from "../store/features/InventorySlice";
import Spinner from "./Spinner";
import { find } from "lodash";
import { updateCompanyInfo } from "../store/features/companySlice";
import config from "../config/configs";
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
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const [selected, setSelected] = useState<string | null>(null);
  const [wooConnected, setWooConnected] = useState<string>("Disconnected");
  const [shopifyConnected, setShopifyConnected] = useState<string>("Disconnected");
  const [shopifyConnectionData, setShopifyConnectionData] = useState<{ shop: string; access_token: string } | null>(null);
  const [wixConnected, setWixConnected] = useState<string>("Disconnected");
  const [wixConnectionData, setWixConnectionData] = useState<{ access_token: string } | null>(null);
  const [squarespaceConnected, setSquarespaceConnected] = useState<string>("Disconnected");
  const [squarespaceConnectionData, setSquarespaceConnectionData] = useState<{ access_token: string } | null>(null);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [variantGroups, setVariantGroups] = useState<any[]>([]);
  const [pendingExportPlatform, setPendingExportPlatform] = useState<string | null>(null);
  const notificationApi = useNotificationContext();
  const exportResponse = useAppSelector(
    (state) => state.Inventory.exportResponse
  );
  const wordpressConnectionId = useAppSelector((state) => state.company.wordpress_connection_id);
  const accountKey = companyInfo?.data?.account_key || localStorage.getItem('squarespace_account_key') || "";
  


  const exportStatus = useAppSelector((state) => state.Inventory.status);

  const getValidSquarespaceToken = async (): Promise<string | null> => {
    let squarespaceToken: string =
      (localStorage.getItem('squarespace_token') ||
        localStorage.getItem('squarespace_access_token')) as string;
    let squarespaceRefreshToken = '';
    const accKey = accountKey || localStorage.getItem('squarespace_account_key') || '';

    if (companyInfo?.data?.connections) {
      const sqConnection = companyInfo.data.connections.find(
        (conn: any) => conn.name === "Squarespace"
      );

      if (sqConnection && sqConnection.data) {
        try {
          const parsedData = JSON.parse(sqConnection.data);
          if (!squarespaceToken) {
            squarespaceToken = parsedData.access_token || parsedData.token || sqConnection.id;
          }
          squarespaceRefreshToken = parsedData.refresh_token;
        } catch (e) {
          if (!squarespaceToken) squarespaceToken = sqConnection.id;
        }
      } else if (sqConnection && sqConnection.id && !squarespaceToken) {
        squarespaceToken = sqConnection.id;
      }
    }

    if (!squarespaceToken) {
      notificationApi.error({
        message: 'Not Connected',
        description: 'No Squarespace token found. Please reconnect your store.',
      });
      return null;
    }

    let isTokenValid = true;
    try {
      const validateRes = await fetch(`${config.SERVER_BASE_URL}squarespace/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: squarespaceToken })
      });
      const validateData = await validateRes.json();

      if (!validateRes.ok || validateData.valid === false || validateData.error || validateData?.message?.toLowerCase().includes("expired")) {
        isTokenValid = false;
      }
    } catch (e) {
      console.error("Error validating token", e);
    }

    if (!isTokenValid) {
      if (squarespaceRefreshToken && accKey) {
        try {
          const refreshRes = await fetch(`${config.SERVER_BASE_URL}squarespace/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_key: accKey, refresh_token: squarespaceRefreshToken })
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData.access_token || refreshData.token || refreshData?.data?.access_token;
            if (newToken) {
              squarespaceToken = newToken;
              localStorage.setItem('squarespace_token', squarespaceToken);
              setSquarespaceConnectionData({ access_token: squarespaceToken });
              return squarespaceToken;
            } else {
              notificationApi.info({
                message: 'Token Refreshed',
                description: 'Applying updated Squarespace authorization...'
              });
              await dispatch(updateCompanyInfo(companyInfo));
              setTimeout(() => window.location.reload(), 1500);
              return null;
            }
          } else {
            throw new Error("Refresh token rejected");
          }
        } catch (e) {
          localStorage.removeItem('squarespace_token');
          localStorage.removeItem('squarespace_access_token');
          localStorage.removeItem('squarespace_account_key');
          notificationApi.error({
            message: 'Squarespace Token Expired',
            description: 'Your Squarespace access token has expired and refresh failed. Please reconnect your store.',
          });
          setTimeout(() => {
            window.location.href = `${config.SERVER_BASE_URL}squarespace/auth?account_key=${accKey}`;
          }, 2000);
          return null;
        }
      } else {
        localStorage.removeItem('squarespace_token');
        localStorage.removeItem('squarespace_access_token');
        localStorage.removeItem('squarespace_account_key');
        notificationApi.error({
          message: 'Squarespace Token Expired',
          description: 'Your Squarespace access token has expired. Please reconnect your store.',
        });
        setTimeout(() => {
          window.location.href = `${config.SERVER_BASE_URL}squarespace/auth?account_key=${accKey}`;
        }, 2000);
        return null;
      }
    }

    setSquarespaceConnectionData({ access_token: squarespaceToken });
    return squarespaceToken;
  };

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

  // ---------------------------------------------------------------------------
  // Concurrent export helpers
  // ---------------------------------------------------------------------------

  /**
   * Squarespace requires that every variant in a product has a *unique* combination
   * of attribute values (type, media, style, etc.). If the same image_guid is shared
   * by multiple products that happen to have identical attributes (e.g. an old and a
   * new version of the same print), the API returns "Product attributes must be unique."
   *
   * This helper deduplicates a variant group's product list by their attribute
   * signature — which is everything in `description_short` except the `sku:` line.
   * When two products collide, the user-selected or primaryItem one wins.
   */
  const deduplicateVariantProducts = (products: any[]): any[] => {
    const seen = new Map<string, any>();
    for (const product of products) {
      // Build a stable attribute key from description_short, stripping the sku line
      const desc: string = product.description_short || product.description_long || '';
      const attrKey = desc
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter((l: string) => l && !l.toLowerCase().startsWith('sku:'))
        .join('|')
        .toLowerCase();

      if (!seen.has(attrKey)) {
        seen.set(attrKey, product);
      } else {
        // Prefer the user-selected or primaryItem product over a non-selected duplicate
        const existing = seen.get(attrKey);
        const incomingScore = (product.isSelected ? 2 : 0) + (product.primaryItem ? 1 : 0);
        const existingScore = (existing.isSelected ? 2 : 0) + (existing.primaryItem ? 1 : 0);
        if (incomingScore > existingScore) {
          seen.set(attrKey, product);
        }
      }
    }
    return Array.from(seen.values());
  };

  /**
   * Turn variant groups + standalone products into an array of "batches".
   * Each batch is an array of products that should travel in ONE API call:
   *   - variant group  → one batch containing all products in that group
   *   - standalone     → one batch containing just that single product
   */
  const buildExportBatches = (
    vGroups: any[],
    standalones: any[]
  ): any[][] => {
    const batches: any[][] = [];

    // One call per variant group (all members together)
    // Deduplicate within each group first to avoid "Product attributes must be unique" errors
    vGroups.forEach((group) => {
      if (group.products && group.products.length > 0) {
        const deduped = deduplicateVariantProducts(group.products);
        batches.push(deduped);
      }
    });

    // One call per standalone product
    standalones.forEach((product) => {
      batches.push([product]);
    });

    return batches;
  };

  /**
   * Fire one API call per batch concurrently (Promise.allSettled).
   * Returns a merged exportResponse-shaped object and aggregate counts.
   *
   * Supported platforms: "WooCommerce" | "Shopify" | "Wix" | "Squarespace"
   */
  const runConcurrentExport = async (
    platform: string,
    batches: any[][],
    connectionDetails: {
      shopify?: { shop: string; access_token: string };
      wix?: { access_token: string };
      squarespace?: { access_token: string; sessionId: string; accountKey: string; variant?: boolean };
      woocommerce?: { domainName: string };
    }
  ): Promise<{ mergedResponse: any; totalUploaded: number; totalFailed: number }> => {
    const BASE = config.SERVER_BASE_URL;

    const callBatch = async (productsList: any[]): Promise<any> => {
      let response: Response;

      if (platform === "WooCommerce" && connectionDetails.woocommerce) {
        const payload = {
          domainName: connectionDetails.woocommerce.domainName,
          auth_code: "f8df5ecd-6c85-4d2c-a402-676b0556c156",
          productsList,
        };
        response = await fetch(`${BASE}export-to-woocommerce`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (platform === "Shopify" && connectionDetails.shopify) {
        const payload = {
          account_key: accountKey,
          productsList,
          storeName: connectionDetails.shopify.shop,
          access_token: connectionDetails.shopify.access_token,
        };
        response = await fetch(`${BASE}shopify/sync-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "*/*" },
          body: JSON.stringify(payload),
        });
      } else if (platform === "Wix" && connectionDetails.wix) {
        response = await fetch(
          `${BASE}wix/sync-products?account_key=${accountKey}&access_token=${connectionDetails.wix.access_token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "*/*" },
            body: JSON.stringify({ productList: productsList }),
          }
        );
      } else if (platform === "Squarespace" && connectionDetails.squarespace) {
        const sqDetail = connectionDetails.squarespace;
        const payload = {
          access_token: sqDetail.access_token,
          currency: "USD",
          siteId: 2,
          session_id: sqDetail.sessionId,
          account_key: sqDetail.accountKey,
          productsList,
          variant: sqDetail.variant ?? false,
        };
        response = await fetch(`${BASE}squarespace/sync-products-v2`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "*/*" },
          body: JSON.stringify(payload),
        });
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${platform} API`);
      }
      return response.json();
    };

    // Fire all batches concurrently
    const settled = await Promise.allSettled(batches.map((batch) => callBatch(batch)));

    // Aggregate results
    let totalUploaded = 0;
    let totalFailed = 0;
    const allResults: any[] = [];
    const allErrors: string[] = [];

    settled.forEach((result, idx) => {
      const batchSize = batches[idx]?.length ?? 1;
      if (result.status === "fulfilled") {
        const data = result.value;
        // Support both report-style and flat responses
        const uploaded = data?.report?.uploaded ?? data?.uploaded ?? batchSize;
        const failed   = data?.report?.failed   ?? data?.failed   ?? 0;
        totalUploaded += uploaded;
        totalFailed   += failed;
        if (data?.results) allResults.push(...data.results);
        if (data?.error || data?.message) allErrors.push(data.error || data.message);
      } else {
        // Entire batch call rejected
        totalFailed += batchSize;
        allErrors.push((result as PromiseRejectedResult).reason?.message || "Unknown error");
      }
    });

    const mergedResponse = {
      report: { uploaded: totalUploaded, failed: totalFailed },
      results: allResults,
      ...(allErrors.length > 0 && { error: allErrors[0], message: allErrors[0] }),
    };

    return { mergedResponse, totalUploaded, totalFailed };
  };

  /**
   * Shared dispatcher called by all three export entry-points.
   * Fires concurrent export, then writes result back into Redux state.
   */
  const dispatchConcurrentExport = async (
    platform: string,
    vGroups: any[],
    standalones: any[],
    connectionDetails: Parameters<typeof runConcurrentExport>[2]
  ) => {
    const batches = buildExportBatches(vGroups, standalones);
    if (batches.length === 0) return;

    dispatch(setExportLoading());
    try {
      const { mergedResponse, totalFailed } = await runConcurrentExport(platform, batches, connectionDetails);
      dispatch(setExportResult({ response: mergedResponse, failed: totalFailed }));
    } catch (err: any) {
      dispatch(setExportResult({ response: { error: err?.message }, failed: 1 }));
    }
  };

  // Handle variant selection confirmation
  const handleVariantConfirm = async (selections: { primary: any; variants: any[] }[]) => {
    
    setVariantModalVisible(false);
    
    // Build the variant groups expected by buildExportBatches:
    // each selection → one group whose products = [primary, ...variants]
    const formattedGroups = selections.map((group) => ({
      products: [
        ...(group.primary ? [{ ...group.primary, primaryItem: true }] : []),
        ...group.variants.map((v) => ({ ...v, primaryItem: false })),
      ],
    }));

    // Standalone products (not part of any variant group)
    const formattedStandalones = standaloneProducts.map((p) => ({ ...p, primaryItem: true }));

    if (pendingExportPlatform === "WooCommerce") {
      await dispatchConcurrentExport("WooCommerce", formattedGroups, formattedStandalones, {
        woocommerce: { domainName: wordpressConnectionId },
      });
    } else if (pendingExportPlatform === "Shopify" && shopifyConnectionData) {
      await dispatchConcurrentExport("Shopify", formattedGroups, formattedStandalones, {
        shopify: shopifyConnectionData,
      });
    } else if (pendingExportPlatform === "Wix" && wixConnectionData) {
      await dispatchConcurrentExport("Wix", formattedGroups, formattedStandalones, {
        wix: wixConnectionData,
      });
    } else if (pendingExportPlatform === "Squarespace") {
      const validToken = await getValidSquarespaceToken();
      if (!validToken) { setPendingExportPlatform(null); return; }
      await dispatchConcurrentExport("Squarespace", formattedGroups, formattedStandalones, {
        squarespace: {
          access_token: validToken,
          sessionId: cookies.Session || "",
          accountKey: accountKey || localStorage.getItem('squarespace_account_key') || "",
          variant: true,
        },
      });
    }
    
    setPendingExportPlatform(null);
  };

  // Handle skipping variant configuration (export as individual standalone products — one call each)
  const handleSkipVariants = async () => {
    
    setVariantModalVisible(false);

    // Each selected product is treated as a standalone → one call per product
    const standalones = inventorySelection.map((p: any) => ({ ...p, primaryItem: true }));

    if (pendingExportPlatform === "WooCommerce") {
      await dispatchConcurrentExport("WooCommerce", [], standalones, {
        woocommerce: { domainName: wordpressConnectionId },
      });
    } else if (pendingExportPlatform === "Shopify" && shopifyConnectionData) {
      await dispatchConcurrentExport("Shopify", [], standalones, {
        shopify: shopifyConnectionData,
      });
    } else if (pendingExportPlatform === "Wix" && wixConnectionData) {
      await dispatchConcurrentExport("Wix", [], standalones, {
        wix: wixConnectionData,
      });
    } else if (pendingExportPlatform === "Squarespace") {
      const validToken = await getValidSquarespaceToken();
      if (!validToken) { setPendingExportPlatform(null); return; }
      await dispatchConcurrentExport("Squarespace", [], standalones, {
        squarespace: {
          access_token: validToken,
          sessionId: cookies.Session || "",
          accountKey: accountKey || localStorage.getItem('squarespace_account_key') || "",
          variant: false,
        },
      });
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

      // No variants — each product gets its own concurrent call
      await dispatchConcurrentExport("WooCommerce", [], inventorySelection.map((p: any) => ({ ...p, primaryItem: true })), {
        woocommerce: { domainName: wordpressConnectionId },
      });
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
  
      // No variants — each product gets its own concurrent call
      await dispatchConcurrentExport("Shopify", [], inventorySelection.map((p: any) => ({ ...p, primaryItem: true })), {
        shopify: shopifyConnectionData,
      });
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

      // No variants — each product gets its own concurrent call
      await dispatchConcurrentExport("Wix", [], inventorySelection.map((p: any) => ({ ...p, primaryItem: true })), {
        wix: wixConnectionData,
      });
    }
    else if (imgname === "Wix" && wixConnected === "Disconnected") {
      notificationApi.error({
        message: "Wix Not Connected",
        description: `Please connect to Wix to export products`,
      });
    }
    // Handle Squarespace Export
    else if (imgname === "Squarespace" && squarespaceConnected === "Connected") {
      const exportedProducts = inventorySelection.filter(
        (product: any) => product.third_party_integrations?.squarespace_product_id
      );

      if (exportedProducts.length > 0) {
        notificationApi.warning({
          message: "Products Already Exported",
          description: `${exportedProducts.length} product(s) have already been exported to Squarespace. Please select only unexported products.`,
        });
        return;
      }

      const validToken = await getValidSquarespaceToken();
      if (!validToken) {
        return;
      }

      const { hasVariants: hasSqVariants, variantGroups: detectedSqVariants, standaloneProducts: detectedSqStandalones } = detectProductsWithVariants(inventorySelection);
      if (hasSqVariants) {
        setVariantGroups(detectedSqVariants);
        setStandaloneProducts(detectedSqStandalones);
        setPendingExportPlatform("Squarespace");
        setVariantModalVisible(true);
        return;
      }

      // No variants — each product gets its own concurrent call
      await dispatchConcurrentExport("Squarespace", [], inventorySelection.map((p: any) => ({ ...p, primaryItem: true })), {
        squarespace: {
          access_token: validToken,
          sessionId: cookies.Session || "",
          accountKey: accountKey || localStorage.getItem('squarespace_account_key') || "",
          variant: false,
        },
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
      // Use the report object from the API response for accurate counts
      const report = exportResponse?.report;
      const uploaded = report?.uploaded ?? inventorySelection.length;
      const failed   = report?.failed   ?? 0;

      const errorMsg =
        exportResponse?.results?.find((r: any) => r.error || r.message || r.reason)?.error ||
        exportResponse?.results?.find((r: any) => r.error || r.message || r.reason)?.message ||
        exportResponse?.results?.find((r: any) => r.error || r.message || r.reason)?.reason ||
        exportResponse?.message ||
        exportResponse?.error ||
        "";

      if (failed > 0 && uploaded > 0) {
        // Partial success — some exported, some failed
        notificationApi.warning({
          message: "Products Partially Exported",
          description: `${uploaded} product(s) exported successfully, ${failed} product(s) failed to export.${errorMsg ? ` (${errorMsg})` : ""}`,
        });
      } else if (failed > 0 && uploaded === 0) {
        // All failed
        notificationApi.error({
          message: "Products Export Failed",
          description: `${failed} product(s) failed to export.${errorMsg ? ` Reason: ${errorMsg}` : ""}`,
        });
      } else {
        // All succeeded
        notificationApi.success({
          message: "Products Exported Successfully",
          description: `${uploaded} product(s) exported successfully.`,
        });
      }

      onClose();
      dispatch(inventorySelectionClean());
      setSelected(null);
      // Re-fetch the inventory list so updated third_party_integrations are shown without a page reload
      if (onExportSuccess) {
        onExportSuccess();
      }
      dispatch(resetStatus());
    } else if (exportStatus === "error") {
      const report = exportResponse?.report;
      const failed = report?.failed ?? inventorySelection.length;
      const errorMsg =
        exportResponse?.results?.find((r: any) => r.error || r.message || r.reason)?.error ||
        exportResponse?.results?.find((r: any) => r.error || r.message || r.reason)?.message ||
        exportResponse?.results?.find((r: any) => r.error || r.message || r.reason)?.reason ||
        exportResponse?.message ||
        exportResponse?.error ||
        "";
      notificationApi.error({
        message: "Products Export Failed",
        description: `${failed} product(s) failed to export.${errorMsg ? ` Reason: ${errorMsg}` : ""}`,
      });
      dispatch(resetStatus());
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
      let localSqToken = localStorage.getItem('squarespace_token') || localStorage.getItem('squarespace_access_token');
      if (squarespaceObj?.name || localSqToken) {
        setSquarespaceConnected("Connected");
        let accessToken = localSqToken || squarespaceObj?.id || "";
        if (!accessToken && squarespaceObj?.data) {
          try {
            const sqData = JSON.parse(squarespaceObj.data || "{}");
            accessToken = sqData.access_token || sqData.token || "";
          } catch {
            accessToken = "";
          }
        }
        if (accessToken) {
          setSquarespaceConnectionData({ access_token: accessToken });
        } else {
          setSquarespaceConnectionData(null);
        }
      } else {
        setSquarespaceConnected("Disconnected");
        setSquarespaceConnectionData(null);
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
