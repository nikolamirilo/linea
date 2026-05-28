const storage = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  getSecret: jest.fn(),
  setSecret: jest.fn(),
  deleteSecret: jest.fn(),
};

const mockFetch = jest.fn();

const webTrigger = {
  getUrl: jest.fn(async (key) => `https://example.com/x/${key}`),
};

const route = (strings, ...values) => {
  let result = '';
  strings.forEach((str, i) => {
    result += str + (values[i] || '');
  });
  return result;
};

const api = {
  asUser: () => ({
    requestConfluence: jest.fn(),
  }),
  asApp: () => ({
    requestConfluence: jest.fn(),
  }),
};

module.exports = {
  storage,
  fetch: mockFetch,
  webTrigger,
  route,
  __esModule: true,
  default: api,
};
