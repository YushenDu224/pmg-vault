import {spawn} from 'node:child_process';
import path from 'node:path';
const executable='C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron/dist/electron.exe';
const child=spawn(executable,[import.meta.dirname],{windowsHide:true,stdio:['ignore','pipe','pipe']});
let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
const timeout=setTimeout(()=>{child.kill();console.error('Offline UA test exceeded 20 seconds');process.exitCode=1;},20000);
child.on('close',code=>{clearTimeout(timeout);console.log(stdout.trim());if(code!==0){console.error(stderr.slice(-1000));process.exitCode=code||1;}});
