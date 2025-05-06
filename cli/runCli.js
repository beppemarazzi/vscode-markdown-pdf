"use strict";

const cfgSection = "markdown-pdf";

const cfgProps = {};
function appendProps(cfgDProps, isDefaults){
    for (const [key, value] of Object.entries(cfgDProps)) {
        if(key.startsWith(cfgSection + ".")){
            //console.log(`CFG(def:${isDefaults}) ${key} = ${value}`);
            //i.e. markdown-pdf.clip.x 
            let kk = key.substring(cfgSection.length + 1).split(".");
            let p = cfgProps;        
            for(let i = 0; i < kk.length; ++i){
                if(i === kk.length-1){
                    p[kk[i]] = isDefaults ? value.default : value;
                } else {
                    if(p[kk[i]] === undefined)
                        p[kk[i]] = {};
                    p = p[kk[i]];
                }
            }
        }
    }
}

appendProps(require("../package.json").contributes.configuration.properties, true);

const URI = require("vscode-uri");

const workspaceFolder = {
     uri: URI.URI.file(""),
     name: "",
     index: 0
}

// Override the require function https://stackoverflow.com/a/34186494
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function(){
    const id = arguments[0];
    //console.log("R:" + id);
    if(id === "vscode") {
        return {
            Uri: URI.URI,
            workspace: {
                getConfiguration : (section) => {
                    //console.log(`CFGS: ${section}`);
                    if(section === cfgSection){
                        return cfgProps;
                    }
                    return {};
                },
                getWorkspaceFolder: (resource) => {
                    return workspaceFolder;
                }
            },
            window: {
                showErrorMessage: (msg, ...args) =>{
                    console.error(msg, args);
                },
                showInformationMessage: (msg, ...args) =>{
                    console.log(msg, args);
                },
                setStatusBarMessage: (txt) => {
                    //console.log("StatusBarMessage: " + txt);
                    return {
                        dispose: () => {
                            //console.log("StatusBarMessage dispose!");
                        }
                    }
                },
                withProgress: async (o, t) => {
                    //console.log("running withProgress...");
                    await t();
                    //console.log("done withProgress");
                }
            },
            ProgressLocation:{
                SourceControl: 1,
                Window: 10,
                Notification: 15,
            },
            env:{
                language: "en-US"
            }
        }
    }
    //do your thing here
    return originalRequire.apply(this, arguments);
};

const { argv } = require("node:process");
// print process.argv
// argv.forEach((val, index) => {
//     console.log(`${index}: ${val}`);
// });    

//const workspaceFolderPath = "C:\\devel\\pr\\doc\\";
const workspaceFolderPath = argv[2];
workspaceFolder.uri = URI.URI.file(workspaceFolderPath);

//const mdFilename = "TechNotes/RCS/TN.RCS.387_CentraggioASRV/README.md";
const mdFilename = argv[3];

//const pdfFilename = "TechNotes\\RCS\\TN.RCS.387_CentraggioASRV\\README.pdf";
const pdfFilename = argv[4];

appendProps(require(workspaceFolderPath + ".vscode\\settings.json"), false);

//console.log("env.CHROME_BIN_PATH: " + process.env.CHROME_BIN_PATH);
//console.log("executablePath: " + cfgProps["executablePath"]);
if(!cfgProps["executablePath"]){
    cfgProps["executablePath"] = process.env.CHROME_BIN_PATH;
    if(cfgProps["executablePath"]){
        console.log("Using chrome from env.CHROME_BIN_PATH");
    } else {
        console.error('ERROR: Chrome is missing. set env.CHROME_BIN_PATH\n i.e. $env:CHROME_BIN_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"');
        process.exit(1);
    }
}

//run async cli 
(async () => {
    const ext = require("../extension");
    const ret = await ext.cli(
        mdFilename, 
        pdfFilename);
    if(ret){
        console.log("exit 0");
        process.exit(0);
    }
    console.log("exit 1");
    process.exit(1);
})();
