const _DEBUG_BUILD = false;
/* eslint-disable */ var _CORE_CONNECTOR = undefined;
if (!_CORE_CONNECTOR) _CORE_CONNECTOR = {};
if (!_CORE_CONNECTOR.begin) _CORE_CONNECTOR.begin = function () {};
if (!_CORE_CONNECTOR.exit) _CORE_CONNECTOR.exit = function () {};
var _DEBUG_CONNECTOR = {
  console(type, tag, msg) {
    switch (type) {
      case "log":
        console.log(`[${tag}] ${msg}`);
        break;
      case "warn":
        console.warn(`[${tag}] ${msg}`);
        break;
      case "error":
        console.error(`[${tag}] ${msg}`);
        break;
      case "info":
        console.info(`[${tag}] ${msg}`);
        break;
    }
  },
  reportError(e) {},
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
            if (val.c === 0) this.temp.delete(n);
          }
          return val.v;
        }
        if (!parent) throw new Error(`Failed to get temp var ${n}`);
        return parent.getTemp(n);
      },
      getDbg() {
        if (this.dbg) return this.dbg;
        if (!parent) throw new Error(`Failed to get dbg`);
        return parent.getDbg();
      },
      makeNestCall(cb, dbg) {
        const newContext = _LIB_INTERNAL._createCallContext(this);
        if (_DEBUG_BUILD) {
          newContext.dbg = dbg ? makeDbgDefaults(dbg) : this.dbg;
          debugRunFunction(cb, newContext);
        } else {
          cb(newContext);
        }
      },
      makeSimpleCall(rps, cb) {
        const ret = cb();
        if (typeof ret !== "undefined") this.makeTemp(rps[0], ret);
      },
    };
  },
};
function startRunFunction(fun, dbg) {
  const newContext = _LIB_INTERNAL._createCallContext();
  if (_DEBUG_BUILD) {
    newContext.dbg = makeDbgDefaults(dbg);
    return debugRunFunction(dbg.uid, fun(newContext));
  }
  return fun(newContext);
}
function main(context) {
  f0324C0ECCE4405B8A62D0ECE0D19DC9F(context);
  f2076EDF991D45C7728A1D6390ECD5BFC(context, 0, 10);
  f4B6EA7379702A383A268AADC332038DF(
    context,
    null,
    "Hello:" + ("" + context.getTemp("617462377a30746c:VALUE")),
    "log"
  );
  setTimeout(function () {
    context.makeNestCall(function (context) {
      f4B6EA7379702A383A268AADC332038DF(
        context,
        null,
        "world:" + ("" + (context.getTemp("617462377a30746c:VALUE") + 2)),
        "log"
      );
      f7788580292C8569B1E7F48938943A549(context);
    });
  }, 1000);
}
startRunFunction(main);
function f0324C0ECCE4405B8A62D0ECE0D19DC9F(context) {
  return context.makeSimpleCall([], function () {
    _CORE_CONNECTOR.begin();
  });
}
function f7788580292C8569B1E7F48938943A549(context) {
  return context.makeSimpleCall([], function () {
    _CORE_CONNECTOR.exit();
  });
}
function f4B6EA7379702A383A268AADC332038DF(context, TAG, PRINT, LEVEL) {
  return context.makeSimpleCall([], function () {
    _DEBUG_CONNECTOR.console(LEVEL, TAG, PRINT);
  });
}
function f2076EDF991D45C7728A1D6390ECD5BFC(context, MIN, MAX) {
  return context.makeSimpleCall(["617462377a30746c:VALUE"], function () {
    return Math.floor(Math.random() * (MAX - MIN)) + MIN;
  });
}
