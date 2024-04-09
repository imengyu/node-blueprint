
function r(context, MIN, MAX) {
  context.pushStack();
  context.pushStack();


  
  context.popStack();
}

function d(context, TAG, OUT, LEVEL) {

}



function main() {
  createCallContextAndSwitch((context) => {
    r(context, 0, 10);
  });
}

main();