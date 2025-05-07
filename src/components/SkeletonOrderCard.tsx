import React from "react";

interface SkeletonOrderCardProps {
  count?: number;
}

const SkeletonOrderCard: React.FC<SkeletonOrderCardProps> = ({ count = 1 }) => {
  const renderSkeleton = () => {
    return Array(count)
      .fill(0)
      .map((_, index) => (
        <div
          key={index}
          className="justify-between mb-6 rounded-lg bg-white p-6 shadow-md sm:flex-row sm:justify-start space-y-2 animate-pulse"
        >
          <ul className="grid w-100 md:grid-cols-2 md:grid-rows-1 items-start">
            <li className="w-8">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </li>
            <div className="w-full text-end">
              <div className="h-6 bg-gray-200 rounded w-6 ml-auto"></div>
            </div>
          </ul>

          <ul className="grid w-full gap-6 md:grid-cols-3">
            {/* Order Info Box */}
            <li>
              <div className="h-[220px] p-5 bg-white border-2 border-gray-200 rounded-lg w-full">
                <div className="w-full bg-gray-200 h-3 rounded mb-3"></div>
                <div className="w-1/2 bg-gray-200 h-3 rounded mb-4 mt-3"></div>
                <div className="space-y-2">
                  <div className="w-3/4 bg-gray-200 h-3 rounded"></div>
                  <div className="w-2/3 bg-gray-200 h-3 rounded"></div>
                  <div className="w-4/5 bg-gray-200 h-3 rounded"></div>
                  <div className="w-3/4 bg-gray-200 h-3 rounded"></div>
                  <div className="w-1/2 bg-gray-200 h-3 rounded"></div>
                </div>
                <div className="w-full bg-gray-200 h-6 rounded mt-4"></div>
              </div>
            </li>

            {/* Product Box */}
            <li>
              <div className="h-[220px] bg-white border-2 border-gray-200 rounded-lg pt-5 pb-5 px-2 w-full">
                <div className="flex justify-between pt-2 rounded-lg sm:flex sm:justify-start">
                  <div className="w-[50%]">
                    <div className="rounded-lg w-32 h-[120px] bg-gray-200"></div>
                  </div>
                  <div className="w-[100%]">
                    <div className="flex flex-col w-full sm:justify-between p-2 max-lg:p-2">
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 h-3 rounded"></div>
                        <div className="w-full bg-gray-200 h-3 rounded"></div>
                        <div className="w-3/4 bg-gray-200 h-3 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-right h-4 mt-2">
                  <div className="w-16 h-3 bg-gray-200 rounded ml-auto"></div>
                </div>
              </div>
            </li>

            {/* Shipping Box */}
            <li>
              <div className="h-[220px] bg-white border-2 border-gray-200 rounded-lg p-5 w-full">
                <div className="w-full flex flex-col justify-center items-center h-full space-y-3">
                  <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                  <div className="w-3/4 h-20 bg-gray-200 rounded"></div>
                  <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
                  <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      ));
  };

  return <>{renderSkeleton()}</>;
};

export default SkeletonOrderCard; 