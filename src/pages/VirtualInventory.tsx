import React, { useEffect, useState } from "react";
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
}

const VirtualInventory: React.FC<VirtualInventoryProps> = ({ onClose }): JSX.Element => { 
  const location = useLocation();
  console.log("location", location.pathname);
  const [spinLoader, setSpinLoader] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  let listVirtualInventoryData = useAppSelector(
    (state) => state.Inventory.listVirtualInventory?.data
  )?.map((data: any) => {
    return { ...data, ...{ isSelected: false } };
  });
  const currentOrderFullFillmentId = useAppSelector(
    (state) => state.order.currentOrderFullFillmentId
  );
  const listVirtualInventoryLoader = useAppSelector(
    (state) => state.Inventory.listVirtualInventoryLoader
  );
  const ecommerceConnectorExportInfo = useAppSelector(
    (state) => state.Ecommerce.ecommerceConnectorExportInfo
  );
  console.log("listVirtualInventoryData", listVirtualInventoryData);
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

    listVirtualInventoryData = listVirtualInventoryData.map((data: any) => {
      if (data.sku === skuObj.sku) {
        if (find(inventorySelection, { sku: skuObj?.sku }))
          dispatch(inventorySelectionDelete(skuObj));
        else dispatch(inventorySelectionUpdate(skuObj));
        setProductData({
          skuCode: skuObj.sku,
          productCode: "",
          orderFullFillmentId: currentOrderFullFillmentId,
        });

        return { ...data, ...{ isSelected: !data.isSelected } };
      } else return data;
    });

    console.log(
      "handleSelect listVirtualInventoryData",
      listVirtualInventoryData
    );
  };

  const exportInventory = () => {
    setOpenExport(true);
  };

  const listInventory = () => {
    dispatch(
      listVirtualInventory({
        search_filter: "",
        sort_field: "id",
        sort_direction: "DESC",
        per_page: 12,
      })
    );
    // dispatch(
    //   updateVirtualInventory({
    //     data: listVirtualInventoryData,
    //   })
    // );
  };
  const [productData, setProductData] = useState({
    skuCode: "",
    productCode: "",
    orderFullFillmentId: "",
  });
  
  // Quick filter states
  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [perPage, setPerPage] = useState(12);

  const AddProduct = () => {
    dispatch(AddProductToOrder(productData));
    dispatch(inventorySelectionClean());
    onClose();
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

  // Apply filters function
  const applyFilters = () => {
    dispatch(
      listVirtualInventory({
        search_filter: searchFilter,
        sort_field: sortField,
        sort_direction: sortDirection,
        per_page: perPage,
      })
    );
  };

  useEffect(() => {
    listInventory();
  }, []);

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
      listInventory();
    }
  }, [ecommerceConnectorExportInfo]);
  console.log("listVirtualInventoryData", listVirtualInventoryData);
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
      <div className="fixed1">
        {/* Quick Filters Bar */}
        <div className="bg-white shadow-sm sticky top-16 z-10 border-b border-gray-200 ml-20">
          <div className="p-4 space-y-4 max-w-7xl mx-auto">
            {/* First Row - Search and Selection Count */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by name, title or description..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
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

              {/* Items Per Page */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Show:</label>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value={50}>50</option>
                  <option value={25}>25</option>
                  <option value={15}>15</option>
                  <option value={12}>12</option>
                  <option value={10}>10</option>
                  <option value={8}>8</option>
                  <option value={6}>6</option>
                </select>
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
        </div>
      </div>
      <div className="flex flex-col gap-4 p-8 max-md:pt-20 max-w-7xl mx-auto w-full ml-20">
        {contextHolder}
        {listVirtualInventoryLoader ? (
          <div className="flex flex-col gap-4">
            <Skeleton.Button active block style={{ height: '140px' }} />
            <Skeleton.Button active block style={{ height: '140px' }} />
            <Skeleton.Button active block style={{ height: '140px' }} />
            <Skeleton.Button active block style={{ height: '140px' }} />
            <Skeleton.Button active block style={{ height: '140px' }} />
          </div>
        ) : listVirtualInventoryData &&
          Object.keys(listVirtualInventoryData).length ? (
          <>
            {listVirtualInventoryData.map((image: any, i: number) => (
              <div
                key={i}
                onClick={() => handleSelect(image)}
                className={`bg-white border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
                  image?.isSelected ||
                  (inventorySelection?.length &&
                    find(inventorySelection, { sku: image?.sku }))
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
                        {/* Display description_long as priority, then labels */}
                        <div className="mt-2">
                          {/* Priority: description_long */}
                          {image.description_long && (
                            <div className="text-sm text-gray-600 line-clamp-3 mb-2">
                              {HTMLReactParser(image.description_long)}
                            </div>
                          )}
                          
                          {/* Additional: Display labels (skip first label which is SKU) */}
                          {image.labels && Array.isArray(image.labels) && image.labels.length > 1 && (
                            <div className="text-sm text-gray-600 space-y-1 border-t pt-2">
                              {image.labels.slice(1).map((label: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-semibold text-xs">{label.key}:</span>
                                  <span className="text-xs">{label.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges Section */}
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
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
            ))}
          </>
        ) : (
          <Empty />
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
