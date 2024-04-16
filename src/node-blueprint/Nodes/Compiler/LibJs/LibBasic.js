/* eslint-disable */


var _CORE_CONNECTOR = undefined;
if (!_CORE_CONNECTOR) _CORE_CONNECTOR = {};
var _DEBUG_CONNECTOR = {
  console(type, tag, msg) {
    switch (type) {
      case 'log': console.log(`[${tag}] ${msg}`); break;
      case 'warn': console.warn(`[${tag}] ${msg}`); break;
      case 'error': console.error(`[${tag}] ${msg}`); break;
      case 'info': console.info(`[${tag}] ${msg}`); break;
    }
  },
  reportError(e) {}
};
var _LIB_INTERNAL = {
  idMaker: 0,
  _createCallContext(parent) {
    return {
      parent,
      uid: ++this.idMaker,
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
      getDbg() {
        if (this.dbg)
          return this.dbg;
        if (!parent)
          throw new Error(`Failed to get dbg`);
        return parent.getDbg();
      },
      makeNestCall(cb, dbg) {
        const newContext = _LIB_INTERNAL._createCallContext(this);
        if (_DEBUG_BUILD) {
          newContext.dbg = dbg ? makeDbgDefaults(dbg) : this.dbg;
          debugRunFunction(cb, newContext);
        }
        else
          cb(newContext);
      },
      makeSimpleCall(rps, cb) {
        const ret = cb();
        if (typeof ret !== 'undefined')
          this.makeTemp(rps[0], ret);
      },
    };
  }
};

function startRunFunction(fun, dbg) {
  const newContext = _LIB_INTERNAL._createCallContext();
  if (_DEBUG_BUILD) {
    newContext.dbg = makeDbgDefaults(dbg);
    return debugRunFunction(dbg.uid, fun(newContext));
  }
  return fun(newContext);
}