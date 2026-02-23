import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useAppDispatch, useAppSelector } from "../store";
interface EditInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  productData: any;
  onSave: (updatedData: any) => void;
}

const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  visible,
  onClose,
  productData,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    product_code: '',
    asking_price: '',
    description_short: '',
    description_long: '',
    quantity: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [plainTextDescription, setPlainTextDescription] = useState('');
  const [originalLabels, setOriginalLabels] = useState<Array<{key: string, value: string, priority: number}>>([]);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  
  // Function to strip HTML tags
  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  useEffect(() => {
    if (productData && visible) {
      // Extract and store original labels (skip first one which is SKU)
      if (productData.labels && Array.isArray(productData.labels)) {
        const labelsWithoutSku = productData.labels.slice(1); // Skip first label (SKU)
        setOriginalLabels(labelsWithoutSku);
      } else {
        setOriginalLabels([]);
      }
      
      // Convert HTML description to plain text
      const plainText = stripHtmlTags(productData.description_long || '');
      setPlainTextDescription(plainText);
      
      setFormData({
        name: productData.name || '',
        sku: productData.sku || '',
        product_code: productData.product_code || '',
        asking_price: productData.asking_price || '',
        description_short: productData.description_short || '',
        description_long: productData.description_long || '',
        quantity: productData.quantity || '',
      });
    }
  }, [productData, visible]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      notification.error({
        message: 'Validation Error',
        description: 'Product name is required',
        placement: 'topRight',
      });
      return;
    }

    if (!formData.sku.trim()) {
      notification.error({
        message: 'Validation Error',
        description: 'SKU is required',
        placement: 'topRight',
      });
      return;
    }

    setIsSaving(true);

    // Send description as plain text
    const description = plainTextDescription.trim();

    const updatePayload = {
      virtual_inventory: [
        {
          sku: formData.sku,
          asking_price: parseFloat(formData.asking_price) || 0,
          name: formData.name,
          description: description,
          quantity_in_stock: parseInt(formData.quantity) || 0,
          track_inventory: true,
          third_party_integrations: productData.third_party_integrations || {}
        }
      ],
     account_key: customerInfo?.data?.account_key
    };

    try {
      const response = await fetch('https://dwe8rzhebf.execute-api.us-east-1.amazonaws.com/Prod/api/update-virtual-inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        notification.success({
          message: 'Success',
          description: 'Product details updated successfully',
          placement: 'topRight',
          duration: 3,
        });
        onSave({ ...productData, ...formData, description_long: description });
        onClose();
      } else {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      notification.error({
        message: 'Update Failed',
        description: 'Failed to update product details. Please try again.',
        placement: 'topRight',
        duration: 4,
      });
      console.error('Error updating product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes slideInRight {
          0% {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
          }
          60% {
            transform: translateX(-10px) scale(1);
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          0% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .modal-content-animate {
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }
        
        .modal-header-animate {
          animation: fadeIn 0.4s ease-out 0.3s both;
        }
        
        .modal-footer-animate {
          animation: fadeInUp 0.5s ease-out 0.4s both;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 transition-all duration-700 ease-in-out z-[60] ${
          visible ? 'backdrop-blur-md opacity-100' : 'backdrop-blur-none opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[600px] lg:w-[700px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.3)] z-[70] ${
          visible ? 'animate-[slideInRight_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]' : 'animate-[slideOutRight_0.4s_ease-in_forwards]'
        }`}
        style={{
          boxShadow: visible ? '0 0 100px rgba(0, 0, 0, 0.3), -10px 0 30px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        {/* Header */}
        <div className={`sticky top-0 bg-gradient-to-r from-white to-blue-50/30 border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm ${visible ? 'modal-header-animate' : ''}`}>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            Edit Product Details
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-red-50 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600 group-hover:text-red-600 transition-colors duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto h-[calc(100vh-140px)] px-6 py-6 ${visible ? 'modal-content-animate' : 'opacity-0'}`}>
          {/* Product Image - Read Only */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Product Image
            </label>
            <div className="w-full h-64 bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-gray-300 rounded-2xl flex items-center justify-center p-4 relative shadow-inner overflow-hidden group">
              {productData?.image_url_1 ? (
                <img
                  src={productData.image_url_1}
                  alt={formData.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto mb-2 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p>No image available</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Images cannot be edited from this modal
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Product Name */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-400"
                placeholder="Enter product name"
              />
            </div>

            {/* SKU - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="Enter SKU"
              />
              <p className="text-xs text-gray-500 mt-1">SKU cannot be edited</p>
            </div>

            {/* Product Code - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Code
              </label>
              <input
                type="text"
                value={formData.product_code}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="Enter product code"
              />
              <p className="text-xs text-gray-500 mt-1">Product code cannot be edited</p>
            </div>

            {/* Asking Price */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                Asking Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.asking_price}
                onChange={(e) => handleChange('asking_price', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-400"
                placeholder="Enter price"
              />
            </div>

            {/* Quantity */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-400"
                placeholder="Enter quantity"
              />
            </div>

            {/* Short Description */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                Short Description
              </label>
              <input
                type="text"
                value={formData.description_short}
                onChange={(e) => handleChange('description_short', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-400"
                placeholder="Enter short description"
              />
            </div>

            {/* Original Labels - Static/Read-only */}
            {originalLabels.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Original Product Labels
                </label>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
                  <div className="space-y-2">
                    {originalLabels.map((label, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="inline-block px-2 py-1 bg-purple-600 text-white rounded-md font-semibold text-xs min-w-[120px] text-center">
                          {label.key}
                        </span>
                        <span className="text-gray-800 font-medium flex-1 py-1">
                          {label.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-700 mt-3 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    These labels are locked and cannot be edited
                  </p>
                </div>
              </div>
            )}

            {/* Description - Plain Text Editable */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                Description
              </label>
              <textarea
                value={plainTextDescription}
                onChange={(e) => setPlainTextDescription(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm leading-relaxed transition-all duration-300 hover:border-gray-400"
                placeholder="Enter product description"
              />
              
              {/* Info about description */}
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your description will be saved as plain text
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 bg-gradient-to-t from-gray-50 to-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 shadow-lg ${visible ? 'modal-footer-animate' : 'opacity-0'}`}>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default EditInventoryModal;

