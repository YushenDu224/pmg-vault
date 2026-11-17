import {spawn} from 'node:child_process';
const child=spawn('C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron/dist/electron.exe',['qa-ui-state-integration.cjs'],{windowsHide:true,stdio:'inherit'});
child.on('exit',code=>{process.exitCode=code||0});child.on('error',e=>{console.error(e.message);process.exitCode=1});
