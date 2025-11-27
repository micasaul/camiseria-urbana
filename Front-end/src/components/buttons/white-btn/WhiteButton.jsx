import "./white-btn.css";

export default function WhiteButton({ children, ...props }) {
  return (
    <button className="white-btn" {...props}>
      {children}
    </button>
  );
}
