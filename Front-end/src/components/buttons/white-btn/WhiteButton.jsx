import "./white-btn.css";

export default function WhiteButton({ children, width, height, fontSize, ...props }) {
  const style = {
    "--btn-width": width || "auto",
    "--btn-height": height || "auto",
    "--btn-font-size": fontSize || "1rem",
  };
  return (
    <button className="white-btn" style={style} {...props}>
      {children}
    </button>
  );
}
