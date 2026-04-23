// Sama Link · Translation module service.
//
// Auto-generates CRUD methods named after the model: `listTranslations`,
// `createTranslations`, `retrieveTranslation`, `updateTranslations`,
// `deleteTranslations`, etc. via `MedusaService(...)`.

import { MedusaService } from "@medusajs/utils"
import { Translation } from "./models/translation"

class TranslationModuleService extends MedusaService({
  Translation,
}) {}

export default TranslationModuleService
