class Resolver {
  constructor() {
    this._definitions = {};
  }

  define(name, fn) {
    this._definitions[name] = fn;
  }

  getDefinitions() {
    return this._definitions;
  }
}

// Match the real @forge/resolver: default export wrapped via ESM interop.
module.exports = { default: Resolver };
module.exports.default = Resolver;
