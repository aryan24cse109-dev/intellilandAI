function ParcelInfo({ parcel, loading }) {
  if (loading) {
    return (
      <div className="parcel-info-card">
        <div className="parcel-info-loading">
          Loading parcel information...
        </div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="parcel-info-card">
        <div className="parcel-info-empty">
          <h3>No Parcel Selected</h3>
          <p>
            Select a parcel on the map to view its land
            record information.
          </p>
        </div>
      </div>
    );
  }

  const data = parcel.parcel || parcel.data || parcel;

  return (
    <div className="parcel-info-card">
      <div className="parcel-info-header">
        <div>
          <span className="parcel-info-label">Selected Parcel</span>
          <h2>
            {data.ulpin ||
              data.survey_number ||
              data.survey_no ||
              "Parcel"}
          </h2>
        </div>

        <span className="parcel-verified-badge">
          {data.link_method === "ulpin_exact"
            ? "ULPIN match"
            : data.link_method === "survey_khasra"
              ? "Survey + Khasra"
              : data.link_method === "khasra_location"
                ? "Khasra-based link"
                : "Reference parcel"}
        </span>
      </div>

      <div className="parcel-info-grid">
        <div className="parcel-info-field">
          <span>ULPIN</span>
          <strong>{data.ulpin || "—"}</strong>
        </div>

        <div className="parcel-info-field">
          <span>Survey Number</span>
          <strong>
            {data.survey_number ||
              data.survey_no ||
              "—"}
          </strong>
        </div>

        <div className="parcel-info-field">
          <span>Khasra Number</span>
          <strong>
            {data.khasra_number ||
              data.khasra_no ||
              "—"}
          </strong>
        </div>

        <div className="parcel-info-field">
          <span>Village</span>
          <strong>{data.village || "—"}</strong>
        </div>

        <div className="parcel-info-field">
          <span>Tehsil</span>
          <strong>{data.tehsil || "—"}</strong>
        </div>

        <div className="parcel-info-field">
          <span>District</span>
          <strong>{data.district || "—"}</strong>
        </div>

        <div className="parcel-info-field">
          <span>Area</span>
          <strong>
            {data.area_hectares
              ? `${data.area_hectares} ha`
              : "—"}
          </strong>
        </div>

        <div className="parcel-info-field">
          <span>Land Classification</span>
          <strong>
            {data.land_classification ||
              data.classification ||
              "—"}
          </strong>
        </div>
      </div>

      <div className="parcel-info-source">
        <span className="source-dot"></span>
        Synthetic demo GIS/reference data
      </div>
    </div>
  );
}

export default ParcelInfo;
