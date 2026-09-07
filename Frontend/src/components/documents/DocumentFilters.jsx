function DocumentFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  onReset,
}) {
  return (
    <div className="document-filters">
      <div className="document-search-wrapper">
        <span className="document-search-icon">
          ⌕
        </span>

        <input
          type="text"
          value={search}
          onChange={(event) =>
            onSearchChange(
              event.target.value
            )
          }
          placeholder="Search documents..."
          className="document-search-input"
        />
      </div>

      <select
        value={type}
        onChange={(event) =>
          onTypeChange(event.target.value)
        }
        className="document-filter-select"
      >
        <option value="ALL">
          All Types
        </option>

        <option value="ROR">
          ROR
        </option>

        <option value="MUTATION">
          Mutation
        </option>

        <option value="REGISTRATION">
          Registration
        </option>

        <option value="HANDWRITTEN">
          Handwritten
        </option>

        <option value="MAP">
          Map
        </option>
      </select>

      <select
        value={status}
        onChange={(event) =>
          onStatusChange(
            event.target.value
          )
        }
        className="document-filter-select"
      >
        <option value="ALL">
          All Status
        </option>

        <option value="UPLOADED">
          Uploaded
        </option>

        <option value="PROCESSING">
          Processing
        </option>

        <option value="COMPLETED">
          Completed
        </option>

        <option value="NEEDS_REVIEW">
          Needs Review
        </option>

        <option value="FAILED">
          Failed
        </option>
      </select>

      <button
        type="button"
        className="document-reset-button"
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  );
}

export default DocumentFilters;