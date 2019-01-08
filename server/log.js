var path = require('path'), fs = require('fs'), dateformat =require('dateformat'),
    log = require('winston');
module.exports=log;
module.exports.init= function(logToConsole,logDebug){
    if (logToConsole) {
        log.configure({
            transports: [
                new (log.transports.Console)({ colorize: true,level:(logDebug)?'silly':'info', timestamp: function() {
                    return dateformat(Date.now(), "yyyy-mm-dd HH:MM:ss.l");
                } })
            ]
        });
    } else {
        var logDir= path.join(__dirname, '/../logs/');
        try {
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir);
            }
        }catch (e){                                                                                     console.log("FAILED START! Reason: Failed create log directory! Reason:"+ e.message);
            return;
        }
        var transports  = [];
        transports.push(new (require('winston-daily-rotate-file'))({
            name: 'file',
            datePattern: '.yyyy-MM-dd',
            filename: path.join(logDir, "log_file.log")
        }));
        log = new log.Logger({transports: transports,level:(logDebug)?'silly':'info', timestamp: function() {
            return dateformat(Date.now(), "yyyy-mm-dd HH:MM:ss.l");
        }});
    }
    return log;
};