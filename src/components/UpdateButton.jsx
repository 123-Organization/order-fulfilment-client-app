import React from "react";
import { Button, PaginationProps, Spin } from "antd";

export default function UpdateButton() {
  return (
    <div className="w-full text-center">
      <Button
        type="primary"
        onClick={() => {
          window.location.reload();
        }}
        className="mt-4 w-10/12"
      >
        Update 
      </Button>
    </div>
  );
}
