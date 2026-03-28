
export function parsePagination(page, limit) {
  const p = parseInt(page)
  const l = parseInt(limit)
  return { page: p, limit: l, skip: (p - 1) * l, take: l }
}

export function buildPaginatedResponse(dataKey, data, total, page, limit) {
  const p = parseInt(page)
  const l = parseInt(limit)
  return {
    [dataKey]: data,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  }
}
