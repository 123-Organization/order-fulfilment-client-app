import React, { useEffect, useState } from 'react';
import { Avatar, Button, List, Skeleton } from 'antd';
import { useAppSelector } from '../store';

interface DataType {
  gender?: string;
  name: {
    title?: string;
    first?: string;
    last?: string;
  };
  email?: string;
  picture: {
    large?: string;
    medium?: string;
    thumbnail?: string;
  };
  nat?: string;
  loading: boolean;
}

const count = 3;
const fakeDataUrl = `https://randomuser.me/api/?results=${count}&inc=name,gender,email,nat,picture&noinfo`;

const Datalist: React.FC = () => {
        const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
        const productData  = checkedOrders.map((order: any) => {
                const single = {
                        product_title: order?.productData[0]?.product_title,
                        product_order_po: order?.productData[0]?.product_order_po,
                        product_price: order?.Product_price?.grand_total
                        ,
                        productImage: order?.productImage,
                        loading: false,
                }

                return single;
        });
  const [initLoading, setInitLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataType[]>([]);
  const [list, setList] = useState<DataType[]>([]);

  

  const loadMore =
    !initLoading && !loading ? (
      <div
        style={{
          textAlign: 'center',
          marginTop: 12,
          height: 32,
          lineHeight: '32px',
        }}
      >
        <Button onClick={""}>loading more</Button>
      </div>
    ) : null;

  return (
    <List
      className="demo-loadmore-list "
      
      itemLayout="horizontal"
      loadMore={loadMore}
      dataSource={productData}
      renderItem={(item) => (
        <List.Item
          actions={[<a key="list-loadmore-edit " className='text-black' href='#/editorder/404' >Edit</a>]}
          className=''
        >
          <Skeleton avatar title={false} loading={item.loading} active>
            <List.Item.Meta
              avatar={<Avatar src={item?.productImage} className='rounded-3xl w-24 h-24 shadow-sm '  />}
              
              title={<a href="https://ant.design">{item?.product_title}</a>}
              description={`$${item?.product_price}`}  
              
             

            />
            
          </Skeleton>
        </List.Item>
      )}
    />
  );
};

export default Datalist;