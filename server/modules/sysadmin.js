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
        outData.dbUserName=req.dbUserName;
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
                if(errMessage) outData.dbValidation = errMessage; else outData.dbValidation = "success";
                res.send(outData);
            });
            return;
        }
        outData.config=getConfig();
        var validateError=getValidateError();
        if(validateError) outData.dbValidation=validateError; else outData.dbValidation = "success";
        res.send(outData);
    });

    app.get("/sysadmin/serverConfig", function (req, res) {
        res.sendFile(appViewsPath+'sysadmin/serverConfig.html');
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

    app.post("/sysadmin/serverConfig/storeServerConfigAndReconnect", function (req, res) {
        var newServerConfig = req.body;
        //var currentDbName=server.getServerConfig().database;
        var currentDbHost=server.getServerConfig().host;
        common.saveConfig(appParams.mode+".cfg", newServerConfig,
            function (err) {
                var outData = {};
                if (err) {
                    outData.error = "Failed to save config. Reason: "+err;
                    res.send(outData);
                    return;
                }
                //if(!(currentDbName==newServerConfig.database) || !(currentDbHost==newServerConfig.host)){
                //    database.cleanConnectionPool();
                //}
                setAppConfig(newServerConfig);
                appModules.validateModules(function (errs, errMessage) {
                    if (errMessage) outData.dbValidation = errMessage;
                    res.send(outData);
                });
            });
    });
};

