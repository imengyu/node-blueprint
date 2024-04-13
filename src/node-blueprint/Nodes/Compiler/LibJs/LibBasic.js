/* eslint-disable */

const _DEBUG_CONNECTOR = {
  console(type, tag, msg) {},
};
const _CC_CONNECTOR = {
  exit() {},
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
        this.makeTemp(rps[0]);
    },
  };
}
function createCallContext(cb0, dbg) {
  const newContext = _createCallContext();
  newContext.dbg = dbg;
  cb0(newContext);
}