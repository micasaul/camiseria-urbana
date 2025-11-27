import "./blue-btn.css";


export default function BlueButton({ children, width, height, fontSize, ...props }) {
  const style = {
    "--btn-width": width || "auto",
    "--btn-height": height || "auto",
    "--btn-font-size": fontSize || "1rem",
  };

  return (
    <button className="blue-btn" style={style} {...props}>
      {children}
    </button>
  );
}
