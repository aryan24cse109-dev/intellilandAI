import {
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";

import DocumentFilters from "../components/documents/DocumentFilters";
import DocumentTable from "../components/documents/DocumentTable";

import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

import useDocuments from "../hooks/useDocuments";


function Documents() {
  const {
    documents,
    loading,
    error,
    refresh,
  } = useDocuments();


  const [search, setSearch] =
    useState("");

  const [type, setType] =
    useState("ALL");

  const [status, setStatus] =
    useState("ALL");


  /* =========================
     Filter Documents
  ========================= */

  const filteredDocuments = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();


    return documents.filter(
      (document) => {
        const name =
          document?.original_filename ??
          document?.filename ??
          document?.file_name ??
          document?.name ??
          "";


        const documentType =
          document?.document_type ??
          document?.type ??
          "";


        const documentStatus =
          document?.processing_status ??
          document?.status ??
          "";


        const documentId =
          document?.id ??
          document?.document_id ??
          "";


        /* Search */

        const matchesSearch =
          !searchValue ||
          String(name)
            .toLowerCase()
            .includes(searchValue) ||
          String(documentType)
            .toLowerCase()
            .includes(searchValue) ||
          String(documentId)
            .toLowerCase()
            .includes(searchValue);


        /* Type */

        const matchesType =
          type === "ALL" ||
          String(documentType)
            .toUpperCase() === type;


        /* Status */

        const matchesStatus =
          status === "ALL" ||
          String(documentStatus)
            .toUpperCase() === status;


        return (
          matchesSearch &&
          matchesType &&
          matchesStatus
        );
      }
    );
  }, [
    documents,
    search,
    type,
    status,
  ]);


  /* =========================
     Reset Filters
  ========================= */

  const resetFilters = () => {
    setSearch("");
    setType("ALL");
    setStatus("ALL");
  };


  /* =========================
     Render
  ========================= */

  return (
    <div className="content-page documents-page">

      <PageHeader
        title="Documents"
        description="Manage scanned land records and legacy documents."
        actions={
          <Link
            to="/documents/upload"
            className="document-primary-button"
          >
            + Upload Document
          </Link>
        }
      />


      {/* =========================
          Toolbar
      ========================= */}

      <div className="documents-toolbar">

        <DocumentFilters
          search={search}
          onSearchChange={setSearch}

          type={type}
          onTypeChange={setType}

          status={status}
          onStatusChange={setStatus}

          onReset={resetFilters}
        />


        <button
          type="button"
          className="document-refresh-button"
          onClick={refresh}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </div>


      {/* =========================
          Loading
      ========================= */}

      {loading ? (

        <div className="documents-loading">

          <Loader
            size="large"
            text="Loading documents..."
          />

        </div>

      ) : error ? (

        /* =========================
           Error
        ========================= */

        <ErrorMessage
          title="Unable to load documents"
          message={error}
          onRetry={refresh}
        />

      ) : (

        /* =========================
           Documents
        ========================= */

        <div className="documents-panel">

          <div className="documents-panel-header">

            <div>

              <h2>
                Land Records
              </h2>

              <p>
                Showing{" "}
                <strong>
                  {filteredDocuments.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {documents.length}
                </strong>{" "}
                documents
              </p>

            </div>

          </div>


          <DocumentTable
            documents={
              filteredDocuments
            }
          />

        </div>
      )}

    </div>
  );
}


export default Documents;