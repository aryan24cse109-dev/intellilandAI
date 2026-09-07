import { Popup } from "react-leaflet";

function ParcelPopup({ parcel }) {
  if (!parcel) {
    return (
      <Popup>
        <div>
          <strong>Parcel</strong>
          <p>No parcel information available.</p>
        </div>
      </Popup>
    );
  }

  const data = parcel.parcel || parcel.data || parcel;

  return (
    <Popup>
      <div className="parcel-popup">
        <h3>Parcel Information</h3>

        <div className="parcel-popup-row">
          <span>Parcel ID</span>
          <strong>{data.id || data.parcel_id || "—"}</strong>
        </div>

        <div className="parcel-popup-row">
          <span>ULPIN</span>
          <strong>{data.ulpin || "—"}</strong>
        </div>

        <div className="parcel-popup-row">
          <span>Survey No.</span>
          <strong>{data.survey_number || data.survey_no || "—"}</strong>
        </div>

        <div className="parcel-popup-row">
          <span>Khasra No.</span>
          <strong>{data.khasra_number || data.khasra_no || "—"}</strong>
        </div>

        <div className="parcel-popup-row">
          <span>Village</span>
          <strong>{data.village || "—"}</strong>
        </div>

        <div className="parcel-popup-row">
          <span>Area</span>
          <strong>
            {data.area ? `${data.area} sq.m` : "—"}
          </strong>
        </div>

        <div className="parcel-source-badge">
          Source: Government Reference Data
        </div>
      </div>
    </Popup>
  );
}

export default ParcelPopup;