import React, { CSSProperties, useEffect, useState } from "react";
import { Empty, message, Skeleton, Space, Spin, notification } from "antd";
import { Typography } from "antd";
import FilterSortModal from "../components/FilterSortModal";
import { FileSearchOutlined, SortDescendingOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store";
import { remove, find } from "lodash";
import wordpress from "../assets/images/wordpress-svgrepo-com (1).svg";
import {
  exportOrders,
  updateVirtualInventory,
} from "../store/features/InventorySlice";
import {
  listVirtualInventory,
  inventorySelectionUpdate,
  inventorySelectionDelete,
  inventorySelectionClean,
} from "../store/features/InventorySlice";
import { ecommerceConnectorExport } from "../store/features/ecommerceSlice";
import HTMLReactParser from "html-react-parser";
import { useLocation } from "react-router-dom";
import ExportModal from "../components/ExportModal";
import { AddProductToOrder } from "../store/features/orderSlice";
let userInfoMultiselectOptions = true;


/**
 * ****************************************************************** Outer Function **********************************************************
 */

const { Text } = Typography;
const IMAGE_STYLES: CSSProperties = {
  width: 300,
  height: 300,
};

interface ImageType {
  public_thumbnail_uri?: string;
  sku?: string;
  public_preview_uri?: string;
  isSelected?: false;
  title?: string;
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
  const [open, setOpen] = useState(false);
  const [spinLoader, setSpinLoader] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  let listVirtualInventoryData = useAppSelector(
    (state) => state.Inventory.listVirtualInventory?.data
  )?.map((data) => {
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
  // const [images, setImages] = useState<Array<ImageType>>([]);
  const [imgData, setImgData] = useState({});
  const [referrerImages, setReferrerImages] = useState<
    Array<String | undefined>
  >([]);
  const [images, setImages] = useState<Array<ImageType>>([]);
  // const [messageApi, contextHolder] = message.useMessage();
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

  const exportToWPInv = () => {
    setOpenExport(true);
  };

  const exportToWP = () => {
    if (spinLoader) return false;
    setSpinLoader(true);
    // let guids = referrer.fileSelected.map((image: { guid: string })=>image.sku);
    // printImagesDataFn({guids});
    // // window.open(`https://finerworks.com/apps/orderform/post.aspx?guids=${guids}`, "_blank")
  };
  console.log("currentOrderFullFillmentId", currentOrderFullFillmentId);

  const handleSelect = (skuObj: any) => {
    console.log("inventorySelection", inventorySelection);
    console.log("sku", skuObj);
    console.log("referrerImages", referrerImages);

    listVirtualInventoryData = listVirtualInventoryData.map((data) => {
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

  const exportInventoryFn = () => {
    if (inventorySelection.length) {
      dispatch(
        ecommerceConnectorExport({
          products: inventorySelection,
        })
      );
    }
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
  const AddProduct = () => {
    dispatch(AddProductToOrder(productData));
    dispatch(inventorySelectionClean());
    onClose();
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
    <div className="relative">
      <div className="fixed1">
        <div className=" flex flex-row p-5 mr-5">
          <div id="docsearch" className=" hidden md:flex ml-4 basis-11/12">
            <button
              type="button"
              className="DocSearch DocSearch-Button"
              aria-label="Search"
              onClick={() => setOpenFilter(true)}
            >
              <span className="DocSearch-Button-Container flex flex-row">
                {/* <svg
                width="20"
                height="20"
                className="DocSearch-Search-Icon"
                viewBox="0 0 20 20"
              >
                <path
                  d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
                  stroke="currentColor"
                  fill="none"
                  fill-rule="evenodd"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </svg> */}
                <FileSearchOutlined
                  className="mr-5 "
                  style={{ fontSize: "20px" }}
                />
                <span className="border-l-2"></span>
                <SortDescendingOutlined
                  className="ml-5"
                  style={{ fontSize: "20px" }}
                />
                <span className="mr-10 DocSearch-Button-Placeholder"></span>
              </span>
            </button>
          </div>
          {!!inventorySelection.length && (
            <div
              // onClick={exportToWPInv}
              className="fw-sky-btn mr-4 basis-1/12 max-md:row-1 max-md:col-span-4 max-md:relative"
            >
              <Spin spinning={spinLoader} size="small">
                {location.pathname === "/virtualinventory" ? (
                  <button
                    type="button"
                    onClick={() => exportInventory()}
                    className="  
                            "
                  >
                    {"Export"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => AddProduct()}
                    className="  
                            "
                  >
                    {"Add to Cart"}
                  </button>
                )}
              </Spin>
            </div>
          )}
        </div>
      </div>
      <div className="grid max-sm:grid-cols-1 max-xl:grid-cols-2 grid-cols-4 gap-8 p-8 max-md:pt-20 content-center">
        {contextHolder}
        {listVirtualInventoryLoader ? (
          <div className="center-div1  md:col-span-4">
            <Space size={"large"} className="text-center" wrap>
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
            </Space>
            <Space className="pt-4 text-center" size={"large"} wrap>
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
            </Space>
            <Space className="pt-4 text-center" size={"large"} wrap>
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
              <Skeleton.Image style={IMAGE_STYLES} active />
            </Space>
          </div>
        ) : listVirtualInventoryData &&
          Object.keys(listVirtualInventoryData).length ? (
          <>
            {listVirtualInventoryData.map((image, i) => (
              <div
                key={i}
                className={`border rounded-lg shadow-lg   border-gray-100 ${
                  image?.isSelected ||
                  (inventorySelection?.length &&
                    find(inventorySelection, { sku: image?.sku }))
                    ? // inventorySelection.includes(image?.sku)
                      "isSelectedImg"
                    : ""
                }`}
              >
                <div
                  onClick={() => handleSelect(image)}
                  className="min-h-[300px] flex justify-center items-center relative"
                >
                  <div className="">
                    <img
                      className={`m-2 min-h-[200px] cursor-pointer  max-w-[200px]   object-contain    `}
                      src={image.image_url_1}
                      alt=""
                    />
                  </div>
                  {image?.third_party_integrations?.woocommerce_product_id ? (
                    <img
                      src={wordpress}
                      alt=""
                      className="absolute top-0 right-0 w-8 h-8"
                    />
                  ) : null}
                </div>
                <div className="flex relative w-full justify-center pb-2">
                  <div className="text-sm pt-2">
                    {/* <Text
                                        style={{ width: 100 } }
                                        ellipsis={{ tooltip: image.title } }
                                      >
                                        {image.title}
                                      </Text> */}
                  </div>
                  <div>
                    {/* <svg onClick={() => {
                                        setOpen(true)
                                        setImgData(image)

                                        
                                    }}  className="absolute cursor-pointer right-0 bottom-0  w-5 h-5 mb-2 mr-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h2v5m-2 0h4M9.408 5.5h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                    </svg> */}
                  </div>
                  <div>
                    <h2 className="px-4">{image.name}</h2>
                    <h2 className="px-4">SKU - {image.sku}</h2>
                    <div className="px-4">
                      {HTMLReactParser(image.description_long)}
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
      </div>
    </div>
  );
};

export default VirtualInventory;
