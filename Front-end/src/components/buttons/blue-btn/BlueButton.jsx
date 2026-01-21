import "./blue-btn.css";


export default function BlueButton({ children, width, height, fontSize, className, ...props }) {
  const style = {
    "--btn-width": width || "auto",
    "--btn-height": height || "auto",
    "--btn-font-size": fontSize || "1rem",
  };

  return (
    <button className={`blue-btn${className ? ` ${className}` : ''}`} style={style} {...props}>
      {children}
    </button>
  );
}
