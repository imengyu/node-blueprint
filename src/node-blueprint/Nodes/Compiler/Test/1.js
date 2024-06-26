const _DEBUG_BUILD = true;

/* eslint-disable */
/**
 * Basic JS runner functions
 */
/*var _CORE_CONNECTOR = undefined;*/
if (!_CORE_CONNECTOR)
    _CORE_CONNECTOR = {};

if (!_CORE_CONNECTOR.begin)
    _CORE_CONNECTOR.begin = function() {};

if (!_CORE_CONNECTOR.exit)
    _CORE_CONNECTOR.exit = function() {};

if (!_DEBUG_CONNECTOR)
    _DEBUG_CONNECTOR = {};

if (!_DEBUG_CONNECTOR.console) _DEBUG_CONNECTOR.console = function(type, tag, msg) {
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
                this.temp.set(n, {
                    v,
                    c
                });

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
                } else {
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

                if (typeof ret !== "undefined")
                    this.makeTemp(rps[0], ret);
            }
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
        return debugRunFunction(fun, newContext);
    }

    return fun(newContext);
}

/* eslint-disable */
/**
 * Basic JS dedbugger runner functions
 */
const _DEBUG_BREAK = "_DEBUG_CONNECTOR:BREAK";

_DEBUG_CONNECTOR.debuggerConnected = false;
_DEBUG_CONNECTOR.debuggerPaused = false;
_DEBUG_CONNECTOR.debuggerStepMode = false;

_DEBUG_CONNECTOR.debuggerPause = function() {
    this.debuggerPaused = true;
};

_DEBUG_CONNECTOR.debugStop = function debugStop() {
    _DEBUG_CONNECTOR.runnerContexts.clear();
    _DEBUG_CONNECTOR.debuggerPause();
};

_DEBUG_CONNECTOR.debugNode = function(context, graphUid, nodeUid) {
    context.dbg.nodeStack.unshift(nodeUid);

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

_DEBUG_CONNECTOR.runnerContexts = new Map();

/**
 * Generate the default dbg data
 * @param {*} dbg 
 * @returns 
 */
function makeDbgDefaults(dbg) {
    if (!dbg.nodeStack)
        dbg.nodeStack = [];

    if (!dbg.graphVariables)
        dbg.graphVariables = [];

    return dbg;
}

/**
 * Run function with debugger
 * @param {() => void} func function body
 * @param {*} context Runner context
 * @param {boolean} prepare Prepare for async? Default false
 */
function debugRunFunction(func, context, prepare = false) {
    if (!_DEBUG_CONNECTOR.debuggerConnected)
        throw new Error("debugRunFunction can only call at debugger is connected!");

    const dbg = context.getDbg();

    return _DEBUG_PROVIDER.newDebuggerRunnerContext(() => {
        let iterator = null;

        if (!prepare)
            iterator = func(context);

        const debuggerRunnerContext = {
            state: "inactive",
            parent: context.parent ? _DEBUG_CONNECTOR.runnerContexts.get(context.parent.uid) : undefined,
            dbg,

            /**
                   * Get temp value in this context
                   */
            getLocalTemps() {
                const result = [];

                for (const [key, value] of context.temp) result.push({
                    key,
                    value
                });

                return result;
            },

            /**
                   * Get variables in this context
                   */
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

            /**
                   * Run this context
                   * @param {boolean} step Single step execution? Default false
                   * @returns 
                   */
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
            },

            /**
                   * Start run context, only for async (prepare = true)
                   */
            start() {
                if (prepare && iterator == null) {
                    iterator = func(context);
                    this.next();
                }
            }
        };

        function changeDebuggerRunnerContextState(state) {
            debuggerRunnerContext.state = state;
            _DEBUG_PROVIDER.stateDebuggerRunnerContext(debuggerRunnerContext);
        }

        _DEBUG_CONNECTOR.runnerContexts.set(context.uid, debuggerRunnerContext);
        return debuggerRunnerContext;
    });
}

function* main(context) {
    f0324C0ECCE4405B8A62D0ECE0D19DC9F(context);

    if (_DEBUG_CONNECTOR.debugNode(context, "6f696c72747a69", "6e6a6a33616836")) yield {
        type: _DEBUG_BREAK,
        uid: "6e6a6a33616836",
        graphUid: "6f696c72747a69"
    };

    f2076EDF991D45C7728A1D6390ECD5BFC(
        context,
        context.makeTemp("617462377a30746c:MIN", 0),
        context.makeTemp("617462377a30746c:MAX", 10)
    );

    if (_DEBUG_CONNECTOR.debugNode(context, "6f696c72747a69", "617462377a30746c")) yield {
        type: _DEBUG_BREAK,
        uid: "617462377a30746c",
        graphUid: "6f696c72747a69"
    };

    f4B6EA7379702A383A268AADC332038DF(context, context.makeTemp("68693773797973:TAG", null), context.makeTemp(
        "3375666c717968:OUTPUT",
        context.makeTemp("36e3964716a7a66:OUT", context.makeTemp("36e3964716a7a66:IN", "Hello:")) + context.makeTemp("6a626d38623461:OUTPUT", "" + context.getTemp("617462377a30746c:VALUE"))
    ), context.makeTemp("68693773797973:LEVEL", "log"));

    if (_DEBUG_CONNECTOR.debugNode(context, "6f696c72747a69", "68693773797973")) yield {
        type: _DEBUG_BREAK,
        uid: "68693773797973",
        graphUid: "6f696c72747a69"
    };

    if (_DEBUG_CONNECTOR.debugNode(context, "6f696c72747a69", "6f64617a706579")) yield {
        type: _DEBUG_BREAK,
        uid: "6f64617a706579",
        graphUid: "6f696c72747a69"
    };

    {
        context.makeAsyncNestCall(function(finishCb) {
            setTimeout(function() {
                finishCb();
            }, context.makeTemp("6f64617a706579:TIME", 1000));
        }, function*(context) {
            f4B6EA7379702A383A268AADC332038DF(context, context.makeTemp("6d346537646574:TAG", null), context.makeTemp(
                "337a75366c766e:OUTPUT",
                context.makeTemp("766c6778717361:OUT", context.makeTemp("766c6778717361:IN", "world:")) + context.makeTemp("6f763577797170:OUTPUT", "" + context.makeTemp(
                    "7769686a777737:OUTPUT",
                    context.getTemp("617462377a30746c:VALUE") + context.makeTemp("6f346634376d3469:OUT", context.makeTemp("6f346634376d3469:IN", 2))
                ))
            ), context.makeTemp("6d346537646574:LEVEL", "log"));

            if (_DEBUG_CONNECTOR.debugNode(context, "6f696c72747a69", "6d346537646574")) yield {
                type: _DEBUG_BREAK,
                uid: "6d346537646574",
                graphUid: "6f696c72747a69"
            };

            f7788580292C8569B1E7F48938943A549(context);

            if (_DEBUG_CONNECTOR.debugNode(context, "6f696c72747a69", "796b357276746f")) yield {
                type: _DEBUG_BREAK,
                uid: "796b357276746f",
                graphUid: "6f696c72747a69"
            };
        });
    }
}

_DEBUG_CONNECTOR.debuggerEntry = function debuggerEntry() {
    startRunFunction(main, {
        uid: "6f696c72747a69"
    });
};

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
    return context.makeSimpleCall(["617462377a30746c:VALUE"], function() {
        return Math.floor(Math.random() * (MAX - MIN)) + MIN;
    });
}