"""
ai-service/schema.py

Pydantic schemas for Indian Land Record documents:
- Mutation Document (Namantaran Aadesh / नामांतरण आदेश)
- Handwritten Legacy Revenue Record (पुरातन राजस्व रजिस्टर प्रविष्टि)
- Property Registration Sale Deed (संपत्ति विक्रय विलेख)
- Record of Rights / Khatauni (अधिकार अभिलेख / खतौनी)
- Unified Land Record Schema (for cross-document normalization and AI extraction)

Design principles:
- Appropriate data types (float for area in hectares/acres, dates, strings for alphanumeric IDs).
- Optional with default None for all variable fields across records.
- Optional with default None for all Hindi fields (*_hindi).
- Pre-validators for flexible coercion of strings to numeric areas and dates.
"""

from __future__ import annotations

import re
from datetime import date
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator


# =============================================================================
# Helper Utilities & Pre-Validators
# =============================================================================

def parse_numeric_area(v: Any) -> Optional[float]:
    """
    Parses numeric area from float, int, or string representations.
    Handles unit suffixes (e.g. 'ha', 'hectares', 'acres') and comma separators.
    """
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        cleaned = v.strip()
        if not cleaned or cleaned.lower() in ("null", "none", "n/a", "na", "-", "nil"):
            return None
        # Strip common textual suffixes/units
        cleaned = re.sub(r"(?i)\b(hectares?|ha|acres?|sq\.?\s*m\.?)\b", "", cleaned)
        cleaned = cleaned.replace(",", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


class DocumentCategory(str, Enum):
    """Categorical classification of Indian land record documents."""
    MUTATION = "MUTATION"
    HANDWRITTEN = "HANDWRITTEN"
    REGISTRATION = "REGISTRATION"
    ROR = "ROR"
    UNKNOWN = "UNKNOWN"


# =============================================================================
# Base Land Record Schema
# =============================================================================

class BaseLandRecordSchema(BaseModel):
    """
    Base schema defining core location and parcel identifiers common across
    Indian land record documents.
    """
    model_config = ConfigDict(
        extra="ignore",
        populate_by_name=True,
        str_strip_whitespace=True,
        validate_assignment=True,
    )

    # Core document classification
    document_type: str = Field(
        description="Full title or header identifying the document type and legal authority"
    )

    # Administrative Geography - English (Mandatory core identifiers)
    village_english: str = Field(
        description="Revenue village (Mauza / Gram) name in English"
    )
    tehsil_english: str = Field(
        description="Tehsil / Taluka / Sub-district name in English"
    )
    district_english: str = Field(
        description="Revenue district name in English"
    )

    # Administrative Geography - Hindi (Optional in all models)
    village_hindi: Optional[str] = Field(
        default=None,
        description="Revenue village name in Devanagari Hindi"
    )
    tehsil_hindi: Optional[str] = Field(
        default=None,
        description="Tehsil / Taluka name in Devanagari Hindi"
    )
    district_hindi: Optional[str] = Field(
        default=None,
        description="District name in Devanagari Hindi"
    )

    # Cadastral parcel identifier
    khasra_number: str = Field(
        description="Plot / survey / parcel number (खसरा संख्या), e.g. '741/3', '589/2'"
    )

    # Land area in standard metric unit
    land_area_hectares: Optional[float] = Field(
        default=None,
        description="Parcel area measured in hectares (हेक्टेयर)"
    )

    @field_validator("land_area_hectares", mode="before")
    @classmethod
    def _validate_area_hectares(cls, v: Any) -> Optional[float]:
        return parse_numeric_area(v)


# =============================================================================
# 1. Mutation Document Schema (नामांतरण आदेश)
# =============================================================================

class MutationDocumentSchema(BaseLandRecordSchema):
    """
    Schema for Land Mutation Register Entries / Namantaran Aadesh (नामांतरण आदेश).
    Reflects change in land ownership due to inheritance, sale, or partition.
    """
    # Document Identifiers & Dates
    mutation_number: str = Field(
        description="Official mutation record number, e.g. 'MUT-2026-88319'"
    )
    mutation_date: Optional[Union[date, str]] = Field(
        default=None,
        description="Date of mutation approval or order issuance (e.g. '22-Jul-2026')"
    )
    order_reference_number: Optional[str] = Field(
        default=None,
        description="Revenue court order reference number, e.g. 'REV-ORD/2026/0914'"
    )

    # Khata / Ledger
    khata_number: Optional[str] = Field(
        default=None,
        description="Khata / Khewat ledger account number (खाता संख्या), e.g. '96/B'"
    )

    # Previous Owner (Transferor / Deceased)
    previous_owner_english: Optional[str] = Field(
        default=None,
        description="Name of previous owner / deceased in English"
    )
    previous_owner_hindi: Optional[str] = Field(
        default=None,
        description="Name of previous owner / deceased in Devanagari Hindi"
    )

    # New Owner (Transferee / Heir)
    new_owner_english: Optional[str] = Field(
        default=None,
        description="Name of newly mutated owner / heir in English"
    )
    new_owner_hindi: Optional[str] = Field(
        default=None,
        description="Name of newly mutated owner / heir in Devanagari Hindi"
    )

    # Succession / Transfer Reason
    relation_reason_english: Optional[str] = Field(
        default=None,
        description="Grounds or legal reason for transfer (e.g. 'Inheritance (Son) / Legal Heir')"
    )
    relation_reason_hindi: Optional[str] = Field(
        default=None,
        description="Grounds or legal reason in Hindi (e.g. 'उत्तराधिकार (पुत्र) / विधिक वारिस')"
    )
    mutation_type: Optional[str] = Field(
        default=None,
        description="Type of mutation (e.g. 'Inheritance / वरासत (उत्तराधिकार)')"
    )

    # Land Area Measurements
    land_area_acres: Optional[float] = Field(
        default=None,
        description="Parcel area measured in acres"
    )

    # Endorsements & Remarks
    remarks_english: Optional[str] = Field(
        default=None,
        description="Official notes or order remarks in English"
    )
    remarks_hindi: Optional[str] = Field(
        default=None,
        description="Official notes or order remarks in Devanagari Hindi"
    )

    @field_validator("land_area_acres", mode="before")
    @classmethod
    def _validate_area_acres(cls, v: Any) -> Optional[float]:
        return parse_numeric_area(v)


# =============================================================================
# 2. Handwritten Legacy Revenue Record Schema (पुरातन राजस्व रजिस्टर प्रविष्टि)
# =============================================================================

class HandwrittenDocumentSchema(BaseLandRecordSchema):
    """
    Schema for Legacy Handwritten Revenue Register Records (पुरातन राजस्व रजिस्टर प्रविष्टि).
    Typically older historical revenue records featuring vernacular units (Bigha/Biswa).
    """
    # Record Identifiers & Dates
    record_reference_number: str = Field(
        description="Legacy record reference or register folio number, e.g. 'LEGACY-1984/8892'"
    )
    record_date: Optional[Union[date, str]] = Field(
        default=None,
        description="Historical entry date (e.g. '15-Oct-1984')"
    )

    # Khata / Ledger
    khata_number: Optional[str] = Field(
        default=None,
        description="Khata / Khewat ledger account number (खाता संख्या), e.g. '96/B'"
    )

    # Landholder / Owner Information
    owner_name_english: Optional[str] = Field(
        default=None,
        description="Primary landholder name in English"
    )
    owner_name_hindi: Optional[str] = Field(
        default=None,
        description="Primary landholder name in Devanagari Hindi"
    )
    father_name_english: Optional[str] = Field(
        default=None,
        description="Landholder's father/husband name in English"
    )
    father_name_hindi: Optional[str] = Field(
        default=None,
        description="Landholder's father/husband name in Devanagari Hindi"
    )

    # Traditional & Metric Land Area
    land_area_bigha: Optional[str] = Field(
        default=None,
        description="Traditional land area unit string (e.g. '2 बीघा 4 बिस्वा', '1 बीघा 2 बिस्वा')"
    )

    # Land Classification
    land_classification_english: Optional[str] = Field(
        default=None,
        description="Soil / irrigation classification in English (e.g. 'Agricultural Land (Canal Irrigated)')"
    )
    land_classification_hindi: Optional[str] = Field(
        default=None,
        description="Soil / irrigation classification in Hindi (e.g. 'कृषि भूमि (नहरी)')"
    )

    # Endorsements & Remarks
    remarks_english: Optional[str] = Field(
        default=None,
        description="Revenue officer legacy remarks in English"
    )
    remarks_hindi: Optional[str] = Field(
        default=None,
        description="Revenue officer legacy remarks in Devanagari Hindi"
    )


# =============================================================================
# 3. Property Registration Sale Deed Schema (संपत्ति विक्रय विलेख)
# =============================================================================

class RegistrationDocumentSchema(BaseLandRecordSchema):
    """
    Schema for Sub-Registrar Office Property Sale Deeds / Registry (संपत्ति विक्रय विलेख).
    Captures transaction details between buyer and seller, financial valuation, and witnesses.
    """
    # Registration Identifiers & Dates
    registration_number: str = Field(
        description="Deed registration number assigned by Sub-Registrar, e.g. 'REG-2026-004812'"
    )
    registration_date: Optional[Union[date, str]] = Field(
        default=None,
        description="Date of deed registration and execution (e.g. '14-Aug-2026')"
    )

    # Parties Involved
    seller_name: Optional[str] = Field(
        default=None,
        description="Full name of seller (विक्रेता), often bilingual (e.g. 'Ramesh Chandra Verma (रमेश चंद्र वर्मा)')"
    )
    seller_father_name: Optional[str] = Field(
        default=None,
        description="Seller's father / spouse name (e.g. 'Late Badri Prasad Verma (स्व. बद्री प्रसाद वर्मा)')"
    )
    buyer_name: Optional[str] = Field(
        default=None,
        description="Full name of buyer (क्रेता), often bilingual (e.g. 'Anil Kumar Srivastava (अनिल कुमार श्रीवास्तव)')"
    )
    buyer_father_name: Optional[str] = Field(
        default=None,
        description="Buyer's father / spouse name (e.g. 'Harish Chandra Srivastava (हरीश चंद्र श्रीवास्तव)')"
    )

    # Cadastral & Survey References
    survey_number: Optional[str] = Field(
        default=None,
        description="Survey number or municipal survey code (e.g. 'SV-402', '205/8')"
    )

    # Land Area Measurements
    land_area_acres: Optional[float] = Field(
        default=None,
        description="Parcel area measured in acres"
    )

    # Property Description & Boundaries
    property_description: Optional[str] = Field(
        default=None,
        description="Legal description of the property, boundaries, easements, and location"
    )

    # Financial & Stamp Consideration
    consideration_value_inr: Optional[Union[float, str]] = Field(
        default=None,
        description="Total sale consideration value (e.g. '₹ 4,500,000 (INR Forty-Five Lakhs Only)')"
    )
    stamp_duty_paid_inr: Optional[Union[float, str]] = Field(
        default=None,
        description="Stamp duty and registration fees paid (e.g. '₹ 315,000')"
    )

    # Witnesses & Registry Remarks
    witness_1: Optional[str] = Field(
        default=None,
        description="Details of witness 1, including address and identification"
    )
    witness_2: Optional[str] = Field(
        default=None,
        description="Details of witness 2, including address and identification"
    )
    remarks: Optional[str] = Field(
        default=None,
        description="Sub-Registrar office verification and clearance remarks"
    )

    @field_validator("land_area_acres", mode="before")
    @classmethod
    def _validate_area_acres(cls, v: Any) -> Optional[float]:
        return parse_numeric_area(v)


# =============================================================================
# 4. Record of Rights (RoR) / Khatauni Schema (अधिकार अभिलेख / खतौनी)
# =============================================================================

class RORDocumentSchema(BaseLandRecordSchema):
    """
    Schema for Record of Rights (RoR) / Khatauni / Jamabandi (अधिकार अभिलेख / खतौनी).
    Official register recording ownership, land classification, shares, and tax liability.
    """
    # Record Identifiers & Dates
    record_entry_number: Optional[str] = Field(
        default=None,
        description="RoR register serial or entry number, e.g. 'ROR-2026-90812'"
    )
    issue_date: Optional[Union[date, str]] = Field(
        default=None,
        description="Date of certified RoR copy issuance (e.g. '12-May-2026')"
    )

    # Khata / Ledger
    khata_number: Optional[str] = Field(
        default=None,
        description="Khata / Khewat ledger account number (खाता संख्या), e.g. '142/A'"
    )

    # Landholder / Owner Details
    owner_name_english: Optional[str] = Field(
        default=None,
        description="Name of registered landholder in English"
    )
    owner_name_hindi: Optional[str] = Field(
        default=None,
        description="Name of registered landholder in Devanagari Hindi"
    )
    father_husband_name_english: Optional[str] = Field(
        default=None,
        description="Father / Husband name of landholder in English"
    )
    father_husband_name_hindi: Optional[str] = Field(
        default=None,
        description="Father / Husband name of landholder in Devanagari Hindi"
    )

    # Land Area Measurements
    land_area_acres: Optional[float] = Field(
        default=None,
        description="Parcel area measured in acres"
    )

    # Land Classification & Share
    land_classification_english: Optional[str] = Field(
        default=None,
        description="Land usage / irrigation classification in English (e.g. 'Agricultural Land (Irrigated / Double-cropped)')"
    )
    land_classification_hindi: Optional[str] = Field(
        default=None,
        description="Land usage / irrigation classification in Devanagari Hindi (e.g. 'कृषि भूमि (सिंचित / दोफसली)')"
    )
    ownership_share: Optional[str] = Field(
        default=None,
        description="Fractional share in the holding (e.g. '1/1 (पूर्ण स्वामित्व / Full Ownership)', '1/2')"
    )

    # Land Revenue Assessment
    annual_revenue_inr: Optional[Union[float, str]] = Field(
        default=None,
        description="Annual land revenue / lagan assessment in INR (e.g. '₹ 185.00')"
    )

    # Encumbrances & Remarks
    remarks_english: Optional[str] = Field(
        default=None,
        description="Encumbrance and dispute remarks in English"
    )
    remarks_hindi: Optional[str] = Field(
        default=None,
        description="Encumbrance and dispute remarks in Devanagari Hindi"
    )

    @field_validator("land_area_acres", mode="before")
    @classmethod
    def _validate_area_acres(cls, v: Any) -> Optional[float]:
        return parse_numeric_area(v)


# =============================================================================
# 5. Unified Land Record Schema (Cross-Document Normalization & AI Extraction)
# =============================================================================

class UnifiedLandRecordSchema(BaseModel):
    """
    Unified Land Record Schema consolidating all attributes across Mutation,
    Handwritten, Registration, and RoR records.

    Suitable for:
    - AI OCR entity extraction when document type is broad or hybrid.
    - Database synchronization into `land_records`, `owners`, and related tables.
    - Comprehensive validation against ground truth data.
    """
    model_config = ConfigDict(
        extra="ignore",
        populate_by_name=True,
        str_strip_whitespace=True,
        validate_assignment=True,
    )

    # Document Classification & Reference Numbers
    document_type: Optional[str] = Field(
        default=None,
        description="Document type / title header"
    )
    mutation_number: Optional[str] = Field(
        default=None,
        description="Mutation record number (Mutation)"
    )
    registration_number: Optional[str] = Field(
        default=None,
        description="Sub-Registrar deed registration number (Registration)"
    )
    record_reference_number: Optional[str] = Field(
        default=None,
        description="Legacy revenue reference number (Handwritten)"
    )
    record_entry_number: Optional[str] = Field(
        default=None,
        description="RoR register serial number (RoR)"
    )
    order_reference_number: Optional[str] = Field(
        default=None,
        description="Revenue court order reference number (Mutation)"
    )

    # Dates
    mutation_date: Optional[Union[date, str]] = Field(
        default=None,
        description="Date of mutation approval"
    )
    registration_date: Optional[Union[date, str]] = Field(
        default=None,
        description="Date of deed registration"
    )
    record_date: Optional[Union[date, str]] = Field(
        default=None,
        description="Legacy record date"
    )
    issue_date: Optional[Union[date, str]] = Field(
        default=None,
        description="RoR certified copy issuance date"
    )

    # Administrative Geography - English
    village_english: Optional[str] = Field(
        default=None,
        description="Village name in English"
    )
    tehsil_english: Optional[str] = Field(
        default=None,
        description="Tehsil name in English"
    )
    district_english: Optional[str] = Field(
        default=None,
        description="District name in English"
    )

    # Administrative Geography - Hindi (Optional)
    village_hindi: Optional[str] = Field(
        default=None,
        description="Village name in Hindi"
    )
    tehsil_hindi: Optional[str] = Field(
        default=None,
        description="Tehsil name in Hindi"
    )
    district_hindi: Optional[str] = Field(
        default=None,
        description="District name in Hindi"
    )

    # Cadastral Identifiers
    khasra_number: Optional[str] = Field(
        default=None,
        description="Khasra / parcel plot number"
    )
    khata_number: Optional[str] = Field(
        default=None,
        description="Khata / ledger account number"
    )
    survey_number: Optional[str] = Field(
        default=None,
        description="Survey number"
    )

    # Owner & Party Details - English & Combined
    owner_name_english: Optional[str] = Field(
        default=None,
        description="Registered owner name in English"
    )
    father_name_english: Optional[str] = Field(
        default=None,
        description="Owner father name in English"
    )
    father_husband_name_english: Optional[str] = Field(
        default=None,
        description="Owner father/husband name in English"
    )
    previous_owner_english: Optional[str] = Field(
        default=None,
        description="Previous owner name in English"
    )
    new_owner_english: Optional[str] = Field(
        default=None,
        description="New owner name in English"
    )
    seller_name: Optional[str] = Field(
        default=None,
        description="Seller name (bilingual or English)"
    )
    seller_father_name: Optional[str] = Field(
        default=None,
        description="Seller father name"
    )
    buyer_name: Optional[str] = Field(
        default=None,
        description="Buyer name (bilingual or English)"
    )
    buyer_father_name: Optional[str] = Field(
        default=None,
        description="Buyer father name"
    )

    # Owner & Party Details - Hindi (Optional)
    owner_name_hindi: Optional[str] = Field(
        default=None,
        description="Owner name in Devanagari Hindi"
    )
    father_name_hindi: Optional[str] = Field(
        default=None,
        description="Owner father name in Devanagari Hindi"
    )
    father_husband_name_hindi: Optional[str] = Field(
        default=None,
        description="Owner father/husband name in Devanagari Hindi"
    )
    previous_owner_hindi: Optional[str] = Field(
        default=None,
        description="Previous owner name in Devanagari Hindi"
    )
    new_owner_hindi: Optional[str] = Field(
        default=None,
        description="New owner name in Devanagari Hindi"
    )

    # Relations & Mutation Details
    relation_reason_english: Optional[str] = Field(
        default=None,
        description="Relation or succession reason in English"
    )
    relation_reason_hindi: Optional[str] = Field(
        default=None,
        description="Relation or succession reason in Devanagari Hindi"
    )
    mutation_type: Optional[str] = Field(
        default=None,
        description="Mutation type category"
    )
    ownership_share: Optional[str] = Field(
        default=None,
        description="Ownership fraction or share description"
    )

    # Land Area Measurements
    land_area_hectares: Optional[float] = Field(
        default=None,
        description="Land area in hectares"
    )
    land_area_acres: Optional[float] = Field(
        default=None,
        description="Land area in acres"
    )
    land_area_bigha: Optional[str] = Field(
        default=None,
        description="Land area in traditional Bigha / Biswa string"
    )

    # Land Classification
    land_classification_english: Optional[str] = Field(
        default=None,
        description="Classification of land in English"
    )
    land_classification_hindi: Optional[str] = Field(
        default=None,
        description="Classification of land in Devanagari Hindi"
    )

    # Property Description & Transaction Details
    property_description: Optional[str] = Field(
        default=None,
        description="Detailed legal property description"
    )
    consideration_value_inr: Optional[Union[float, str]] = Field(
        default=None,
        description="Total transaction value in INR"
    )
    stamp_duty_paid_inr: Optional[Union[float, str]] = Field(
        default=None,
        description="Stamp duty amount in INR"
    )
    annual_revenue_inr: Optional[Union[float, str]] = Field(
        default=None,
        description="Annual revenue tax in INR"
    )

    # Witnesses
    witness_1: Optional[str] = Field(
        default=None,
        description="Details of witness 1"
    )
    witness_2: Optional[str] = Field(
        default=None,
        description="Details of witness 2"
    )

    # Remarks & Endorsements
    remarks_english: Optional[str] = Field(
        default=None,
        description="Remarks in English"
    )
    remarks_hindi: Optional[str] = Field(
        default=None,
        description="Remarks in Devanagari Hindi"
    )
    remarks: Optional[str] = Field(
        default=None,
        description="General remarks (e.g. from registration deeds)"
    )

    @field_validator("land_area_hectares", "land_area_acres", mode="before")
    @classmethod
    def _validate_areas(cls, v: Any) -> Optional[float]:
        return parse_numeric_area(v)


# =============================================================================
# Type Aliases & Union
# =============================================================================

MutationSchema = MutationDocumentSchema
HandwrittenSchema = HandwrittenDocumentSchema
LegacyRevenueSchema = HandwrittenDocumentSchema
RegistrationSchema = RegistrationDocumentSchema
SaleDeedSchema = RegistrationDocumentSchema
RORSchema = RORDocumentSchema
KhatauniSchema = RORDocumentSchema
LandRecordSchema = UnifiedLandRecordSchema

LandDocumentType = Union[
    MutationDocumentSchema,
    HandwrittenDocumentSchema,
    RegistrationDocumentSchema,
    RORDocumentSchema,
]


# =============================================================================
# Factory & Parsing Helpers
# =============================================================================

def detect_document_category(data: Dict[str, Any]) -> DocumentCategory:
    """
    Detects the document category from raw dictionary keys or document_type string.
    """
    doc_type = str(data.get("document_type", "")).lower()

    if "mutation" in doc_type or "namantaran" in doc_type or "नामांतरण" in doc_type or "mutation_number" in data:
        return DocumentCategory.MUTATION
    if "legacy" in doc_type or "handwritten" in doc_type or "पुरातन" in doc_type or "record_reference_number" in data:
        return DocumentCategory.HANDWRITTEN
    if "sub-registrar" in doc_type or "sale deed" in doc_type or "विक्रय" in doc_type or "registration_number" in data:
        return DocumentCategory.REGISTRATION
    if "record of rights" in doc_type or "khatauni" in doc_type or "खतौनी" in doc_type or "record_entry_number" in data:
        return DocumentCategory.ROR

    return DocumentCategory.UNKNOWN


def parse_land_document(data: Union[Dict[str, Any], str]) -> LandDocumentType:
    """
    Validates and parses raw dictionary data, JSON string, or JSON file path into
    the appropriate specific Pydantic schema.
    If the document category cannot be determined, falls back to UnifiedLandRecordSchema.
    """
    if isinstance(data, str):
        import os, json
        trimmed = data.strip()
        if os.path.isfile(trimmed):
            with open(trimmed, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = json.loads(trimmed)

    category = detect_document_category(data)

    if category == DocumentCategory.MUTATION:
        return MutationDocumentSchema.model_validate(data)
    elif category == DocumentCategory.HANDWRITTEN:
        return HandwrittenDocumentSchema.model_validate(data)
    elif category == DocumentCategory.REGISTRATION:
        return RegistrationDocumentSchema.model_validate(data)
    elif category == DocumentCategory.ROR:
        return RORDocumentSchema.model_validate(data)
    else:
        # Fallback to UnifiedLandRecordSchema
        return UnifiedLandRecordSchema.model_validate(data)
