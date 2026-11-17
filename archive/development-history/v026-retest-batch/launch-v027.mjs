import {spawn} from 'node:child_process';
import path from 'node:path';
const child=spawn(path.resolve('dist/win-unpacked/PMG库.exe'),['--data-dir='+path.resolve('app-session-v027')],{windowsHide:true,detached:true,stdio:'ignore'});
child.unref();console.log('Opened ASCII-identity comparison build in its own isolated session.');
