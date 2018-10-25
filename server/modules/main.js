var server= require("../server"), log= server.log, appParams= server.getAppStartupParams(), appConfig= server.getConfig();

module.exports.validateModule = function(errs, nextValidateModuleCallback){
    nextValidateModuleCallback();
};

function getMenu(templates){
    var menuBar=[];
    if (!templates) return;
    for(var tID in templates) {
        var t=templates[tID], menuBarItem={menuItemName:tID};
        if(t) {
            menuBarItem.menuTitle= t["title"];
            menuBarItem.pageId= "page_"+tID;
            menuBarItem.pageTitle= t["title"];
            menuBarItem.action= "open";
            menuBarItem.contentHref = "/docxTemplates/"+tID;
        }
        menuBar.push(menuBarItem);
    }
    menuBar.push({ menuItemName:"menuBarItemHelpAbout", menuTitle:"О программе", action:"help_about" });
    menuBar.push({ menuItemName:"menuBarItemClose", menuTitle:"Выход", action:"close" });
    return menuBar;
}

module.exports.modulePageURL = "/";
module.exports.modulePagePath = "main.html";
module.exports.init= function(app){

    app.get("/main/getMainData", function (req, res) {
        var outData= {};
        outData.mode= appParams.mode;
        outData.modeStr= appParams.mode;
        if (!appConfig||appConfig.error) {
            outData.error= "Failed load application configuration!"+(appConfig&&appConfig.error)?" Reason:"+appConfig.error:"";
            res.send(outData);
            return;
        }
        outData.title=appConfig.title;
        outData.icon32x32=appConfig.icon32x32;
        outData.imageSmall=appConfig.imageSmall;
        outData.imageMain=appConfig.imageMain;
        outData.menuBar= getMenu(appConfig.templates);
        res.send(outData);
    });
    app.post("/main/exit", function(req, res){                                                                   log.info("app.post /  req.body=",req.body);
        var outData={};
        var cookiesArr=Object.keys(req.cookies);
        for(var i in cookiesArr){
            res.clearCookie(cookiesArr[i]);
        }
        outData.actionResult="successful";
        res.send(outData);
    });
 };