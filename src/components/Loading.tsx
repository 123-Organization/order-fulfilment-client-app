import gear from "../assets/images/gear-settings-svgrepo-com.svg";
import style from "./Components.module.css";

const Loading = ({
  message = "Loading, please wait...",
  size = 80,
}: {
  message?: string;
  size?: number;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <span className={`${style.loader}`}></span>
      {message && <p className="mt-4 text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

export default Loading;
