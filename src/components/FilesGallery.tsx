import React, { useEffect, useState, CSSProperties } from "react";
import { Modal, Empty, Skeleton, Pagination, Space, Button } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import { getInventoryImages } from "../store/features/orderSlice";
import Pin from "../assets/images/pin-svgrepo-com.svg";
import change from "../assets/images/change-svgrepo-com.svg";
import type { DataNode, TreeProps } from "antd/es/tree";
import style from "./Arrows.module.css";
import { DownOutlined } from "@ant-design/icons";
import { Tree } from "antd";

const treeData: DataNode[] = [
  {
    title: "My File Libraries",
    key: "0-0-0",
    icon: (
      <svg
        className="w-5 h-5 mb-2 text-gray-400 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5h6M9 8h6m-6 3h6M4.996 5h.01m-.01 3h.01m-.01 3h.01M2 1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z"
        />
      </svg>
    ),
    children: [
      { title: "Inventory", key: "inventory" },
      { title: "Temporary", key: "temporary" },
    ],
  },
];

export default function FilesGallery({
  open,
  setOpenModal,
  productImage,
  ProductName,
}) {
  const dispatch = useAppDispatch();
  const images = useAppSelector((state) => state.order.inventoryImages);
  const loading = useAppSelector(
    (state) => state.order.inventoryImages.loading
  ); // Assume loading state is tracked
  const error = useAppSelector((state) => state.order.error); // Assume error state is tracked
  console.log(images);
  const [selectedImage, setSelectedImage] = useState(null); // State to store selected image
  const [isConfirmPage, setIsConfirmPage] = useState(false); // State to toggle between gallery and confirm page
  const [selectedCategory, setSelectedCategory] = useState("inventory");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState("inventory");

  const IMAGE_STYLES: CSSProperties = {
    width: 200,
    height: 200,
  };
  const onChange = (page) => {
    setCurrentPage(page);
    dispatch(getInventoryImages({ library: selectedCategory, Page: page })); // Use selectedCategory here
  };
  const closeModal = () => setOpen(false);

  useEffect(() => {
    if (open) {
      dispatch(getInventoryImages({ library: images?.data?.library }));
      setSelectedImage(null); // Reset selection when modal opens
      setIsConfirmPage(false); // Start on gallery page
    }
  }, [open, dispatch]);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setIsConfirmPage(true); // Navigate to confirmation page
  };

  const handleBackToGallery = () => {
    setIsConfirmPage(false); // Return to gallery
    setSelectedImage(null); // Clear selection
  };

  const handleConfirm = () => {
    // Handle confirmation logic here, like updating state or closing the modal
    console.log("Confirmed image:", selectedImage);
    setOpen(false); // Close modal after confirming
  };
  const onClose = () => {
    setOpenModal(false);
  };
  const onSelect = (selectedKeys) => {
    setCurrentPage(1);
    const selectedLibrary = selectedKeys[0];

    setSelectedCategory(selectedLibrary); // Update the selected category
    setSelectedKey(selectedLibrary); // Set the selected key for styling
    dispatch(getInventoryImages({ library: selectedLibrary, Page: 1 })); // Fetch images based on selected category
    setSelectedImage(null);
    setIsConfirmPage(false);
  };

  useEffect(() => {
    if (open) {
      dispatch(getInventoryImages({ library: selectedCategory }));
      setSelectedImage(null); // Reset selection when modal opens
      setIsConfirmPage(false); // Start on gallery page
    }
  }, [open, selectedCategory, dispatch]);
  const renderTreeTitle = (node) => (
    <span
      style={{
        fontWeight: selectedKey === node.key ? "700" : "black", // Bold only if selected
        color: selectedKey === node.key ? "black" : "gray", // Black color for selected node
      }}
    >
      {node.title}
    </span>
  );

  return (
    <Modal
      title={isConfirmPage ? "Confirm Selection" : "Change Image"}
      visible={open}
      onCancel={() => setOpenModal(!open)}
      onClose={() => setOpenModal(!open)}
      width="80%"
      footer={null}
    >
      {isConfirmPage ? (
        // Confirmation page
        <div>
          <div className="flex row relative justify-center gap-20 ">
            <div className="p-2 flex flex-col items-center relative group cursor-pointer  ">
              <img
                src={productImage}
                alt="Original"
                
                className="m-2 min-h-[200px] cursor-pointer shadow-slate-700   shadow-md  max-w-[200px] p-4    object-contain  transition duration-300 ease-in-out group-hover:filter group-hover:brightness-75   "
              />
              <p className="mt-2 font-bold">Original</p>{" "}
              {/* Label for original image */}
              {/* <p className="mt-2">
                {selectedImage?.title.length > 30
                  ? `${selectedImage?.title.substring(0, 30)}...`
                  : selectedImage?.title}
              </p> */}
            </div>
            <div className="flex flex-col items-center mt-20">
              <div className={style.arrow}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className=" flex flex-col items-center relative group cursor-pointer p-2  ">
              <img
                src={selectedImage?.public_thumbnail_uri}
                alt="Replacement"
                
                className="m-2 min-h-[200px] cursor-pointer  max-w-[200px] p-4  border-gray-600  object-contain  transition duration-300 ease-in-out group-hover:filter group-hover:brightness-75 shadow-slate-700   shadow-md "
              />
              <p className="mt-2 font-bold">Replacement</p>{" "}
              {/* Label for replacement image */}
              {/* <p className="mt-2">
                {selectedImage?.title.length > 30
                  ? `${selectedImage?.title.substring(0, 10)}...`
                  : selectedImage?.title}
              </p> */}
            </div>
          </div>
          <Space className="mt-6 flex justify-center">
            <Button onClick={handleBackToGallery}>Back to Gallery</Button>
            <Button type="primary" onClick={handleConfirm}>
              Confirm Selection
            </Button>
          </Space>
        </div>
      ) : (
        // Gallery view
        <>
          {loading ? (
            <div className="grid max-sm:grid-cols-1 max-xl:grid-cols-2 grid-cols-4 gap-8 p-8 max-md:pt-20 content-center  ">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton.Image key={index} style={IMAGE_STYLES} active />
              ))}
            </div>
          ) : error ? (
            <Empty description="Failed to load images" />
          ) : (
            <div className=" flex p-8 gap-4  ">
              <div className="grid max-sm:grid-cols-1 max-xl:grid-cols-2 grid-cols-3 gap-8  max-md:pt-20 content-center    ">
                {images?.data?.images?.map((image) => (
                  <div
                    key={image.id}
                    className="flex flex-col items-center  group p-8 cursor-pointer border-2 rounded-lg shadow-lg   border-gray-100 hover:bg-gray-100 relative "
                    onClick={() => handleImageSelect(image)} // Handle image selection
                  >
                    <img
                      src={
                        image.public_thumbnail_uri ||
                        "https://via.placeholder.com/200x300?text=Deprecated"
                      }
                      alt={image.description}
                      className="m-2 min-h-[200px] cursor-pointer  max-w-[200px] p-1  shadow-slate-700   shadow-lg  object-contain  transition duration-300 ease-in-out group-hover:filter group-hover:brightness-75    "
                    />
                    {/* <img
                     src={Pin}
                     alt="Pin"
                     className="w-6 h-6 object-cover absolute top-5 left-52 rigth-2 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                   /> */}
                    <p className="text-center">
                      {image.title.length > 10
                        ? `${image.title.substring(0, 15)}...`
                        : image.title}
                    </p>
                  </div>
                ))}
              </div>
              <div className="md:w-2/12 max-md:hidden max-md:w-0/12 ">
                <Tree
                  showIcon
                  className="fixed top-40 font-semibold pt-8 text-gray-400"
                  showLine
                  selectedKeys={[selectedKey]} // Highlight based on selectedKey
                  switcherIcon={<DownOutlined />}
                  defaultExpandedKeys={["0-0-0"]}
                  treeData={treeData.map((node) => ({
                    ...node,
                    children: node.children?.map((child) => ({
                      ...child,
                      title: renderTreeTitle(child),
                    })),
                  }))}
                  onSelect={onSelect}
                />
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <Pagination
              defaultCurrent={currentPage}
              current={currentPage}
              total={images?.data?.count || 0}
              onChange={onChange}
              pageSize={10}
            />
          </div>
        </>
      )}
    </Modal>
  );
}
