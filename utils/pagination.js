/**
 * Parse page/limit query params into Prisma-ready skip/take values.
 */
export function parsePagination(page, limit) {
  const p = parseInt(page)
  const l = parseInt(limit)
  return { page: p, limit: l, skip: (p - 1) * l, take: l }
}

/**
 * Wrap a data array + total count into a standard paginated response shape.
 * @param {string} dataKey - The key name for the data array (e.g. 'scholarships')
 */
export function buildPaginatedResponse(dataKey, data, total, page, limit) {
  const p = parseInt(page)
  const l = parseInt(limit)
  return {
    [dataKey]: data,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  }
}
