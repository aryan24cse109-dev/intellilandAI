function ErrorMessage({
  title = "Something went wrong",
  message = "Unable to complete the requested operation.",
  onRetry,
}) {
  return (
    <div className="error-message">
      <div className="error-message-icon">!</div>

      <div className="error-message-content">
        <h3>{title}</h3>

        <p>{message}</p>

        {onRetry && (
          <button
            type="button"
            className="error-retry-button"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;