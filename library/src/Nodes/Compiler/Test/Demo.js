/* eslint-disable */

function r(context, MIN, MAX) {
  context.makeSimpleCall(() => {
    return Math.floor(Math.random() * (MAX - MIN)) +MIN
  });
}

function d(context, TAG, OUT, LEVEL) {
  context.makeSimpleCall(() => {
    
  });
}

function main() {
  createCallContext((context) => {
    r(context, 0, 10);
    d(context, context.makeShared('ADDOUNT', (context.getTemp('OUT') + 2 + 1, 0), 2));
    context.createSwitch(
      (context.getShared('ADDOUNT') > 5) ? 1 : 0, 
      (context) => {
        d(context, '>5')
      },
      () => {
        d(context, '>5')
      }
    );
  });
}

main();