import {
  parsePagination,
  buildPaginatedResponse,
} from "../../utils/pagination.js";

describe("Pagination Utility Unit Tests", () => {
  test("parsePagination should calculate skip and take correctly", () => {
    const result = parsePagination("2", "10");
    expect(result).toEqual({
      page: 2,
      limit: 10,
      skip: 10,
      take: 10,
    });
  });

  test("buildPaginatedResponse should return formatted metadata", () => {
    const data = [{ id: 1 }, { id: 2 }];
    const total = 25;
    const page = 2;
    const limit = 10;

    const result = buildPaginatedResponse("items", data, total, page, limit);

    expect(result).toEqual({
      items: data,
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        pages: 3,
      },
    });
  });
});
