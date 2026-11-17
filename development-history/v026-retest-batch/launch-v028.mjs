import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
const executable=path.resolve('dist-v028/win-unpacked/PMG库.exe');
const data=path.resolve('app-session-v028');
const child=spawn(executable,['--data-dir='+data],{windowsHide:true,detached:true,stdio:'ignore'});
await fs.writeFile('reports/v028-launch.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,executable,data,test:'v028 real website and UI state comparison'},null,2));
child.unref();console.log('Opened v028 state-sync test app.');
