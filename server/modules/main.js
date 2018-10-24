var server= require("../server"), log= server.log, appParams= server.getAppStartupParams(), appConfig= server.getConfig();

module.exports.validateModule = function(errs, nextValidateModuleCallback){
    nextValidateModuleCallback();
};

function setUserRoleMenu(outData, userRole, usersRolesConfig, appMenu){
    var userMenu=[];
    var userRoleItems=usersRolesConfig[userRole];
    if (!userRoleItems&&userRole=="sysadmin") {
        outData.menuBar= appMenu;
        return;
    }
    if (!userRoleItems) userRoleItems={menu:["menuBarItemHelpAbout","menuBarItemClose"]};
    var userRoleMenu=userRoleItems.menu;
    for(var i in userRoleMenu) {
        var userRoleMenuItemName = userRoleMenu[i];
        for (var j in appMenu) {
            var appMenuItem = appMenu[j];
            if (userRoleMenuItemName == appMenuItem.menuItemName) {
                var userItem = {};
                for(var item in appMenuItem) userItem[item]=appMenuItem[item];
                if(userItem.popupMenu) userItem.popupMenu=null;
                userMenu.push(userItem);
                break;
            }
            var mainPopupMenu = appMenuItem.popupMenu;
            if (mainPopupMenu){
                for (var k in mainPopupMenu) {
                    var popupMenuItem = mainPopupMenu[k];
                    if (userRoleMenuItemName == popupMenuItem.menuItemName) {
                        for (var l in userMenu) {
                            var userMenuItem = userMenu[l];
                            if (userMenuItem.menuItemName == appMenuItem.menuItemName) {
                                if (!userMenuItem.popupMenu) userMenuItem.popupMenu= [];
                                userMenuItem.popupMenu.push(popupMenuItem);
                            }
                        }
                    }
                }
            }
        }
    }
    outData.menuBar= userMenu;
    outData.autorun= userRoleItems.autorun;
}

module.exports.modulePageURL = "/";
module.exports.modulePagePath = "main.html";
module.exports.init= function(app){

    app.get("/main/getMainData", function (req, res) {
        var outData= {};
        outData.mode= appParams.mode;
        outData.modeStr= appParams.mode;
        outData.dbUserName=(req.dbUserName)?req.dbUserName:"unknown";
        outData.EmpName=(req.dbUserParams&&req.dbUserParams["EmpName"])?req.dbUserParams["EmpName"]:"unknown";
        if (!appConfig||appConfig.error) {
            outData.error= "Failed load application configuration!"+(appConfig&&appConfig.error)?" Reason:"+appConfig.error:"";
            res.send(outData);
            return;
        }
        outData.title=appConfig.title;
        outData.icon32x32=appConfig.icon32x32;
        outData.imageSmall=appConfig.imageSmall;
        outData.imageMain=appConfig.imageMain;
        var empRole=(req.dbUserParams)?req.dbUserParams["EmpRole"]:null;
        setUserRoleMenu(outData, empRole, appConfig.usersRoles, appConfig.appMenu);
        //var dbConErr=database.getDBConnectError();
        //if (dbConErr) {
        //    outData.dbConnection= dbConErr;
        //    res.send(outData);
        //    return;
        //}
        //outData.dbConnection='Connected';
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