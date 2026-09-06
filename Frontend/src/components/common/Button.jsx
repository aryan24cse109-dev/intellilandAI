import { cn } from "../../utils/helpers";

function Button({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "btn",
        `btn-${variant}`,
        `btn-${size}`,
        loading && "btn-loading",
        className
      )}
      {...props}
    >
      {loading ? "Processing..." : children}
    </button>
  );
}

export default Button;