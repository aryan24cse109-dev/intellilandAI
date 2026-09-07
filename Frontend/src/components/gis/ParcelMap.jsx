import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";
import L from "leaflet";

import ParcelPopup from "./ParcelPopup";
import MapControls from "./MapControls";

import "leaflet/dist/leaflet.css";

function MapUpdater({ geometry }) {
  const map = useMap();

  useEffect(() => {
    if (!geometry) {
      return;
    }

    try {
      const bounds = L.geoJSON(geometry).getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [40, 40],
        });
      }
    } catch (error) {
      console.error("Unable to fit parcel bounds:", error);
    }
  }, [geometry, map]);

  return null;
}
function ParcelMap({ parcel, onParcelClick }) {
  const data = parcel?.parcel || parcel?.data || parcel;

  const geometry =
    data?.geometry ||
    data?.geojson ||
    data?.geo_json ||
    null;

  const defaultCenter = [26.8467, 80.9462];

  const parcelFeature = geometry
    ? {
        type: "Feature",
        properties: {},
        geometry,
      }
    : null;

  const geoJsonStyle = {
    weight: 3,
    fillOpacity: 0.35,
  };

  const highlightStyle = {
    weight: 4,
    fillOpacity: 0.5,
  };

  const handleEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (onParcelClick) {
          onParcelClick(feature);
        }
      },
      mouseover: (event) => {
        event.target.setStyle(highlightStyle);
      },
      mouseout: (event) => {
        event.target.setStyle(geoJsonStyle);
      },
    });

    if (parcel) {
      layer.bindPopup(
        document.createElement("div")
      );
    }
  };

  return (
    <div className="parcel-map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        scrollWheelZoom={true}
        className="parcel-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapControls />

        {parcelFeature && (
          <>
            <GeoJSON
              key={JSON.stringify(parcelFeature)}
              data={parcelFeature}
              style={geoJsonStyle}
              onEachFeature={handleEachFeature}
            />

            <MapUpdater geometry={geometry} />
          </>
        )}

        {parcel && geometry && (
          <ParcelPopup parcel={parcel} />
        )}
      </MapContainer>

      <div className="map-source-label">
        Map data © OpenStreetMap contributors
      </div>
    </div>
  );
}

export default ParcelMap;