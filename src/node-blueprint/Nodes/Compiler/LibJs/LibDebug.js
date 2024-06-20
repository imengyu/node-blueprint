/* eslint-disable */

const _DEBUG_BREAK = '_DEBUG_CONNECTOR:BREAK';
_DEBUG_CONNECTOR.debuggerConnected = false;
_DEBUG_CONNECTOR.debuggerPaused = false;
_DEBUG_CONNECTOR.debuggerStepMode = false;
_DEBUG_CONNECTOR.debuggerPause = function() {
  this.debuggerPaused = true;
};
_DEBUG_CONNECTOR.debugStop = function debugStop() {
  _DEBUG_CONNECTOR.runnerContexts.clear();
  _DEBUG_CONNECTOR.debuggerPause();
}
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
  context.dbg.graphVariables.push({ key, getCb }) 
}
_DEBUG_CONNECTOR.runnerContexts = new Map();


function makeDbgDefaults(dbg) {
  if (!dbg.nodeStack) 
    dbg.nodeStack = [];
  if (!dbg.graphVariables) 
    dbg.graphVariables = [];
  return dbg;
}

function debugRunFunction(func, context) {
  if (!_DEBUG_CONNECTOR.debuggerConnected) 
    throw new Error('debugRunFunction can only call at debugger is connected!');

  const dbg = context.getDbg();

  _DEBUG_PROVIDER.newDebuggerRunnerContext(() => {
    const iterator = func(context);
    const debuggerRunnerContext = {
      state: 'inactive',
      parent: context.parent ? _DEBUG_CONNECTOR.runnerContexts.get(context.parent.uid) : undefined,
      dbg,
      getLocalTemps() {
        const result = [];
        for (const [key,value] of context.temp)
          result.push({key,value});
        return result;
      },
      getLocalVariables() {
        let currentContext = context;
        while(currentContext.parent) {
          if (currentContext.dbg.graphVariables.length > 0)
            break;
          currentContext = currentContext.parent;
        }

        const result = [];
        for (const data of currentContext.dbg.graphVariables)
          result.push({key: data.key,value: data.getCb()});
        return result;
      },
      next(step) {
        _DEBUG_CONNECTOR.debuggerStepMode = step ? true : false;
        _DEBUG_CONNECTOR.debuggerPaused = false;
        changeDebuggerRunnerContextState('active');
        let ret = undefined;
        try {
          ret = iterator.next().value;
        } catch (e) {
          _DEBUG_PROVIDER.handleDebuggerRunnerContextException(this, e);
          return {};
        }
        if (typeof ret === 'object' && ret.type === _DEBUG_BREAK) {
          _DEBUG_CONNECTOR.debuggerPause();
          changeDebuggerRunnerContextState('paused');
          return { pauseNodeUid: ret.uid };
        }
        changeDebuggerRunnerContextState('completed');
        return { returnValue: ret };
      },
    }
    function changeDebuggerRunnerContextState(state) {
      debuggerRunnerContext.state = state;
      _DEBUG_PROVIDER.stateDebuggerRunnerContext(debuggerRunnerContext);
    }

    _DEBUG_CONNECTOR.runnerContexts.set(context.uid, debuggerRunnerContext);
    return debuggerRunnerContext;
  });
}