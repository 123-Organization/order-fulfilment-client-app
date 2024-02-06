import React, { useState, Dispatch, SetStateAction, FC  } from 'react'
import { Button, Form, Input, message, Modal, Spin } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import uploadYourLogo from "../assets/images/upload-your-logo.svg";

/**
 * ****************************************************************** Outer Function **********************************************************
 */

interface UploadFileModalProps {
  openModel?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>> ;
  imgData?: any;
  onDeleteHandler?: Function
  isSuccess?: boolean;
}

const { TextArea } = Input;
/**
 * ****************************************************************** Function Components *******************************************************
 */


 const useStyle = createStyles(({ token }) => ({
  'my-modal-body': {
    background: token.blue1,
    padding: token.paddingSM,
    
  },
  'my-modal-mask': {
    boxShadow: `inset 0 0 15px #fff`,
  },
  'my-modal-header': {
    borderBottom: `1px dotted ${token.colorPrimary}`,
  },
  'my-modal-footer': {
    color: token.colorPrimary,
  },
  'my-modal-content': {
    border: '1px solid #333',
  },
}));

const UploadFileModal: FC<UploadFileModalProps> = ({openModel, setOpen, imgData, onDeleteHandler, isSuccess} ) : JSX.Element => {
  
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const token = useTheme();
  const { styles } = useStyle();

  const classNames = {
    body: styles['my-modal-body'],
    mask: styles['my-modal-mask'],
    header: styles['my-modal-header'],
    footer: styles['my-modal-footer'],
    content: styles['my-modal-content'],
  };

  const modalStyles = {
    header: {
      borderBottom: '1px solid gray',
      paddingBottom: '5px'
    },
    body: {
      // boxShadow: 'inset 0 0 5px #999',
      // borderRadius: 5,
    },
    mask: {
      // backdropFilter: 'blur(10px)',
    },
    footer: {
      paddingTop: '5px',
      // boxShadow: '0 4px 2px -2px gray'
      borderTop: '1px solid gray',
    },
    content: {
      // boxShadow: '0 0 30px #999',
    },
  };
  
  const [form] = Form.useForm();
  const options = {
    hour12: true
  };
  // const date = new Date(imgData.date_added)
  // const datetime = date.toLocaleString('en-US',options) 
  // form.setFieldsValue({
  //   title: imgData.title,
  //   description: imgData.description
  // })
  // const filesize = formatFileSize(imgData.file_size)
  const handleOk = async() => {
      setLoading(true);
      try {
        const values = await form.validateFields();
        console.log('Success:', values);
        if(values?.title){
          // await putImagesFn({...values,...{guid:imgData.guid,"libraryAccountKey":userInfo.libraryAccountKey,"librarySiteId":userInfo.librarySiteId}})
        }
       
      } catch (errorInfo) {
        console.log('Failed:', errorInfo);
      }
    
    };
  
    const handleCancel = () => {
      //setOpen(false);
    };

    

/**
 * ****************************************************************** JSX  ***************************************************************************
 */    
  return (
    <>
    {
     <Modal
      title={<h1 className=' text-gray-500'>Upload Your File</h1>}
      centered
      open={openModel}
      styles={modalStyles}
      // onOk={() => setOpen(false)}
      // onCancel={() => setOpen(false)}
      width={'78%'}
      footer={
        isSuccess || 1
        ? [
          <Button key="submit" className='py-2 absolute left-8 ' size={'large'} type="default" onClick={handleOk}>
            Cancel
          </Button>,
          <Button key="submit" className='py-2' size={'large'} type="primary"  onClick={handleOk}>
            Update
          </Button>,

          ]

        : [
            <div className='pt-5 pb-2'>
              <Spin tip="Deleting file..." ><></></Spin>
            </div>

          ]
    }
    >

      <div>
        <section className="text-gray-600 body-font">
          {contextHolder}
          <div className="container mx-auto flex px-5 py-0 md:flex-row flex-col items-center h-[600px] w-[600px]">
            <img className='py-2 border-gray-300 border-2 rounded-lg '  src={uploadYourLogo} />
          </div>
        </section>
      </div>
    </Modal>

    }
    </>
  )
}

export default UploadFileModal
