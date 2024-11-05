import React, { useEffect, useState, CSSProperties } from "react";
import { Modal, Empty, Skeleton, Pagination, Space, Button } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import { getInventoryImages } from "../store/features/orderSlice";
import replace from "../assets/images/change-record-type-svgrepo-com.svg";
import change from "../assets/images/change-svgrepo-com.svg";
import style from "./Arrows.module.css";

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

  const [selectedImage, setSelectedImage] = useState(null); // State to store selected image
  const [isConfirmPage, setIsConfirmPage] = useState(false); // State to toggle between gallery and confirm page

  const IMAGE_STYLES: CSSProperties = {
    width: 200,
    height: 200,
  };

  const onChange = (page) => {
    dispatch(getInventoryImages({ library: "inventory", Page: page }));
  };
  const closeModal = () => setOpen(false);

  useEffect(() => {
    if (open) {
      dispatch(getInventoryImages({ library: "inventory" }));
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
          <div className="flex row relative justify-center gap-20">
            <div className="p-8 flex flex-col items-center relative group cursor-pointer">
              <img
                src={productImage}
                alt="Original"
                style={IMAGE_STYLES}
                className="w-44 h-44  object-cover  p-4 cursor-pointer transition duration-300 ease-in-out group-hover:filter group-hover:brightness-75 border rounded-lg    border-gray-100"
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
            <div className="p-8 flex flex-col items-center relative group cursor-pointer">
              <img
                src={selectedImage?.public_thumbnail_uri}
                alt="Replacement"
                style={IMAGE_STYLES}
                className="w-44 h-44 object-cover  p-4 cursor-pointer transition duration-300 ease-in-out group-hover:filter group-hover:brightness-75 border rounded-lg    border-gray-100"
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
            <div className="grid max-sm:grid-cols-1 max-xl:grid-cols-2 grid-cols-4 gap-8 p-8 max-md:pt-20 content-center">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton.Image key={index} style={IMAGE_STYLES} active />
              ))}
            </div>
          ) : error ? (
            <Empty description="Failed to load images" />
          ) : (
            <div className="grid max-sm:grid-cols-1 max-xl:grid-cols-2 grid-cols-4 gap-8 p-8 max-md:pt-20 content-center">
              {images?.data?.images?.map((image) => (
                <div
                  key={image.id}
                  className="flex flex-col items-center relative group cursor-pointer shadow-inner "
                  onClick={() => handleImageSelect(image)} // Handle image selection
                >
                  <img
                    src={
                      image.public_thumbnail_uri ||
                      "https://via.placeholder.com/200x300?text=Deprecated"
                    }
                    alt={image.description}
                    className="w-48 h-48 object-cover  p-4 cursor-pointer transition duration-300 ease-in-out group-hover:filter group-hover:brightness-75 border rounded-lg    border-gray-100 "
                  />
                  <img
                    src={replace}
                    alt="replace"
                    className="w-28 h-28 object-cover absolute top-10 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                  />
                  <p className="text-center">
                    {image.title.length > 10
                      ? `${image.title.substring(0, 15)}...`
                      : image.title}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center">
            <Pagination
              defaultCurrent={1}
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
