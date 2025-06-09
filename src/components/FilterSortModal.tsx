import React, { useState, Dispatch, SetStateAction, ChangeEvent  } from 'react'
import { Button, DatePicker, Divider, Form, Input, Modal, Radio, RadioChangeEvent, Select, Space } from 'antd';
import { useAppDispatch, useAppSelector } from "../store";

import dayjs from 'dayjs';
import { listVirtualInventory } from '../store/features/InventorySlice';
import { every, forEach, keys, map } from 'lodash';

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
  
  const handleCancel = () => {
    setOpen(false);
  };
  
  const [value, setValue] = useState(1);

  const onChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
  };

  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };

    
  return (
    <>
    <Modal
      title={<h1 className=' text-gray-500'>Filters & Sorting</h1>}
      centered
      open={openModel}
      onOk={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      width={'40%'}
      footer={[
        <Button key="submit" className='py-2' size={'large'} type="primary" loading={loading} onClick={handleOk}>
          Show Results
        </Button>,

      ]}
      style={{minWidth:'350px'}}
    >

      <div className='filterSorting'>
        <section className="text-gray-600 body-fon ">
          <Form
                form={form} 
                name="dynamic_rule"
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
                style={{ maxWidth: 600 }}
                className="flex1"
              >

            <div className="relative mb-4  ml-4">
                <label htmlFor="name" className="leading-7 text-base text-gray-400 font-semibold title-font">Filter</label>
                {/* <input type="text" placeholder='filename, title or description' id="name" value={filter} onChange={ (e: ChangeEvent) => setFilter((e.target as HTMLInputElement).value) } name="name" className="w-full text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" /> */}
                  <Form.Item 
                        name="search_filter"
                        // initialValue={""}
                        noStyle={true}
                        
                    >
                       
                    <Input  placeholder='filename, title or description'   />
                  </Form.Item>
            </div>

            <div className="relative mb-4  ml-4">
                <label htmlFor="name" className="leading-7 text-base text-gray-400 font-semibold title-font">Filter by SKU</label>
                {/* <input type="text" placeholder='filename, title or description' id="name" value={filter} onChange={ (e: ChangeEvent) => setFilter((e.target as HTMLInputElement).value) } name="name" className="w-full text-gray-400 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" /> */}
                  <Form.Item 
                        name="sku_filter"
                        // initialValue={userInfo.filterSearchFilter}
                        noStyle={true}
                    >
                       
                    <Input placeholder='filename, title or description'   />
                  </Form.Item>
            </div>

          <div className="container mx-auto flex px-5 py-0 xl:flex-row max-xl:justify-start flex-col items-center1">
            <div className=" bg-white flex flex-col md:ml-auto w-full md:py-833  mt-8 md:mt-0">

              <div className="border rounded-md p-4 pb-2 relative mb-4 mt-0 w-full">
                <label htmlFor="name" className="w-full leading-7 text-base text-gray-400 font-semibold title-font">Date Range files added</label>
                  <Form.Item 
                    name="dateRange"  
                    >
                    <RangePicker 
                    style={{width:'230px'}}
                    
                    className='w-full' />
                  </Form.Item>  
              </div>
              <div className="relative mb-4 flex flex-col">
                <label htmlFor="message" className=" leading-7 text-base text-gray-400 font-semibold title-font">Inventory per page</label>
                <Form.Item name="per_page"  
                initialValue={12}
                >
                  <Select
                    className='text-gray-400  mt-5'
                    onChange={handleChange}
                    options={[
                      { value: '50', label: '50' },
                      { value: '25', label: '25' },
                      { value: '15', label: '15' },
                      { value: '12', label: '12' },
                      { value: '10', label: '10' },
                      { value: '8', label: '8' },
                      { value: '6', label: '6' },
                      { value: '4', label: '4' },
                      { value: '2', label: '2'},
                    ]}
                  />
                </Form.Item>
              </div>
            </div>
            <div className="lg:w-1/2  md:w-1/2 w-1/2 mb-10 md:mb-0  flex flex-col items-center py-2 justify-evenly border rounded-md ml-3 ">
            <label htmlFor="name" className="leading-7 mb-2 text-base text-gray-400 font-semibold title-font">Sort results by</label>
            <Form.Item name="sort_field"  >
                <Radio.Group className='whitespace-nowrap flex flex-col'  onChange={onChange} 
                  defaultValue={ 'id'}
                >
                    <Radio className='text-gray-400' value={'id'}>ID</Radio>
                    <Radio className='text-gray-400 py-2' value={'name'}>Name</Radio>
                    <Radio className='text-gray-400' value={'created_at'}>Created At</Radio>
                </Radio.Group>
              </Form.Item>  
              <Divider/>
              <Form.Item name="sort_direction"  >  
                <Radio.Group  className='whitespace-nowrap flex flex-col' onChange={onChange} 
                  defaultValue={'DESC'}
                >
                    <Radio className='text-gray-400' value={'ASC'}>Ascending</Radio>
                    <Radio className='text-gray-400 pt-2' value={'DESC'}>Descending</Radio>
                </Radio.Group>
              </Form.Item>  
            </div>
          </div>
          </Form>
        </section>
      </div>
    </Modal>
    </>
  )
}

export default FilterSortModal
