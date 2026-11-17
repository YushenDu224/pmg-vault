import {spawn} from 'node:child_process';
const child=spawn('C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron/dist/electron.exe',['probe-official.cjs'],{cwd:process.cwd(),windowsHide:true,stdio:'inherit'});
child.on('error',e=>{console.error(e.message);process.exitCode=1});
child.on('exit',code=>{console.log('Probe exited '+code);process.exitCode=code||0});
