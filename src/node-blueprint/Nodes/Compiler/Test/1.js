const _DEBUG_BUILD = true;

/* eslint-disable */

const _DEBUG_CONNECTOR = {
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

    reportError(e) {}
};

if (!_CORE_CONNECTOR)
    _CORE_CONNECTOR = {};

const _LIB_INTERNAL = {
    idMaker: 0,

    _createCallContext(parent) {
        return {
            parent,
            uid: ++this.idMaker,
            dbg: undefined,
            temp: new Map(),

            makeTemp(n, v, c = 0) {
                this.temp.set(n, {
                    v,
                    c
                });
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
                newContext.dbg = dbg ? makeDbgDefaults(dbg) : this.dbg;

                if (_DEBUG_BUILD)
                    debugRunFunction(cb, newContext);
                else
                    cb(newContext);
            },

            makeSimpleCall(rps, cb) {
                const ret = cb();

                if (typeof ret !== "undefined")
                    this.makeTemp(rps[0], ret);
            }
        };
    }
};

function startRunFunction(fun, dbg) {
    const newContext = _LIB_INTERNAL._createCallContext();
    newContext.dbg = makeDbgDefaults(dbg);

    if (_DEBUG_BUILD)
        return debugRunFunction(dbg.uid, fun(newContext));

    return fun(newContext);
}

/* eslint-disable */

const _DEBUG_BREAK = "_DEBUG_CONNECTOR:BREAK";

_DEBUG_CONNECTOR.debuggerConnected = false;
_DEBUG_CONNECTOR.debuggerPaused = false;
_DEBUG_CONNECTOR.debuggerStepMode = false;

_DEBUG_CONNECTOR.debuggerPause = function() {
    this.debuggerPaused = true;
};

_DEBUG_CONNECTOR.debugNode = function(context, graphUid, nodeUid) {
    if (!context.nodeStack)
        context.nodeStack = [];

    context.nodeStack.push(nodeUid);

    if (this.debuggerPaused || this.debuggerStepMode)
        return true;

    return _DEBUG_PROVIDER.checkBreakNode(graphUid, nodeUid);
};

_DEBUG_CONNECTOR.debugFunction = function(graphUid) {
    return _DEBUG_PROVIDER.checkDebugFunction(graphUid);
};

_DEBUG_CONNECTOR.addDebugVariable = function(context, key, getCb) {
    context.dbg.graphVariables.push({
        key,
        getCb
    });
};

_DEBUG_CONNECTOR.reunnerContexts = new Map();

function makeDbgDefaults(dbg) {
    if (!dbg.nodeStack)
        dbg.nodeStack = [];

    if (!dbg.graphVariables)
        dbg.graphVariables = [];

    return dbg;
}

function debugStop() {
    _DEBUG_CONNECTOR.reunnerContexts.clear();
    _DEBUG_CONNECTOR.debuggerPause();
}

function debugRunFunction(func, context) {
    if (!_DEBUG_CONNECTOR.debuggerConnected)
        throw new Error("debugRunFunction can only call at debugger is connected!");

    const dbg = context.getDbg();

    _DEBUG_PROVIDER.newDebuggerRunnerContext(() => {
        const iterator = func(context);

        const debuggerRunnerContext = {
            state: "inactive",
            parent: context.parent ? reunnerContexts.get(context.parent.uid) : undefined,
            dbg,

            getLocalTemps() {
                const result = [];

                for (const [key, value] of context.temp) result.push({
                    key,
                    value
                });

                return result;
            },

            getLocalVariables() {
                let currentContext = context;

                while (currentContext.parent) {
                    if (currentContext.dbg.graphVariables.length > 0)
                        break;

                    currentContext = currentContext.parent;
                }

                const result = [];

                for (const data of currentContext.dbg.graphVariables) result.push({
                    key: data.key,
                    value: data.getCb()
                });

                return result;
            },

            next(step) {
                _DEBUG_CONNECTOR.debuggerStepMode = step ? true : false;
                _DEBUG_CONNECTOR.debuggerPaused = false;
                changeDebuggerRunnerContextState("active");
                let ret = undefined;

                try {
                    ret = iterator.next().value;
                } catch (e) {
                    _DEBUG_PROVIDER.handleDebuggerRunnerContextException(this, e);
                    return {};
                }

                if (typeof ret === "object" && ret.type === _DEBUG_BREAK) {
                    _DEBUG_CONNECTOR.debuggerPause();
                    changeDebuggerRunnerContextState("paused");

                    return {
                        pauseNodeUid: ret.uid
                    };
                }

                changeDebuggerRunnerContextState("completed");

                return {
                    returnValue: ret
                };
            }
        };

        function changeDebuggerRunnerContextState(state) {
            debuggerRunnerContext.state = state;
            _DEBUG_PROVIDER.stateDebuggerRunnerContext(debuggerRunnerContext);
        }

        reunnerContexts.set(context.parent.uid, debuggerRunnerContext);
        return debuggerRunnerContext;
    });
}

