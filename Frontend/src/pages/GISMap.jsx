import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";
import ParcelMap from "../components/gis/ParcelMap";
import ParcelInfo from "../components/gis/ParcelInfo";

import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

import {
  getParcelById,
  getParcelByDocumentId,
} from "../services/parcel.service";

function GISMap() {
  const [searchParams] = useSearchParams();

  const parcelId = searchParams.get("parcelId") ;
  const documentId = searchParams.get("documentId");

  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  
    useEffect(() => {
  const loadParcel = async () => {
    if (!documentId && !parcelId) {
      setLoading(false);
      setParcel(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      let response;

      if (documentId) {
        response =
          await getParcelByDocumentId(documentId);
      } else {
        response =
          await getParcelById(parcelId);
      }

      const parcelData =
        response?.data ||
        response?.parcel ||
        response;

      setParcel(parcelData);
    } catch (err) {
      console.error(
        "Failed to load parcel:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load parcel information."
      );
    } finally {
      setLoading(false);
    }
  };

  loadParcel();
}, [documentId, parcelId]);

  if (loading) {
    return (
      <div className="content-page">
        <PageHeader
          title="GIS Parcel Map"
          subtitle="View and locate land parcels on the map"
        />

        <div className="gis-loading-state">
          <Loader
            size="large"
            text="Loading parcel data..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="content-page gis-page">
      <PageHeader
        title="GIS Parcel Map"
        subtitle="View and locate the corresponding land parcel"
      />

      {error && (
        <div className="gis-error-wrapper">
          <ErrorMessage message={error} />
        </div>
      )}

      <div className="gis-layout">
        <div className="gis-map-panel">
          <div className="gis-map-header">
            <div>
              <h2>Parcel Location</h2>
              <p>
                Spatial representation of the selected
                land parcel
              </p>
            </div>

            <span className="gis-status-badge">
              GIS
            </span>
          </div>

          <ParcelMap parcel={parcel} />
        </div>

        <ParcelInfo
          parcel={parcel}
          loading={loading}
        />
      </div>

      <div className="gis-bottom-navigation">
        <Link
          to="/documents"
          className="document-next-module-button secondary"
        >
          ← Back to Documents
        </Link>

        <div className="gis-source-note">
          Parcel geometry is displayed from the configured
          spatial reference source.
        </div>
      </div>
    </div>
  );
}

export default GISMap;