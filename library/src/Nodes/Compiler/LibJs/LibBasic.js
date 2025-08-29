/* eslint-disable */
/**
 * Basic JS runner functions
 */
/*var _CORE_CONNECTOR = undefined;*/
if (!_CORE_CONNECTOR) _CORE_CONNECTOR = {};
if (!_CORE_CONNECTOR.begin) _CORE_CONNECTOR.begin = function() {};
if (!_CORE_CONNECTOR.exit) _CORE_CONNECTOR.exit = function() {};
if (!_DEBUG_CONNECTOR) _DEBUG_CONNECTOR = {};
if (!_DEBUG_CONNECTOR.console) _DEBUG_CONNECTOR.console = function (type, tag, msg) {
  switch (type) {
    case 'log': console.log(`[${tag}] ${msg}`); break;
    case 'warn': console.warn(`[${tag}] ${msg}`); break;
    case 'error': console.error(`[${tag}] ${msg}`); break;
    case 'info': console.info(`[${tag}] ${msg}`); break;
  }
};

var _LIB_INTERNAL = {
  idMaker: 0,
  _createCallContext(parent) {
    return {
      parent,
      uid: ++this.idMaker,
      dbg: undefined,
      temp: new Map(),
      /**
       * Set temp var
       * @param {string} n Name
       * @param {*} v Value
       * @param {number} c Max useage count
       */
      makeTemp(n, v, c = 0) {
        this.temp.set(n, { v, c });
        return v;
      },
      /**
       * Get temp var
       * @param {string} n Name
       * @returns 
       */
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
      /**
       * Get debug values
       * @returns 
       */
      getDbg() {
        if (this.dbg)
          return this.dbg;
        if (!parent)
          throw new Error(`Failed to get dbg`);
        return parent.getDbg();
      },
      /**
       * Start a nest call, create nest call context
       * @param {() => void} cb 
       * @param {*} dbg 
       */
      makeNestCall(cb, dbg) {
        const newContext = _LIB_INTERNAL._createCallContext(this);
        if (_DEBUG_BUILD) {
          newContext.dbg = dbg ? makeDbgDefaults(dbg) : this.dbg;
          debugRunFunction(cb, newContext);
        }
        else {
          cb(newContext);
        }
      },
      /**
       * Start a async nest call, create nest call context when startCb execute done, 
       * @param {(finishCb: () => void) => void} startCb Async start cb
       * @param {() => void} cb Function body
       * @param {*} dbg 
       */
      makeAsyncNestCall(startCb, cb, dbg) {
        const newContext = _LIB_INTERNAL._createCallContext(this);      
        if (_DEBUG_BUILD) {
          newContext.dbg = dbg ? makeDbgDefaults(dbg) : this.dbg;
          const debugContext = debugRunFunction(cb, newContext, true);
          startCb(() => debugContext.start());
        } else {
          startCb(() => cb(newContext));
        }
      },
      /**
       * Make a simple node call
       * @param {*} rps 
       * @param {*} cb 
       */
      makeSimpleCall(rps, cb) {
        const ret = cb();
        if (typeof ret !== 'undefined')
          this.makeTemp(rps[0], ret);
      },
    };
  }
};

/**
 * Start run internal function
 * @param {() => void} fun 
 * @param {*} dbg 
 * @returns 
 */
function startRunFunction(fun, dbg) {
  const newContext = _LIB_INTERNAL._createCallContext();
  if (_DEBUG_BUILD) {
    newContext.dbg = makeDbgDefaults(dbg);
    return debugRunFunction(fun,newContext);
  }
  return fun(newContext);
}