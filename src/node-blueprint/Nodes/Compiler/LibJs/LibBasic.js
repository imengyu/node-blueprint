/* eslint-disable */

const _DEBUG_CONNECTOR = {
  console(type, tag, msg) {
    switch (type) {
      case 'log': console.log(`[${tag}] ${msg}`); break;
      case 'warn': console.warn(`[${tag}] ${msg}`); break;
      case 'error': console.error(`[${tag}] ${msg}`); break;
      case 'info': console.info(`[${tag}] ${msg}`); break;
    }
  },
};
const _CORE_CONNECTOR = {
  begin() {},
  exit() {},
  platform() { return 'js:web' },
};

function _createCallContext(parent) {
  return {
    parent,
    dbg: undefined,
    temp: new Map(),
    makeTemp(n, v, c = 0) {
      this.temp.set(n, { v, c });
    },
    getTemp(n) {
      const val = this.temp.get(n);
      if (val) {
        if (val.c > 0) {
          val.c--;
          if (val.c === 0)
            this.temp.delete(n);
        }
        return val.v;
      }
      if (!parent)
        throw new Error(`Failed to get temp var ${n}`);
      return parent.getTemp(n);
    },
    makeNestCall(cb, dbg) {
      const newContext = _createCallContext(this);
      newContext.dbg = dbg;
      cb(newContext);
    },
    makeSimpleCall(rps, cb) {
      const ret = cb();
      if (typeof ret !== 'undefined')
        this.makeTemp(rps[0], ret);
    },
  };
}
function createCallContext(cb0, dbg) {
  const newContext = _createCallContext();
  newContext.dbg = dbg;
  cb0(newContext);
}