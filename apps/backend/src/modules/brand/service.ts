// Sama Link · Brand module service — ADR-047.
//
// Auto-generates CRUD methods named after the model: `listBrands`,
// `createBrands`, `retrieveBrand`, `updateBrands`, `deleteBrands`, etc.
// via `MedusaService(...)`. Custom business logic (uniqueness checks,
// cascade effects) goes on top of this class when needed; today the
// generated CRUD covers every call site.

import { MedusaService } from "@medusajs/utils"
import { Brand } from "./models/brand"

class BrandModuleService extends MedusaService({
  Brand,
}) {}

export default BrandModuleService
