import React, { useState, Dispatch, SetStateAction } from 'react'
import { Button, DatePicker, Form, Input, Modal } from 'antd';
import { useAppDispatch } from "../store";

import dayjs from 'dayjs';
import { listVirtualInventory } from '../store/features/InventorySlice';
import { map } from 'lodash';

interface FilterSortModalProps {
  openModel: boolean;
  setOpen: Dispatch<SetStateAction<boolean>> ;
}

const { RangePicker } = DatePicker;


const FilterSortModal = ({openModel, setOpen} : FilterSortModalProps) => {

  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
 
  const handleOk = async() => {
      setLoading(true);
      try {
        let values = await form.validateFields();
        // values.map((value:any) => value?value:"");
        
        map(values, (val,key) => {
          console.log('result',val,key);
          if(key==='per_page'){
            values[key] = val?val:"2";
          }
          else if(key==='sort_field'){
            values[key] = val?val:"id";
          }
          else if(key==='sort_direction'){
            values[key] = val?val:"ASC";
          }
          else if(key==='sku_filter' && val){
            values[key] = val?[val]:"";
          }
          else {
            if(!val)
            delete values[key];
          }
        });
        
        console.log('Success:', values);
        if(values?.filterPerPage){

          if(values.dateRange) {
            if(values.dateRange[0]){
              values.created_date_from  = dayjs(values.dateRange[0]).format('YYYY-MM-DD')
            }  
            
            if(values.dateRange[1]){
              values.created_date_to  = dayjs(values.dateRange[1]).format('YYYY-MM-DD')
            }
            delete values.dateRange
          }
 
        }

        dispatch(
          listVirtualInventory(values)
        )

        
      } catch (errorInfo) {
        console.log('Failed:', errorInfo);
      }
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
      }, 3000);
    };

    
  return (
    <>
    <Modal
      title={
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h1 className='text-gray-800 font-semibold text-lg'>Advanced Filters</h1>
        </div>
      }
      centered
      open={openModel}
      onOk={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      width={500}
      footer={[
        <Button key="submit" size={'large'} type="primary" loading={loading} onClick={handleOk} className="min-w-[150px]">
          Apply Filters
        </Button>,
      ]}
    >
      <div className='space-y-4'>
        <Form
          form={form} 
          name="dynamic_rule"
          layout="vertical"
          className="space-y-4"
        >
          {/* Advanced Filters Section */}
          <div className="bg-blue-50 rounded-lg p-5 space-y-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-4">
              Use these advanced options for more specific filtering:
            </p>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Filter by SKU
              </label>
              <Form.Item name="sku_filter" noStyle>
                <Input 
                  placeholder='Enter SKU code...'
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date Range
              </label>
              <Form.Item name="dateRange" noStyle>
                <RangePicker size="large" className="w-full rounded-lg" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>
    </Modal>
    </>
  )
}

export default FilterSortModal
