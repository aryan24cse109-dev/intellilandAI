import { cn } from "../../utils/helpers";

function Select({
  label,
  name,
  options = [],
  error,
  helperText,
  required = false,
  placeholder = "Select an option",
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

      <select
        id={name}
        name={name}
        className={cn(
          "form-input",
          "form-select",
          error && "form-input-error",
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => {
          const value =
            typeof option === "object" ? option.value : option;

          const labelText =
            typeof option === "object" ? option.label : option;

          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>

      {error && <p className="form-error">{error}</p>}

      {!error && helperText && (
        <p className="form-helper">{helperText}</p>
      )}
    </div>
  );
}

export default Select;