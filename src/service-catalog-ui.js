import { defaultServiceCatalog, removeServiceFromCatalog, updateServiceInCatalog } from './service-catalog.js'

globalThis.__serviceCatalog = [...defaultServiceCatalog]
globalThis.__removeServiceFromCatalog = (serviceId) => {
  globalThis.__serviceCatalog = removeServiceFromCatalog(globalThis.__serviceCatalog || [], serviceId)
  document.dispatchEvent(new CustomEvent('service-catalog-changed'))
  return globalThis.__serviceCatalog
}

globalThis.__updateServiceInCatalog = (serviceId, changes) => {
  globalThis.__serviceCatalog = updateServiceInCatalog(globalThis.__serviceCatalog || [], serviceId, changes)
  document.dispatchEvent(new CustomEvent('service-catalog-changed'))
  return globalThis.__serviceCatalog
}
