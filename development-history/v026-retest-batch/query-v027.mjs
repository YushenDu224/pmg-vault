import {spawn} from 'node:child_process';
import path from 'node:path';
const child=spawn(path.resolve('dist/win-unpacked/PMG库.exe'),['--data-dir='+path.resolve('app-session-v027'),'--cert=8077301-001','--grade=67','--site=global'],{windowsHide:true,detached:true,stdio:'ignore'});
child.unref();console.log('Started the same public global-site query in the existing ASCII-identity test app.');
