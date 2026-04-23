// Sama Link · Translation module registration.
//
// Registered in `medusa-config.ts`. API routes resolve the service via
// `req.scope.resolve(TRANSLATION_MODULE)`.

import { Module } from "@medusajs/utils"
import TranslationModuleService from "./service"

export const TRANSLATION_MODULE = "translation"

export default Module(TRANSLATION_MODULE, {
  service: TranslationModuleService,
})
