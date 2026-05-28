const sql = jest.fn().mockImplementation((strings, ...values) => {
  return Promise.resolve({ rows: [] });
});

module.exports = { sql };
