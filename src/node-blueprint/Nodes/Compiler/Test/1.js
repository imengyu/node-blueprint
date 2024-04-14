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

function main() {
    createCallContext(function(context) {
        var 8241859104825823 = 0;
        f0324C0ECCE4405B8A62D0ECE0D19DC9F(context);
        f2076EDF991D45C7728A1D6390ECD5BFC(0, 10, context);

        f4B6EA7379702A383A268AADC332038DF("TEST", context.setTemp(
            "36346573633033:OUTPUT",
            context.getTemp("6f68676f6c646f:VALUE") + (2 + (1 + 0))
        ), "log", context);

        if (context.getTemp("36346573633033:OUTPUT") > 5) {
            f4B6EA7379702A383A268AADC332038DF(null, ">5", "log", context);
            f7788580292C8569B1E7F48938943A549(context);
        } else {
            setTimeout(function() {
                context.makeNestCall(function(context) {
                    for (let index = 0; index < 10; index += 1) {
                        context.makeTemp("36396f7a796776:OUTPUT", 8241859104825823 = 8241859104825823 + 2);

                        if (!(context.getTemp("36396f7a796776:OUTPUT") < 6)) {
                            break;
                        }
                    }

                    f4B6EA7379702A383A268AADC332038DF(null, "<= 5", "log", context);
                    f7788580292C8569B1E7F48938943A549(context);
                });
            }, 1000);
        }
    });
}

main();

function f0324C0ECCE4405B8A62D0ECE0D19DC9F(context) {
    context.makeSimpleCall([], function() {
        _CORE_CONNECTOR.begin()
    });
}

function f7788580292C8569B1E7F48938943A549(context) {
    context.makeSimpleCall([], function() {
        _CORE_CONNECTOR.exit()
    });
}

function f4B6EA7379702A383A268AADC332038DF(context, TAG, PRINT, LEVEL) {
    context.makeSimpleCall([], function() {
        _DEBUG_CONNECTOR.console(LEVEL,TAG,PRINT)
    });
}

function f2076EDF991D45C7728A1D6390ECD5BFC(context, MIN, MAX) {
    context.makeSimpleCall(["6f68676f6c646f:VALUE"], function() {
        return Math.floor(Math.random() * (MAX - MIN)) + MIN
    });
}