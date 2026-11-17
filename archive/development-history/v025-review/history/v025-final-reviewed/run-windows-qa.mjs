import {spawn} from 'node:child_process';
import path from 'node:path';
const data=path.resolve('qa-windows-'+Date.now());
const child=spawn('C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron/dist/electron.exe',['qa-windows-live.cjs','--data-dir='+data,'--cert=8077301-001','--grade=67','--site=global'],{cwd:process.cwd(),windowsHide:true,stdio:'inherit'});
child.on('error',e=>{console.error(e.message);process.exitCode=1});child.on('exit',code=>{console.log('Windows QA exited '+code);process.exitCode=code||0});
