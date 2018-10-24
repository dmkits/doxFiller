var fs=require('fs');

module.exports.getStartupParams = function() {
    var app_params = {};
    if (process.argv.length == 0) {
        app_params.mode = 'production';
        app_params.port = 8080;
        return app_params;
    }
    for (var i = 2; i < process.argv.length; i++) {
        var arg=process.argv[i];
        if (arg.indexOf('-p:') == 0) {
            var port = process.argv[i].replace("-p:", "");
            if (port > 0 && port < 65536) {
                app_params.port = port;
            }
        } else if (arg.charAt(0).toUpperCase() > 'A' && arg.charAt(0).toUpperCase() < 'Z') {
            app_params.mode = arg;
        } else if (arg.indexOf('-log:') == 0) {
            var logParam = process.argv[i].replace("-log:", "");
            if (logParam.toLowerCase() == "console") {
                app_params.logToConsole = true;
            } else if (logParam.toLowerCase() == "debug") {
                app_params.logDebug = true;
            }
        }
    }
    if (!app_params.port)app_params.port = 8080;
    if (!app_params.mode)app_params.mode = 'production';
    return app_params;
};

module.exports.loadConfig=function(fileName){
    var stringConfig = fs.readFileSync(serverConfigPath+fileName);
    return JSON.parse(stringConfig);
};
module.exports.saveConfig=function(fileName,dbConfig,callback) {
    fs.writeFile(serverConfigPath+fileName, JSON.stringify(dbConfig), function (err, success) {
        callback(err,success);
    })
};

module.exports.getJSONWithoutComments= function (text){
    var target = "/*";
    var pos = 0;
    while (true) {
        var foundPos = text.indexOf(target, pos);
        if (foundPos < 0)break;
        var comment = text.substring(foundPos, text.indexOf("*/", foundPos)+2);
        text=text.replace(comment,"");
        pos = foundPos + 1;
    }
    return text;
};
