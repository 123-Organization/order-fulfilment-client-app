import React, { useState, useEffect } from "react";
import { Modal, Button, Radio, Checkbox, Tag, Tooltip } from "antd";
import { CrownOutlined, BranchesOutlined, InfoCircleOutlined } from "@ant-design/icons";

interface Product {
  sku: string;
  name: string;
  image_url_1: string;
  asking_price?: string;
  product_code?: string;
  image_guid?: string;
  labels?: Array<{ key: string; value: string }>;
  description_long?: string;
  third_party_integrations?: any;
  isSelected?: boolean; // Whether this product was originally selected for export
}

interface VariantGroup {
  imageGuid: string;
  imageName: string;
  imageUrl: string;
  products: Product[];
  reason?: string;
  isParentOnly?: boolean;
  isChildOnly?: boolean;
  isSingleWithImageGuid?: boolean;
  parentSku?: string;
  selectedCount?: number; // How many products in this group were originally selected
}

interface VariantSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selections: { primary: Product; variants: Product[] }[]) => void;
  onSkip?: () => void; // Option to skip variant configuration and export directly
  variantGroups: VariantGroup[];
  platform: string;
}

const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onSkip,
  variantGroups,
  platform,
}) => {
  // State to track selections for each variant group
  // Key: imageGuid, Value: { primarySku: string, variantSkus: string[] }
  const [selections, setSelections] = useState<{
    [imageGuid: string]: { primarySku: string; variantSkus: string[] };
  }>({});

  // Initialize selections when variantGroups change
  useEffect(() => {
    const initialSelections: { [imageGuid: string]: { primarySku: string; variantSkus: string[] } } = {};
    variantGroups.forEach((group) => {
      if (group.products.length > 0) {
        // Default: first product is primary, rest are variants
        initialSelections[group.imageGuid] = {
          primarySku: group.products[0].sku,
          variantSkus: group.products.slice(1).map((p) => p.sku),
        };
      }
    });
    setSelections(initialSelections);
  }, [variantGroups]);

  // Handle primary product selection change
  const handlePrimaryChange = (imageGuid: string, sku: string) => {
    setSelections((prev) => {
      const currentGroup = prev[imageGuid] || { primarySku: "", variantSkus: [] };
      const allSkus = variantGroups
        .find((g) => g.imageGuid === imageGuid)
        ?.products.map((p) => p.sku) || [];
      
      // New variants are all products except the new primary
      const newVariants = allSkus.filter((s) => s !== sku);
      
      return {
        ...prev,
        [imageGuid]: {
          primarySku: sku,
          variantSkus: newVariants,
        },
      };
    });
  };

  // Handle variant checkbox change
  const handleVariantToggle = (imageGuid: string, sku: string, checked: boolean) => {
    setSelections((prev) => {
      const currentGroup = prev[imageGuid] || { primarySku: "", variantSkus: [] };
      let newVariants = [...currentGroup.variantSkus];
      
      if (checked) {
        if (!newVariants.includes(sku)) {
          newVariants.push(sku);
        }
      } else {
        newVariants = newVariants.filter((s) => s !== sku);
      }
      
      return {
        ...prev,
        [imageGuid]: {
          ...currentGroup,
          variantSkus: newVariants,
        },
      };
    });
  };

  // Handle confirm
  const handleConfirm = () => {
    const result: { primary: Product; variants: Product[] }[] = [];
    
    variantGroups.forEach((group) => {
      const groupSelection = selections[group.imageGuid];
      if (groupSelection) {
        const primary = group.products.find((p) => p.sku === groupSelection.primarySku);
        const variants = group.products.filter((p) => groupSelection.variantSkus.includes(p.sku));
        
        if (primary) {
          result.push({ primary, variants });
        }
      }
    });
    
    onConfirm(result);
  };

  // Get platform color
  const getPlatformColor = () => {
    switch (platform.toLowerCase()) {
      case "shopify":
        return "from-green-500 to-green-600";
      case "woocommerce":
        return "from-purple-500 to-purple-600";
      default:
        return "from-blue-500 to-blue-600";
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-gradient-to-r ${getPlatformColor()} rounded-lg`}>
            <BranchesOutlined className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 m-0">Product Variants Detected</h3>
            <p className="text-sm text-gray-500 font-normal m-0">
              Configure how products should be exported to {platform}
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <InfoCircleOutlined />
            <span>Configure variants or export as individual products</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            {onSkip && (
              <Button onClick={onSkip}>
                Export as Individual Products
              </Button>
            )}
            <Button
              type="primary"
              onClick={handleConfirm}
              className={`bg-gradient-to-r ${getPlatformColor()} border-none hover:opacity-90`}
            >
              Export with Variants
            </Button>
          </div>
        </div>
      }
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: "16px 24px" }}
    >
      <div className="space-y-6">
        {/* Info banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <InfoCircleOutlined className="text-blue-500 text-lg mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 mb-1">Configure Product Variants</p>
            <p className="text-sm text-blue-700">
              We found all variants that share the same image. Products marked with <span className="inline-flex items-center bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-medium">✓ Selected</span> are the ones you originally chose to export.
              <br />
              <strong>Click any product to set it as the Primary</strong> - this will be the main listing. Other products will be linked as variants.
            </p>
          </div>
        </div>
        
        {variantGroups.map((group) => (
          <div
            key={group.imageGuid}
            className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            {/* Group Header */}
            <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-200">
              <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                <img
                  src={group.imageUrl}
                  alt={group.imageName}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-base mb-1">
                  {group.imageName || "Product Group"}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag color="blue" className="m-0">
                    {group.products.length} {group.products.length === 1 ? 'Variant' : 'Variants'}
                  </Tag>
                  {group.selectedCount !== undefined && (
                    <Tag color="green" className="m-0">
                      {group.selectedCount} selected for export
                    </Tag>
                  )}
                  {group.isParentOnly && (
                    <Tag color="cyan" className="m-0">Parent with children</Tag>
                  )}
                </div>
                {group.reason && (
                  <p className="text-xs text-gray-400 mt-1">
                    <InfoCircleOutlined className="mr-1" />
                    {group.reason}
                  </p>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="space-y-3">
              {group.products.map((product) => {
                const isPrimary = selections[group.imageGuid]?.primarySku === product.sku;
                const isVariant = selections[group.imageGuid]?.variantSkus?.includes(product.sku);
                
                return (
                  <div
                    key={product.sku}
                    className={`relative flex items-center gap-4 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      isPrimary
                        ? "border-amber-400 bg-amber-50 shadow-md"
                        : isVariant
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => handlePrimaryChange(group.imageGuid, product.sku)}
                  >
                    {/* Originally Selected Badge */}
                    {product.isSelected && (
                      <div className="absolute -top-2 right-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        ✓ Selected
                      </div>
                    )}
                    
                    {/* Primary/Variant Badge */}
                    {isPrimary && (
                      <div className="absolute -top-2 -left-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <CrownOutlined className="text-[10px]" />
                        Primary
                      </div>
                    )}
                    {isVariant && !isPrimary && (
                      <div className="absolute -top-2 -left-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <BranchesOutlined className="text-[10px]" />
                        Variant
                      </div>
                    )}

                    {/* Selection Control */}
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Radio
                        checked={isPrimary}
                        onChange={() => handlePrimaryChange(group.imageGuid, product.sku)}
                        className="scale-110"
                      />
                    </div>

                    {/* Product Image */}
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={product.image_url_1}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-800 text-sm truncate mb-1" title={product.name}>
                        {product.name}
                      </h5>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                          {product.sku}
                        </span>
                        {product.asking_price && (
                          <span className="text-green-600 font-semibold">
                            ${parseFloat(product.asking_price).toFixed(2)}
                          </span>
                        )}
                        {product.labels && product.labels.length > 1 && (
                          <Tooltip
                            title={
                              <div className="space-y-1">
                                {product.labels.slice(1, 4).map((label, idx) => (
                                  <div key={idx}>
                                    <span className="font-semibold">{label.key}:</span> {label.value}
                                  </div>
                                ))}
                                {product.labels.length > 4 && (
                                  <div className="text-gray-300">+{product.labels.length - 4} more...</div>
                                )}
                              </div>
                            }
                          >
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded cursor-help">
                              {product.labels.length - 1} attributes
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Variant Checkbox (shown when not primary) */}
                    {!isPrimary && (
                      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isVariant}
                          onChange={(e) => handleVariantToggle(group.imageGuid, product.sku, e.target.checked)}
                        >
                          <span className="text-xs text-gray-500">Include as variant</span>
                        </Checkbox>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selection Summary */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">
                    <CrownOutlined className="text-amber-500 mr-1" />
                    1 Primary
                  </span>
                  <span className="text-gray-500">
                    <BranchesOutlined className="text-blue-500 mr-1" />
                    {selections[group.imageGuid]?.variantSkus?.length || 0} Variants
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  Click a product to set as primary
                </span>
              </div>
            </div>
          </div>
        ))}

        {variantGroups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BranchesOutlined className="text-4xl mb-3 text-gray-300" />
            <p>No variant groups found</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VariantSelectionModal;
