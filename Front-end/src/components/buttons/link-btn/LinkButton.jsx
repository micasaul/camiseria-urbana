import "./link-btn.css";

export default function LinkButton({ children, ...props }) {
  return (
    <button className="link-btn" {...props}>
      {children}
    </button>
  );
}
