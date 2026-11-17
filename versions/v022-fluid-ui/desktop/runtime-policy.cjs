const path=require('node:path');
const APP_URL='pmg-library://app/';
function trustedAppUrl(input){try{const u=new URL(input);return u.protocol==='pmg-library:'&&u.host==='app'&&!u.username&&!u.password;}catch{return false;}}
function appResourcePath(input,root){if(!trustedAppUrl(input))return null;let pathname;try{pathname=decodeURIComponent(new URL(input).pathname);}catch{return null;}if(pathname==='/')pathname='/index.html';if(pathname==='/sample.pmgx')return path.join(root,'examples/sample.pmgx');if(pathname!=='/index.html'&&!/^\/(?:ui|lib|assets)\/[a-zA-Z0-9_./-]+\.(?:mjs|css|svg)$/.test(pathname))return null;const full=path.resolve(root,'.'+pathname),relative=path.relative(root,full);if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||pathname.includes('\\'))return null;return full;}
function dataDirectory(appData,override){return path.resolve(override||path.join(appData,'PMG库'));}
module.exports={APP_URL,trustedAppUrl,appResourcePath,dataDirectory};
