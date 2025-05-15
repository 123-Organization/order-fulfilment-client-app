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
import { exportOrders } from "../store/features/InventorySlice";
import { useNotificationContext } from "../context/NotificationContext";
import { inventorySelectionClean } from "../store/features/InventorySlice";
import { resetStatus } from "../store/features/InventorySlice";
import Spinner from "./Spinner";

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
  const [selected, setSelected] = useState<string | null>(null);
  const notificationApi = useNotificationContext();
  const exportResponse = useAppSelector(
    (state) => state.Inventory.exportResponse
  );

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

  const handleExport = async (imgname: string) => {
    if (imgname === "WooCommerce") {
      // Get the list of already exported products
      const exportedProducts = inventorySelection.filter(
        (product) => product.third_party_integrations?.woocommerce_product_id
      );
  
      if (exportedProducts.length > 0) {
        notificationApi.warning({
          message: "Products Already Exported",
          description: `${exportedProducts.length} product(s) have already been exported to WooCommerce. Please select only unexported products.`,
        });
        return;
      }
  
      // If no products have been exported, proceed with the export
      await dispatch(exportOrders({ data: inventorySelection }));
      dispatch(resetStatus())
    }
  };

  useEffect(() => {
    if (exportStatus === "success") {
      notificationApi.success({
        message: "Products Exported Successfully",
        description: `${exportResponse?.data?.products_imported} products exported  `,
      });
      onClose();
      dispatch(inventorySelectionClean());
      setSelected(null);
      listInventory()
    }
  }, [exportStatus, notificationApi]);

  const handleSelection = (name: string) => {
    if (selected === name) {
      setSelected(null);
    } else {
      setSelected(name);
    }
  };

  console.log("exportStatus", exportStatus);

  return (
    <Modal
      title="Select Export option"
      visible={visible}
      width={"55%"}
      onCancel={onClose}
      onOk={() => selected && handleExport(selected)}
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
              {images.map((image, index) => (
                <div
                  key={index}
                  className="flex w-1/3 max-sm:w-1/2 max-[400px]:w-full flex-wrap"
                >
                  <div
                    className="w-full md:p-2 flex flex-col items-center"
                    onClick={() => importData(image.name)}
                  >
                    {image.name === "WooCommerce" && (
                      <Tag className="absolute ml-12 -mt-3" color="#52c41a">
                        Connected
                      </Tag>
                    )}
                    <img
                      onClick={() => handleSelection(image.name)}
                      className={`block h-[100px] w-[100px] border-2 cursor-pointer rounded-lg object-cover object-center ${
                        selected === image.name
                          ? "border-blue-500"
                          : "border-gray-300"
                      } ${
                        image.name === "WooCommerce"
                          ? "grayscale-100"
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
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExportModal;
