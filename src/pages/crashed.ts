import '../assets/sass/crashed.scss'
import electron from 'electron'
import { clearInterval, setInterval } from 'timers';

(<any>window).restart = restart;
window.addEventListener('load', () => {
  setTimeout(() => runAutoRestartTimer(), 5000);
})

function restart(submitReport : boolean) {
  electron.ipcRenderer.send('main-act-recreate', submitReport)
}
function runAutoRestartTimer() {
  let countDown = 20;
  let sureLink = document.getElementById('sure_btn');
  let sureLinkText = sureLink.innerText;
  let timer : NodeJS.Timeout = setInterval(() => {
    if(countDown > 0) { countDown--; sureLink.innerText = sureLinkText + ' (' + countDown + ')'; }
    else {
      clearInterval(timer);
      restart(true);
    }
  }, 1000);
}