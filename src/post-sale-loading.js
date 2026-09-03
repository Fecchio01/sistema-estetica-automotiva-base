export async function loadPostSaleData(profile, postSale) {
  const [items, templates] = await Promise.all([
    postSale.loadPostSaleFollowUps(profile),
    postSale.ensureDefaultMessageTemplates(profile),
  ])
  const events = await postSale.loadPostSaleFollowUpEvents(profile, items.map((item) => item.id))
  return { items, templates, events }
}
