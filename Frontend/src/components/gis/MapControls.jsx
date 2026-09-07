import { useMap } from "react-leaflet";

function MapControls() {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleReset = () => {
    map.setView([26.8467, 80.9462], 15);
  };

  return (
    <div className="custom-map-controls">
      <button
        type="button"
        onClick={handleZoomIn}
        title="Zoom in"
      >
        +
      </button>

      <button
        type="button"
        onClick={handleZoomOut}
        title="Zoom out"
      >
        −
      </button>

      <button
        type="button"
        onClick={handleReset}
        title="Reset map"
      >
        ⌂
      </button>
    </div>
  );
}

export default MapControls;