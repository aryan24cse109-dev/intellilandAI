const express = require("express");

const router = express.Router();

const {
  authenticate,
} = require("../middleware/auth.middleware");

const {
  getParcelById,
  getParcelByDocument,
  getParcelByIdentifiers,
} = require("../controllers/parcel.controller");

/*
|--------------------------------------------------------------------------
| Parcel Routes
|--------------------------------------------------------------------------
*/

/*
 * Get parcel using document UUID
 *
 * IMPORTANT:
 * Keep this route BEFORE /:id
 * so "document" is not treated as a parcel UUID.
 */
router.get(
  "/document/:id",
  authenticate,
  getParcelByDocument
);

/*
 * Get parcel using parcel UUID
 */
router.get(
  "/:id",
  authenticate,
  getParcelById
);

/*
 * Get parcel using ULPIN / Survey / Khasra
 */
router.get(
  "/search",
  authenticate,
  getParcelByIdentifiers
);

module.exports = router;