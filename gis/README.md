# IntelliLandAI — GIS Module

## Overview

The GIS module of **IntelliLandAI** provides a synthetic geospatial representation of land parcels and related map features. It supports visualization, validation, and future integration of digitized land-record information.

The GIS data is based on the project's **synthetic ground-truth dataset**, including ROR, mutation, registration, and handwritten land records.

> **Important:** All land-record and geographic information in this module is synthetic/demo data. It is **not official government cadastral data**.

## Synthetic Parcel Dataset

Unique parcels were identified by comparing the synthetic records using Khasra number, village, survey number, area, and related source records.

The current mapping contains three unique synthetic parcels:

| Parcel ID | Synthetic ULPIN-like ID | Khasra | Survey Number | Village | Tehsil | District | Area (ha) |
|---|---|---|---|---|---|---|---:|
| P001 | ULPIN-SYN-P001 | 741/3 | SV-402 | Gopalpur | Devgarh | Surajpur | 1.8500 |
| P002 | ULPIN-SYN-P002 | 589/2 | 205/8 | Chandanpur | Anandnagar | Rampur | 1.2500 |
| P003 | ULPIN-SYN-P003 | 1042/1 | Not provided | Sundarpur | Gopalpur | Vijaynagar | 2.4100 |

All parcel IDs and ULPIN-like identifiers are explicitly synthetic.

## Directory Structure

```text
gis/
├── geojson/
│   ├── parcels.geojson
│   ├── roads.geojson
│   └── buildings.geojson
├── qgis/
│   ├── intelliland.gpkg
│   └── intelliland.qgz
├── data/
│   └── synthetic/
│       └── parcel_mapping.csv
└── README.md
```

## Parcel Attribute Schema

| Field | Description |
|---|---|
| `parcel_id` | Synthetic unique parcel identifier |
| `ulpin_synth` | Synthetic ULPIN-like identifier |
| `survey_number` | Survey number where available |
| `khasra_number` | Khasra number |
| `village` | Village name |
| `tehsil` | Tehsil name |
| `district` | District name |
| `area_hectares` | Parcel area in hectares |
| `source` | Synthetic source records associated with the parcel |

## GeoJSON Layers

The `geojson/` directory contains:

- **parcels.geojson** — synthetic parcel polygons and attributes
- **roads.geojson** — synthetic road features
- **buildings.geojson** — synthetic building features

These files can later be used by web-mapping applications or other geospatial systems.

## QGIS Project

The `qgis/` directory contains:

- **intelliland.qgz** — QGIS project
- **intelliland.gpkg** — GeoPackage containing the GIS layers

QGIS was used to create the synthetic geometries, assign attributes, validate geometry, and export the final GeoJSON layers.

## Coordinate Reference System

**EPSG:4326 — WGS 84**

The GIS layers use this CRS for geographic coordinates and GeoJSON compatibility.

## Validation

The final parcel GeoJSON was checked for:

- Invalid geometries
- Duplicate parcel IDs
- Missing required attributes
- Duplicate/problematic coordinates
- Inconsistent Khasra/Village mappings
- CRS issues

The final parcel geometry validation resulted in **3 valid geometries and 0 invalid geometries**.

Validation was performed without changing the underlying synthetic land-record values.

## Synthetic Data Disclaimer

This module is intended for development, demonstration, testing, and prototyping only.

- The records are synthetic.
- Parcel IDs and ULPIN-like identifiers are synthetic.
- Geographic geometries are synthetic.
- The data does not represent official cadastral boundaries.
- This data must not be used for legal ownership, registration, surveying, taxation, or any other official land-record purpose.

## Future Use

The GIS outputs can later support:

- Interactive parcel visualization
- Land-record lookup
- Spatial validation
- Parcel-to-record linking
- PostgreSQL/PostGIS integration
- Web-map visualization
