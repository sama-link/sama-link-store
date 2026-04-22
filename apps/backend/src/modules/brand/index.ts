// Sama Link · Brand module registration — ADR-047.
//
// Registered in `medusa-config.ts` under the `BRAND_MODULE` key. API
// routes (`src/api/admin/brands/...`) resolve the service via
// `req.scope.resolve(BRAND_MODULE)`.

import { Module } from "@medusajs/utils"
import BrandModuleService from "./service"

export const BRAND_MODULE = "brand"

export default Module(BRAND_MODULE, {
  service: BrandModuleService,
})
