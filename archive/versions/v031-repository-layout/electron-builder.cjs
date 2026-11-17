const path=require('node:path');
module.exports={
 appId:'io.github.yushendu224.pmgvault',productName:'PMG库',
 electronVersion:'45.2.2',electronDist:process.env.PMG_ELECTRON_DIST||path.dirname(require('electron')),
 directories:{output:path.resolve(__dirname,'dist/windows'),buildResources:'build'},
 files:['package.json','index.html','ui/**/*','lib/**/*','desktop/**/*','assets/**/*','build/icon.ico','examples/sample.pmgx'],
 asar:true,compression:'normal',
 win:{target:[{target:'nsis',arch:['x64']}],icon:'build/icon.ico',signAndEditExecutable:true},
 nsis:{oneClick:false,allowToChangeInstallationDirectory:true,perMachine:false,allowElevation:true,createDesktopShortcut:true,createStartMenuShortcut:true,shortcutName:'PMG库',deleteAppDataOnUninstall:false,runAfterFinish:false,installerLanguages:['zh_CN','en_US'],language:'2052',unicode:true,include:'build/installer.nsh',artifactName:'PMG-Library-${version}-Setup-${arch}.${ext}'},
 publish:null
};
