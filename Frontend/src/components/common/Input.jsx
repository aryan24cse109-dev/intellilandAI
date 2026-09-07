import { cn } from "../../utils/helpers";

function Input({
  label,
  name,
  error,
  helperText,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}

          {required && <span className="required-mark">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        className={cn(
          "form-input",
          error && "form-input-error",
          className
        )}
        {...props}
      />

      {error && <p className="form-error">{error}</p>}

      {!error && helperText && (
        <p className="form-helper">{helperText}</p>
      )}
    </div>
  );
}

export default Input;