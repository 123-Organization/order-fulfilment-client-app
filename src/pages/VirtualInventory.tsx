import React, { CSSProperties, useEffect, useState } from "react";
import { Empty, message, Skeleton, Space, Spin } from "antd";
import { Typography } from "antd";
import FilterSortModal from "../components/FilterSortModal";
import { FileSearchOutlined, SortDescendingOutlined } from "@ant-design/icons";

const images = [
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg",
    isSelected: false,
    title: "first image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg",
    isSelected: false,
    title: "second image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg",
    isSelected: false,
    title: "third image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg",
    isSelected: false,
    title: "fourth image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg",
    isSelected: false,
    title: "fifth image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg",
    isSelected: false,
    title: "six image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-6.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-6.jpg",
    isSelected: false,
    title: "seven image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-7.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-7.jpg",
    isSelected: false,
    title: "eight image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-8.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-8.jpg",
    isSelected: false,
    title: "nineth image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-9.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-9.jpg",
    isSelected: false,
    title: "tenth image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-10.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-10.jpg",
    isSelected: false,
    title: "eleventh image"
  },
  {
    public_thumbnail_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg",
    public_preview_uri:
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg",
    isSelected: false,
    title: "twelth image"
  }
];

/**
 * ****************************************************************** Outer Function **********************************************************
 */

const { Text } = Typography;
const IMAGE_STYLES: CSSProperties = {
  width: 200,
  height: 200
};

interface ImageType {
  public_thumbnail_uri?: string;
  guid?: string;
  public_preview_uri?: string;
  isSelected?: false;
  title?: string;
}
/**
 * ****************************************************************** Function Components *******************************************************
 */

const VirtualInventory: React.FC = (): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [spinLoader, setSpinLoader] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [imgData, setImgData] = useState({});
  const [referrerImages, setReferrerImages] = useState<
    Array<String | undefined>
  >([]);
  // const [images, setImages] = useState<Array<ImageType>>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const handleSelect = (index: number) => {};

  const createPrints = () => {
    if (spinLoader) return false;
    setSpinLoader(true);
    // let guids = referrer.fileSelected.map((image: { guid: string })=>image.guid);
    // printImagesDataFn({guids});
    // // window.open(`https://finerworks.com/apps/orderform/post.aspx?guids=${guids}`, "_blank")
  };

  useEffect(() => {}, []);
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
          {true && (
            <div
              onClick={createPrints}
              className="fw-sky-btn mr-4 basis-1/12 max-md:row-1 max-md:col-span-4 max-md:relative"
            >
              <Spin spinning={spinLoader} size="small">
                <button
                  type="button"
                  className="  
                            "
                >
                  {"Export"}
                </button>
              </Spin>
            </div>
          )}
        </div>
      </div>
      <div className="grid max-sm:grid-cols-1 max-xl:grid-cols-2 grid-cols-4 gap-8 p-8 max-md:pt-20 content-center">
        {contextHolder}
        {false ? (
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
        ) : images.length ? (
          <>
            {images.map((image, i) => (
              <div
                key={i}
                className={`border rounded-lg shadow-lg   border-gray-100 ${
                  image.isSelected ||
                  (referrerImages?.length &&
                    referrerImages.includes(image.guid))
                    ? "isSelectedImg"
                    : ""
                }`}
              >
                <div
                  onClick={() => handleSelect(i)}
                  className="min-h-[300px] flex justify-center items-center"
                >
                  <div>
                    <img
                      className={`m-2 min-h-[200px] cursor-pointer  max-w-[200px]   object-contain    `}
                      src={image.public_thumbnail_uri}
                      alt=""
                    />
                  </div>
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
                    <h2>Gicc- Canvas prints</h2>
                    <h2>18 * 45" Silva matic canvas </h2>
                    <h2>Strech mounted images wraps - 1.4 deep"</h2>
                    <h2>Color collection services : No</h2>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <Empty />
        )}
        <FilterSortModal openModel={openFilter} setOpen={setOpenFilter} />
      </div>
    </div>
  );
};

export default VirtualInventory;
