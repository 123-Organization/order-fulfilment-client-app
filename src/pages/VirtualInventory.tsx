import React, { useEffect, useState, useRef, useCallback } from "react";
import { Empty, Skeleton, Spin, notification } from "antd";
import FilterSortModal from "../components/FilterSortModal";
import { useAppDispatch, useAppSelector } from "../store";
import { find } from "lodash";
import wordpress from "../assets/images/wordpress-svgrepo-com (1).svg";
import {
  listVirtualInventory,
  inventorySelectionUpdate,
  inventorySelectionDelete,
  inventorySelectionClean,
  updateVirtualInventory,
} from "../store/features/InventorySlice";
import HTMLReactParser from "html-react-parser";
import { useLocation } from "react-router-dom";
import ExportModal from "../components/ExportModal";
import EditInventoryModal from "../components/EditInventoryModal";
import { AddProductToOrder } from "../store/features/orderSlice";


/**
 * ****************************************************************** Outer Function **********************************************************
 */

interface NotificationAlertProps {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  description: string;
}
/**
 * ****************************************************************** Function Components *******************************************************
 */

interface VirtualInventoryProps {
  onClose: () => void;
  onProductAdded?: () => void;
}

const VirtualInventory: React.FC<VirtualInventoryProps> = ({ onClose, onProductAdded }): JSX.Element => { 
  const location = useLocation();
  console.log("location", location.pathname);
  const [spinLoader, setSpinLoader] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Infinite scroll states
  const [currentPage, setCurrentPage] = useState(1);
  const [allInventoryData, setAllInventoryData] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Accordion state for descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  
  // Recently edited product tracking (for showing badge)
  const [recentlyEditedSku, setRecentlyEditedSku] = useState<string | null>(null);
  
  // Smart search bar states
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get raw response from Redux
  const listVirtualInventoryResponse = useAppSelector(
    (state) => state.Inventory.listVirtualInventory
  );
  const currentOrderFullFillmentId = useAppSelector(
    (state) => state.order.currentOrderFullFillmentId
  );
  const listVirtualInventoryLoader = useAppSelector(
    (state) => state.Inventory.listVirtualInventoryLoader
  );
  const ecommerceConnectorExportInfo = useAppSelector(
    (state) => state.Ecommerce.ecommerceConnectorExportInfo
  );
  const inventorySelection = useAppSelector(
    (state) => state.Inventory.inventorySelection
  );
  const dispatch = useAppDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = ({
    type,
    message,
    description,
  }: NotificationAlertProps) => {
    api[type]({
      message,
      description,
    });
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the item when copying
    navigator.clipboard.writeText(text).then(() => {
      notification.success({
        message: 'Copied!',
        description: `${label} "${text}" copied to clipboard`,
        placement: 'topRight',
        duration: 2,
      });
    }).catch((err) => {
      notification.error({
        message: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        placement: 'topRight',
        duration: 2,
      });
    });
  };

  console.log("currentOrderFullFillmentId", currentOrderFullFillmentId);

  const handleSelect = (skuObj: any) => {
    console.log("inventorySelection", inventorySelection);
    console.log("sku", skuObj);

    setAllInventoryData((prevData) => 
      prevData.map((data: any) => {
        if (data.sku === skuObj.sku) {
          if (find(inventorySelection, { sku: skuObj?.sku }))
            dispatch(inventorySelectionDelete(skuObj));
          else dispatch(inventorySelectionUpdate(skuObj));
          setProductData({
            skuCode: skuObj.sku,
            productCode: "",
            orderFullFillmentId: currentOrderFullFillmentId,
          });

          return { ...data, isSelected: !data.isSelected };
        } else return data;
      })
    );
  };

  const exportInventory = () => {
    setOpenExport(true);
  };

  const [productData, setProductData] = useState({
    skuCode: "",
    productCode: "",
    orderFullFillmentId: "",
  });
  
  // Quick filter states - MUST be declared before listInventory function
  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState("updated");
  const [sortDirection, setSortDirection] = useState("DESC");

  const listInventory = useCallback((page: number = 1, resetData: boolean = false) => {
    if (resetData) {
      setAllInventoryData([]);
      setCurrentPage(1);
      setHasMore(true);
    }
    
    setIsLoadingMore(true);
    dispatch(
      listVirtualInventory({
        search_filter: searchFilter,
        sort_field: sortField,
        sort_direction: sortDirection,
        per_page: 20, // Fixed at 20 items per page
        page_number: page,
      })
    );
  }, [dispatch, searchFilter, sortField, sortDirection]);

  const AddProduct = () => {
    dispatch(AddProductToOrder(productData));
    dispatch(inventorySelectionClean());
    onClose();
    // Call the callback to refresh the parent's order list
    if (onProductAdded) {
      setTimeout(() => {
        onProductAdded();
      }, 1000);
    }
  };

  // Open edit modal handler
  const handleEditProduct = (product: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the item when clicking edit
    setSelectedProduct(product);
    setOpenEditModal(true);
  };

  // Save edited product handler
  const handleSaveProduct = (updatedProduct: any) => {
    // TODO: Dispatch an action to update the product in the backend/state
    // For now, we'll just log it. You'll need to create an action in InventorySlice
    console.log('Updated Product:', updatedProduct);
    
    // You can add your API call here to save the changes
    // Example: dispatch(updateVirtualInventoryProduct(updatedProduct));
    
    // Refresh the list after update
    listInventory();
  };

  // Toggle description expansion
  const toggleDescription = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sku)) {
        newSet.delete(sku);
      } else {
        newSet.add(sku);
      }
      return newSet;
    });
  };

  // Extract GUID from image URL
  const extractGuidFromImageUrl = (imageUrl: string): string | null => {
    if (!imageUrl) return null;
    
    // Match pattern: buynow-{guid}.png
    const match = imageUrl.match(/buynow-([a-f0-9-]+)\.png/i);
    return match ? match[1] : null;
  };

  // Handle edit product details on Finerworks
  const handleEditProductDetails = (product: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the item
    
    // Extract GUID from image URL
    const guid = extractGuidFromImageUrl(product.image_url_1);
    
    if (!guid) {
      notification.error({
        message: 'Error',
        description: 'Unable to extract product ID from image URL',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    
    // Store the ENTIRE product object in localStorage so we can show it at the top when user returns
    console.log('💾 Saving edited product to localStorage:', product.sku);
    localStorage.setItem('recentlyEditedProductSku', product.sku);
    localStorage.setItem('recentlyEditedProductData', JSON.stringify(product));
    localStorage.setItem('recentlyEditedProductTimestamp', Date.now().toString());
    
    // Use current page URL as return destination
    const returnUrl = encodeURIComponent(window.location.href);
    
    // Build the Finerworks edit URL and navigate directly
    const editUrl = `https://finerworks.com/apps/orderform/post4.aspx?mode=store&guid=${guid}&ReturnUrl=${returnUrl}`;
    
    // Navigate to the edit page
    window.location.href = editUrl;
  };

  // Apply filters function
  const applyFilters = () => {
    setCurrentPage(1);
    setAllInventoryData([]);
    setHasMore(true);
    listInventory(1, true);
  };

  // Scroll detection for smart search bar
  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
          
          // Collapse search bar when scrolling down past 100px (but keep expanded state if user opened it)
          if (currentScrollY > 100 && currentScrollY > lastScrollY) {
            setIsSearchCollapsed(true);
            // Don't auto-close if user manually expanded it - let them close it with the X button
          }
          // Show full search bar when at top
          else if (currentScrollY < 50) {
            setIsSearchCollapsed(false);
            setIsSearchExpanded(false);
          }
          
          lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Attach scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle search icon click to expand
  const handleSearchIconClick = () => {
    console.log('🔍 Search button clicked, expanding...');
    setIsSearchExpanded(true);
    setTimeout(() => {
      console.log('🎯 Focusing search input');
      searchInputRef.current?.focus();
    }, 100);
  };

  // Handle search blur to collapse if empty
  const handleSearchBlur = () => {
    if (!searchFilter && isSearchCollapsed) {
      setTimeout(() => {
        setIsSearchExpanded(false);
      }, 200);
    }
  };

  // Handle closing expanded search
  const handleCloseSearch = () => {
    setIsSearchExpanded(false);
  };

  // Check for recently edited product on mount AND when page becomes visible
  useEffect(() => {
    let hasChecked = false; // Prevent duplicate checks
    
    const checkForEditedProduct = async () => {
      if (hasChecked) {
        console.log('⏭️ Already checked for edited product, skipping...');
        return;
      }
      hasChecked = true;
      
      const editedSku = localStorage.getItem('recentlyEditedProductSku');
      const editedProductJson = localStorage.getItem('recentlyEditedProductData');
      const timestamp = localStorage.getItem('recentlyEditedProductTimestamp');
      
      console.log('🔎 Checking for edited product... SKU:', editedSku, 'Has data:', !!editedProductJson);
      
      if (editedSku && editedProductJson && timestamp) {
        // Check if edit happened within last 5 minutes (300000 ms)
        const timeSinceEdit = Date.now() - parseInt(timestamp);
        if (timeSinceEdit < 300000) {
          console.log('🎨 Detected recently edited product:', editedSku);
          
          try {
            // Parse the saved product data
            const savedProduct = JSON.parse(editedProductJson);
            console.log('✅ Retrieved saved product data:', savedProduct.name);
            
            // Call API to update the product's timestamp in the database
            console.log('🔄 Calling API to update product timestamp...');
            
            // Get current date/time in ISO format
            const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', 'T');
            console.log('📅 Current date/time:', currentDateTime);
            
            const updatePayload = {
              data: [{
                sku: savedProduct.sku,
                asking_price: parseFloat(savedProduct.asking_price) || 0,
                name: savedProduct.name,
                description: savedProduct.description_long || '',
                quantity_in_stock: parseInt(savedProduct.quantity_in_stock) || 0,
                updated: currentDateTime,
              }]
            };
            
            // Dispatch the update action to refresh the timestamp
            await dispatch(updateVirtualInventory(updatePayload));
            
            console.log('✅ Product timestamp updated successfully');
            
            // Set the recently edited SKU to show the badge
            setRecentlyEditedSku(editedSku);
            
            // Show welcome back notification
            console.log('🔔 Showing welcome back notification');
            notification.success({
              message: 'Welcome Back!',
              description: 'Your edited product appears at the top of the list.',
              placement: 'topRight',
              duration: 5,
            });
            
            // Clear localStorage immediately since we've updated the DB
            localStorage.removeItem('recentlyEditedProductSku');
            localStorage.removeItem('recentlyEditedProductData');
            localStorage.removeItem('recentlyEditedProductTimestamp');
            
            // Reload the list to get the updated product at the top
            console.log('📍 Reloading inventory list...');
            setCurrentPage(1);
            setAllInventoryData([]);
            listInventory(1, true);
            
            // Clear the badge after 30 seconds
            setTimeout(() => {
              console.log('⏰ Clearing edited product badge');
              setRecentlyEditedSku(null);
            }, 30000);
            
          } catch (error) {
            console.error('❌ Error updating product timestamp:', error);
            // Clear localStorage on error
            localStorage.removeItem('recentlyEditedProductSku');
            localStorage.removeItem('recentlyEditedProductData');
            localStorage.removeItem('recentlyEditedProductTimestamp');
            if (allInventoryData.length === 0) {
              listInventory(1, true);
            }
          }
        } else {
          // Too old, clear it
          console.log('⏰ Edit too old, clearing...');
          localStorage.removeItem('recentlyEditedProductSku');
          localStorage.removeItem('recentlyEditedProductData');
          localStorage.removeItem('recentlyEditedProductTimestamp');
          if (allInventoryData.length === 0) {
            listInventory(1, true);
          }
        }
      } else if (allInventoryData.length === 0) {
        // No edited product, load normally only if no data
        console.log('📋 No edited product, loading normally...');
        listInventory(1, true);
      }
    };

    // Check on mount
    checkForEditedProduct();
    
    // Also check when page becomes visible (when returning from external link)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, checking for edited product...');
        checkForEditedProduct();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Process API response and accumulate data
  useEffect(() => {
    if (listVirtualInventoryResponse?.data && listVirtualInventoryResponse?.status) {
      const newData = listVirtualInventoryResponse.data.map((data: any) => ({
        ...data,
        isSelected: false,
      }));

      setAllInventoryData((prevData) => {
        let dataToSet;
        
        // If it's page 1, replace; otherwise append
        if (currentPage === 1) {
          dataToSet = newData;
        } else {
          // Avoid duplicates by filtering out SKUs that already exist
          const existingSKUs = new Set(prevData.map((item: any) => item.sku));
          const uniqueNewData = newData.filter((item: any) => !existingSKUs.has(item.sku));
          dataToSet = [...prevData, ...uniqueNewData];
        }
        
        return dataToSet;
      });

      setTotalCount(listVirtualInventoryResponse.count || 0);
      
      // Check if there are more items to load
      const currentCount = currentPage === 1 ? newData.length : allInventoryData.length + newData.length;
      setHasMore(currentCount < (listVirtualInventoryResponse.count || 0));
      setIsLoadingMore(false);
    }
  }, [listVirtualInventoryResponse]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !listVirtualInventoryLoader) {
          // Load more when user scrolls near bottom
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          listInventory(nextPage, false);
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Trigger 100px before reaching the element
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, listVirtualInventoryLoader, currentPage, listInventory]);

  useEffect(() => {
    if (ecommerceConnectorExportInfo.status === 200 && spinLoader) {
      // ecommerceConnectorExportInfo.status=300
      openNotificationWithIcon({
        type: "success",
        message: "Success",
        description: `Import to Wordpress have been done successfully`,
      });
      setSpinLoader(false);
      //  window.location.reload()
      dispatch(inventorySelectionClean());
      listInventory(1, true);
    }
  }, [ecommerceConnectorExportInfo]);
  
  console.log("allInventoryData", allInventoryData);
  console.log("Total Count:", totalCount, "Current Count:", allInventoryData.length);
  console.log("🔍 Search State - Collapsed:", isSearchCollapsed, "Expanded:", isSearchExpanded);
  /**
   * ****************************************************************** JSX  ***************************************************************************
   */

  return (
    <div className="relative bg-gray-50 min-h-screen">
      {/* Hide bottom bar when modal is open */}
      {openEditModal && (
        <style>{`
          .fixed.bottom-6 {
            display: none !important;
          }
        `}</style>
      )}
      {/* Smart Collapsible Search Bar - Sticky positioned */}
      <div className={`bg-white shadow-md sticky top-0 border-b border-gray-200 transition-all duration-300 ${
        isSearchCollapsed && !isSearchExpanded ? 'py-3 px-4' : 'p-4'
      } ${location.pathname === "/virtualinventory" ? 'ml-20' : ''} ${
        openEditModal ? 'z-10 blur-sm pointer-events-none' : 'z-50'
      }`}>
          <div className="max-w-7xl mx-auto">
            {/* Collapsed State - Floating Search Icon */}
            {isSearchCollapsed && !isSearchExpanded && (
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleSearchIconClick}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm font-semibold">Search Products</span>
                </button>

                <div className="flex items-center gap-3">
                  {!!inventorySelection.length && (
                    <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {inventorySelection.length}
                    </div>
                  )}

                  {!!inventorySelection.length && (
                    <Spin spinning={spinLoader} size="small">
                      {location.pathname === "/virtualinventory" ? (
                        <button
                          type="button"
                          onClick={() => exportInventory()}
                          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all duration-200 hover:shadow-lg shadow-md"
                        >
                          Export
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => AddProduct()}
                          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all duration-200 hover:shadow-lg shadow-md"
                        >
                          Add
                        </button>
                      )}
                    </Spin>
                  )}
                </div>
              </div>
            )}

            {/* Expanded State - Full Search Bar */}
            {(!isSearchCollapsed || isSearchExpanded) && (
              <div className="space-y-4 animate-slideDown">
                {/* First Row - Search and Selection Count */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search by name, title or description..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                      onBlur={handleSearchBlur}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    
                    {/* Close button when expanded in collapsed mode */}
                    {isSearchExpanded && isSearchCollapsed && (
                      <button
                        onClick={handleCloseSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-all"
                        title="Close search"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {!!inventorySelection.length && (
                    <div className="bg-blue-100 text-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {inventorySelection.length} selected
                    </div>
                  )}

                  {!!inventorySelection.length && (
                    <Spin spinning={spinLoader} size="small">
                      {location.pathname === "/virtualinventory" ? (
                        <button
                          type="button"
                          onClick={() => exportInventory()}
                          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg"
                        >
                          Export
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => AddProduct()}
                          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg"
                        >
                          Add
                        </button>
                      )}
                    </Spin>
                  )}
                </div>

                {/* Second Row - Sort Options */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Sort By */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">Sort:</label>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="id">ID</option>
                      <option value="name">Name</option>
                      <option value="created_at">Created Date</option>
                      <option value="updated">Last Updated</option>
                    </select>
                  </div>

                  {/* Sort Direction */}
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setSortDirection("ASC")}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                        sortDirection === "ASC"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Asc
                    </button>
                    <button
                      onClick={() => setSortDirection("DESC")}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                        sortDirection === "DESC"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Desc
                    </button>
                  </div>

                  {/* Total Count Display */}
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg border border-blue-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">
                      {allInventoryData.length} of {totalCount} items
                    </span>
                  </div>

                  {/* Apply Filters Button */}
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </button>

                  {/* Advanced Filters Button */}
                  <button
                    onClick={() => setOpenFilter(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Advanced
                  </button>
                </div>
              </div>
            )}
          </div>
        

        {/* Custom CSS for animations */}
        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-slideDown {
            animation: slideDown 0.3s ease-out;
          }
          
          @keyframes pulse-slow {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.95;
              transform: scale(1.01);
            }
          }
          
          .animate-pulse-slow {
            animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </div>
      
      {/* Content Area */}
      <div className={`flex flex-col gap-4 p-8 max-md:pt-20 max-w-7xl mx-auto w-full ${location.pathname === "/virtualinventory" ? 'ml-20' : ''}`}>
        {contextHolder}
        {listVirtualInventoryLoader && currentPage === 1 ? (
          <div className="flex flex-col gap-4">
            <Skeleton.Button active block style={{ height: '140px' }} />
            <Skeleton.Button active block style={{ height: '140px' }} />
            <Skeleton.Button active block style={{ height: '140px' }} />
            <Skeleton.Button active block style={{ height: '140px' }} />
            <Skeleton.Button active block style={{ height: '140px' }} />
          </div>
        ) : allInventoryData && allInventoryData.length > 0 ? (
          <>
            {allInventoryData.map((image: any, i: number) => {
              const isRecentlyEdited = recentlyEditedSku === image.sku;
              const isSelected = image?.isSelected || (inventorySelection?.length && find(inventorySelection, { sku: image?.sku }));
              
              return (
              <div
                key={i}
                onClick={() => handleSelect(image)}
                className={`relative bg-white border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
                  isRecentlyEdited
                    ? "ring-4 ring-green-500 shadow-green-200 animate-pulse-slow"
                    : isSelected
                    ? "ring-4 ring-blue-500 shadow-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-row items-center gap-6 p-4">
                  {/* Image Section */}
                  <div className="relative flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-50 to-white rounded-lg flex items-center justify-center p-2">
                      <img
                        className="max-w-full max-h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                        src={image.image_url_1}
                        alt={image.name}
                      />
                    </div>
                    {(image?.isSelected ||
                      (inventorySelection?.length > 0 &&
                        find(inventorySelection, { sku: image?.sku }))) && (
                      <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full p-2 shadow-lg z-10">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-800 text-lg mb-2" title={image.name}>
                          {image.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                            <span>SKU:</span>
                            <span className="text-gray-700">{image.sku}</span>
                            <button
                              onClick={(e) => copyToClipboard(image.sku, 'SKU', e)}
                              className="p-1 hover:bg-gray-100 rounded transition-all duration-200 group"
                              title="Copy SKU"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          {image.asking_price && (
                            <p className="text-base font-semibold text-green-600">
                              ${parseFloat(image.asking_price).toFixed(2)}
                            </p>
                          )}
                          {image.product_code && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <span>Product Code:</span>
                              <span className="font-medium text-gray-700">
                                {image.product_code}
                              </span>
                              <button
                                onClick={(e) => copyToClipboard(image.product_code, 'Product Code', e)}
                                className="p-1 hover:bg-gray-100 rounded transition-all duration-200 group"
                                title="Copy Product Code"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {image.parent_sku && (
                          <div className="flex items-center gap-1.5 text-sm text-purple-600 font-medium mt-1">
                            <span>↳ Parent SKU: {image.parent_sku}</span>
                            <button
                              onClick={(e) => copyToClipboard(image.parent_sku, 'Parent SKU', e)}
                              className="p-1 hover:bg-purple-50 rounded transition-all duration-200 group"
                              title="Copy Parent SKU"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 group-hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {/* Display description_long as priority, then labels with accordion */}
                        <div className="mt-2">
                          {/* Priority: description_long */}
                          {image.description_long && (
                            <div className="mb-2">
                              <div 
                                className={`text-sm text-gray-600 overflow-hidden transition-all duration-300 ease-in-out ${
                                  expandedDescriptions.has(image.sku) ? 'max-h-[1000px]' : 'max-h-[60px]'
                                }`}
                              >
                                {HTMLReactParser(image.description_long)}
                              </div>
                            </div>
                          )}
                          
                          {/* Additional: Display labels (skip first label which is SKU) */}
                          {image.labels && Array.isArray(image.labels) && image.labels.length > 1 && (
                            <div 
                              className={`text-sm text-gray-600 space-y-1 border-t pt-2 overflow-hidden transition-all duration-300 ease-in-out ${
                                expandedDescriptions.has(image.sku) ? 'max-h-[1000px]' : 'max-h-[80px]'
                              }`}
                            >
                              {image.labels.slice(1).map((label: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-semibold text-xs">{label.key}:</span>
                                  <span className="text-xs">{label.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Show More/Less Button */}
                          {((image.description_long && image.description_long.length > 100) || 
                            (image.labels && image.labels.length > 4)) && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={(e) => toggleDescription(image.sku, e)}
                                className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-blue-600 text-sm font-medium transition-all duration-200 group hover:bg-gray-50 rounded-md"
                              >
                                <span className="text-xs">
                                  {expandedDescriptions.has(image.sku) ? 'Show less details' : 'Show more details'}
                                </span>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className={`h-4 w-4 transition-transform duration-300 ${
                                    expandedDescriptions.has(image.sku) ? 'rotate-180' : 'rotate-0'
                                  }`} 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges Section */}
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
                        {/* Action Buttons Row */}
                        <div className="flex gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={(e) => handleEditProduct(image, e)}
                            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all duration-200 group shadow-sm hover:shadow-md"
                            title="Edit Product"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-600 group-hover:text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          
                          {/* Edit Product Details Button */}
                          <button
                            onClick={(e) => handleEditProductDetails(image, e)}
                            className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 border border-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 group shadow-sm hover:shadow-md"
                            title="Edit Frame & Color Details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                              />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Recently Edited Badge */}
                        {isRecentlyEdited && (
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full px-3 py-1 shadow-lg text-xs font-bold animate-pulse flex items-center gap-1" title="You just edited this product!">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Just Edited
                          </div>
                        )}
                        
                        {image?.third_party_integrations?.woocommerce_product_id && (
                          <div className="bg-white border border-gray-200 rounded-full p-2 shadow-sm">
                            <img
                              src={wordpress}
                              alt="WordPress"
                              className="w-6 h-6"
                              title="Connected to WooCommerce"
                            />
                          </div>
                        )}
                        {image?.parent_sku && (
                          <div className="bg-purple-100 text-purple-700 rounded-full px-3 py-1 shadow-sm text-xs font-semibold" title={`Child of ${image.parent_sku}`}>
                            Child
                          </div>
                        )}
                        {image?.has_children && (
                          <div className="bg-green-100 text-green-700 rounded-full px-3 py-1 shadow-sm text-xs font-semibold" title="Has child images">
                            Parent
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
            
            {/* Infinite scroll loading indicator */}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center items-center py-8">
                {isLoadingMore && (
                  <div className="flex flex-col items-center gap-3">
                    <Spin size="large" />
                    <p className="text-gray-500 text-sm font-medium">Loading more products...</p>
                  </div>
                )}
              </div>
            )}
            
            {/* End of list indicator */}
            {!hasMore && allInventoryData.length > 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">You've reached the end of the list</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <Empty description="No products found" />
        )}
        <FilterSortModal openModel={openFilter} setOpen={setOpenFilter} />
        <ExportModal
          visible={openExport}
          onClose={() => setOpenExport(false)}
          inventorySelection={inventorySelection}
          listInventory={listInventory}
        />
        <EditInventoryModal
          visible={openEditModal}
          onClose={() => setOpenEditModal(false)}
          productData={selectedProduct}
          onSave={handleSaveProduct}
        />
      </div>
    </div>
  );
};

export default VirtualInventory;
