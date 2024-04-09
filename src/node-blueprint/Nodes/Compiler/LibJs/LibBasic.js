function createCallContext(parent) {
  return {
    parent,

  };
}

function createCallContextAndSwitch(cb0, context, switchValue, ...cbs) {
  const newContext = createCallContext(context);
  if (!switchValue)
    cb0(newContext);
  else
    cbs[switchValue - 1](newContext);
}

createCallContextAndSwitch;