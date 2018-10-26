var path = require('path'), fs = require('fs');
var server=require('../server'), getLoadInitModulesError=server.getLoadInitModulesError;
var log = server.log;
var appParams=server.getAppStartupParams(), getServerConfig=server.getServerConfig, setAppConfig=server.setAppConfig, getConfig=server.getConfig;
var loadServerConfiguration=server.loadServerConfiguration;

var common=require('../common');
var appModules=require(appModulesPath), getValidateError=appModules.getValidateError;

module.exports.validateModule = function(errs, nextValidateModuleCallback){
    nextValidateModuleCallback();
};

module.exports.modulePageURL = "/sysadmin";
module.exports.modulePagePath = "sysadmin.html";

module.exports.init = function(app){

    app.get("/sysadmin/serverState", function(req, res){
        var revalidateModules= false;
        if (req.query&&req.query["REVALIDATE"]) revalidateModules= true;
        var outData= {};
        outData.mode= appParams.mode;
        outData.port=appParams.port;
        var serverConfig=getServerConfig();
        if (!serverConfig||serverConfig.error) {
            outData.error= (serverConfig&&serverConfig.error)?serverConfig.error:"unknown";
            res.send(outData);
            return;
        }
        outData.configuration= serverConfig;
        var loadInitModulesError=getLoadInitModulesError();
        if(loadInitModulesError) outData.modulesFailures = loadInitModulesError;
        if (revalidateModules) {
            appModules.validateModules(function(errs, errMessage){
                if(errMessage) outData.moduleValidateResult = errMessage; else outData.moduleValidateResult = "success";
                res.send(outData);
            });
            return;
        }
        outData.config=getConfig();
        var validateError=getValidateError();
        if(validateError) outData.moduleValidateResult=validateError; else outData.moduleValidateResult = "success";
        res.send(outData);
    });

    app.get("/sysadmin/serverConfig", function (req, res) {
        res.sendFile(appViewsPath+'serverConfig.html');
    });

    app.get("/sysadmin/server/getServerConfig", function (req, res) {
        var serverConfig=getServerConfig();
        if (!serverConfig||serverConfig.error) {
            res.send({error:(serverConfig&&serverConfig.error)?serverConfig.error:"unknown"});
            return;
        }
        res.send(serverConfig);
    });

    app.get("/sysadmin/server/loadServerConfig", function (req, res) {
        loadServerConfiguration();
        var serverConfig=getServerConfig();                                                         log.info("serverConfig=",serverConfig);
        if (!serverConfig) {
            res.send({error: "Failed load server config!"});
            return;
        }
        res.send(serverConfig);
    });

    app.post("/sysadmin/serverConfig/storeServerConfig", function (req, res) {
        var newServerConfig = req.body;
        common.saveConfig(appParams.mode+".cfg", newServerConfig,
            function (err) {
                var outData = {};
                if (err) {
                    outData.error = "Failed to save config. Reason: "+err;
                    res.send(outData);
                    return;
                }
                setAppConfig(newServerConfig);
                appModules.validateModules(function (errs, errMessage) {
                    if (errMessage) outData.moduleValidateResult = errMessage;
                    res.send(outData);
                });
            });
    });
};

