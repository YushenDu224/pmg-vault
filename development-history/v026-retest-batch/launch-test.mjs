import {spawn} from 'node:child_process';
import path from 'node:path';
const executable='C:/Users/John/Documents/Codex/2026-11-17/pmg-review-v025/dist/win-unpacked/PMG库.exe';
const child=spawn(executable,['--data-dir='+path.resolve('app-session-01'),'--cert=8077301-001','--grade=67','--site=global'],{windowsHide:true,detached:true,stdio:'ignore'});
child.unref();console.log('Launched packaged compatibility test app in isolated session.');