function* main(context) {
    var v8241859104825823 = 0;
    _DEBUG_CONNECTOR.addDebugVariable(context, v8241859104825823, () => v8241859104825823);
    f0324C0ECCE4405B8A62D0ECE0D19DC9F(context);

    if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "a696b6f76793133")) yield {
        type: _DEBUG_BREAK,
        uid: "a696b6f76793133",
        graphUid: "b716e6b397774"
    };

    f2076EDF991D45C7728A1D6390ECD5BFC(0, 10, context);

    if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "6f68676f6c646f")) yield {
        type: _DEBUG_BREAK,
        uid: "6f68676f6c646f",
        graphUid: "b716e6b397774"
    };

    f4B6EA7379702A383A268AADC332038DF("TEST", context.setTemp(
        "36346573633033:OUTPUT",
        context.getTemp("6f68676f6c646f:VALUE") + (2 + (1 + 0))
    ), "log", context);

    if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "36393065687466")) yield {
        type: _DEBUG_BREAK,
        uid: "36393065687466",
        graphUid: "b716e6b397774"
    };

    if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "61756434316a65")) yield {
        type: _DEBUG_BREAK,
        uid: "61756434316a65",
        graphUid: "b716e6b397774"
    };

    if (context.getTemp("36346573633033:OUTPUT") > 5) {
        f4B6EA7379702A383A268AADC332038DF(null, ">5", "log", context);

        if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "70766d31377768")) yield {
            type: _DEBUG_BREAK,
            uid: "70766d31377768",
            graphUid: "b716e6b397774"
        };

        f7788580292C8569B1E7F48938943A549(context);

        if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "797a7171693671")) yield {
            type: _DEBUG_BREAK,
            uid: "797a7171693671",
            graphUid: "b716e6b397774"
        };
    } else {
        if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "6f78776c627377")) yield {
            type: _DEBUG_BREAK,
            uid: "6f78776c627377",
            graphUid: "b716e6b397774"
        };

        setTimeout(function() {
            context.makeNestCall(function*(context) {
                if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "77a647a7264786b")) yield {
                    type: _DEBUG_BREAK,
                    uid: "77a647a7264786b",
                    graphUid: "b716e6b397774"
                };

                for (let index = 0; index < 10; index += 1) {
                    if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "36396f7a796776")) yield {
                        type: _DEBUG_BREAK,
                        uid: "36396f7a796776",
                        graphUid: "b716e6b397774"
                    };

                    context.makeTemp("36396f7a796776:OUTPUT", v8241859104825823 = v8241859104825823 + 2);

                    if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "763836746f676d")) yield {
                        type: _DEBUG_BREAK,
                        uid: "763836746f676d",
                        graphUid: "b716e6b397774"
                    };

                    if (!(context.getTemp("36396f7a796776:OUTPUT") < 6)) {
                        if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "32643473696939")) yield {
                            type: _DEBUG_BREAK,
                            uid: "32643473696939",
                            graphUid: "b716e6b397774"
                        };

                        break;
                    }
                }

                f4B6EA7379702A383A268AADC332038DF(null, "<= 5", "log", context);

                if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "6262627362316b")) yield {
                    type: _DEBUG_BREAK,
                    uid: "6262627362316b",
                    graphUid: "b716e6b397774"
                };

                f7788580292C8569B1E7F48938943A549(context);

                if (_DEBUG_CONNECTOR.debugNode(context, "b716e6b397774", "797a7171693671")) yield {
                    type: _DEBUG_BREAK,
                    uid: "797a7171693671",
                    graphUid: "b716e6b397774"
                };
            });
        }, 1000);
    }
}

startRunFunction(main, {
    uid: "b716e6b397774"
});

function f0324C0ECCE4405B8A62D0ECE0D19DC9F(context) {
    return context.makeSimpleCall([], function() {
        _CORE_CONNECTOR.begin();
    });
}

function f7788580292C8569B1E7F48938943A549(context) {
    return context.makeSimpleCall([], function() {
        _CORE_CONNECTOR.exit();
    });
}

function f4B6EA7379702A383A268AADC332038DF(context, TAG, PRINT, LEVEL) {
    return context.makeSimpleCall([], function() {
        _DEBUG_CONNECTOR.console(LEVEL, TAG, PRINT);
    });
}

function f2076EDF991D45C7728A1D6390ECD5BFC(context, MIN, MAX) {
    return context.makeSimpleCall(["6f68676f6c646f:VALUE"], function() {
        return Math.floor(Math.random() * (MAX - MIN)) + MIN;
    });
}