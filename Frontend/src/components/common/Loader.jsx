function Loader({ size = "medium", text = "Loading..." }) {
  return (
    <div className={`loader-container loader-${size}`}>
      <div className="loader-spinner" />

      {text && <span className="loader-text">{text}</span>}
    </div>
  );
}

export default Loader;