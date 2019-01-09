var fs = require('fs'), path = require('path');
var server= require("../server"), log= server.log,
    genDOCX=require("./genDOCX");

const lowDB = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname,'/../../history/','history.db')),
    historyDB = lowDB(adapter);

module.exports.validateModule = function(errs, nextValidateModuleCallback){
    nextValidateModuleCallback();
};

historyDB.defaults({ templates: [] }).write();// Set some defaults

var getTemplateLastItemsByDate= function(tID, count){
    //console.log("last=",historyDB.get('templates').findLast(function(item){return item.id=tID}).value());//IT'S FOR TEST
    //console.log("filter=",historyDB.get('templates').filter(function(item){return item.id=tID}).sortBy('datetime').takeRight(100).value());//IT'S FOR TEST
    //console.log("getTemplateLastItemsByDate map=",historyDB.get('templates').filter(function(item){return item.id=tID}).orderBy('datetime','desc').take(count).map('data').value());//IT'S FOR TEST
    var resultSet=
        historyDB.get('templates').filter(function(item){return item.id==tID}).orderBy('datetime','desc').take(count);
    return resultSet.map(function(item){ item.data['datetime']=item.datetime; return item.data }).value();
};

module.exports.init= function(app) {
    app.get("/docxTemplates/*", function (req, res) {
        if(!req.params){
            res.send({error:"UNKNOWN URI!"});
            return;
        }
        var urlParams=req.params[0].split('/'), tID=urlParams[0], action=urlParams[1];
        if(!tID){
            res.send({error:"UNKNOWN URI!"});
            return;
        }
        if(!action) {
            var tPage = fs.readFile(appViewsPath + "docxTemplates.html", 'utf8', function (err, fileData) {
                if(err){
                    res.send({error:"Failed get template page! Reason:"+err.message});
                    return;
                }
                tPage=fileData.replace(/docxTemplates_/g,tID+"");
                res.send(tPage);
            });
            return
        }
        if(action=="getTemplateData"){
            var tmpls=server.getConfigTemplates(), tmplData, tFields;
            if(tmpls)tmplData=tmpls[tID];
            if(!tmplData){
                res.send({error:"NO finded template data by template ID!",userErrorMsg:"Нет заданы параметры для шаблона!"});
                return;
            }
            tFields=tmplData.fields;
            if(!tFields){
                res.send({error:"Template data no fields!",userErrorMsg:"Для шаблона не заданы поля параметров!"});
                return;
            }
            var tFieldsParams={};
            for(var tfID in tFields){
                tFieldsParams[tfID]=tfID+" "+tFields[tfID];
            }
            res.send({fields:tFieldsParams,files:tmplData.files});
            return;
        }else if(action=="getTemplateParamsHistory"){
            var tmpls=server.getConfigTemplates(), tmplData, tFields;
            if(tmpls)tmplData=tmpls[tID];
            if(!tmplData){
                res.send({error:"NO finded template data by template ID!",userErrorMsg:"Нет заданы параметры для шаблона!"});
                return;
            }
            tFields=tmplData.fields;
            if(!tFields){
                res.send({error:"Template data no fields!",userErrorMsg:"Для шаблона не заданы поля параметров!"});
                return;
            }
            var tTableParamsHistory=[
                {data:"datetime", name:"Дата", width:100, type:"text",datetimeFormat:"DD.MM.YY HH:mm:ss",align:"center", useFilter:false }
            ];
            for(var tfID in tFields){
                tTableParamsHistory.push({data:tfID, name:tfID, width:250, type:"text"});
            }
            res.send({columns:tTableParamsHistory,identifier:tTableParamsHistory[0].data,items:getTemplateLastItemsByDate(tID,100)});
            return;
        }
        res.send({error:"UNKNOWN URI action!"});
    });
    app.post("/docxTemplates/*", function (req, res) {
        if(!req.params){
            res.send({error:"UNKNOWN URI!"});
            return;
        }
        var urlParams=req.params[0].split('/'), tID=urlParams[0], action=urlParams[1];
        if(!tID){
            res.send({error:"UNKNOWN URI!"});
            return;
        }
        if(!action){
            res.send({error:"NO URI action!"});
            return;
        }
        if(action=="sendDataAndGenDocx"){
            var tmpls=server.getConfigTemplates(), tmplData, tFields;
            if(tmpls)tmplData=tmpls[tID];
            if(!tmplData){
                res.send({error:"NO finded template data by template ID!",userErrorMsg:"В конфигурации не заданы параметры для шаблона!"});
                return;
            }
            if(!tmplData.directory){
                res.send({error:"NO path with templates!",userErrorMsg:"В конфигурации не указан путь расположения шаблонов!"});
                return;
            }
            if(!tmplData.outputPath){
                res.send({error:"NO path for store template docx!",userErrorMsg:"В конфигурации не указан путь для сохранения результата!"});
                return;
            }
            if(!req.body||!req.body.values){
                res.send({error:"NO data values for generate template docx!",userErrorMsg:"Для заполнения шаблона нет значений!"});
                return;
            }
            try{
                var values=JSON.parse(req.body.values);
            }catch(e){
                res.send({error:"Data values not valid for generate template docx!",userErrorMsg:"Для заполнения шаблона указанные значения недопустимы!"});
                return;
            }
            if(!req.body.files){
                res.send({error:"NO files for generate template docx!",userErrorMsg:"Не указаны файлы шаблонов для генерации!"});
                return;
            }                                                                                       log.debug("docxTemplates sendDataAndGenDocx values=",values,"\nfiles=",req.body.files,{});
            var storeHistoryResult="SUCCESS";
            try{
                storeHistory(tID,values);
            }catch(e){
                storeHistoryResult="ERROR";
            }
            var files=req.body.files;
            if(typeof(files)=="string")files=[files];
            var ramdomizeFileds=tmplData.ramdomizeFileds, ramdomizer=server.getConfigItem("ramdomizer");
            if(ramdomizeFileds&&ramdomizer){
                var randomFont=Math.floor(Math.random() * ramdomizer.fonts.length),
                    randomFSize=Math.floor(Math.random() * ramdomizer.sizes.length);
                for (var rfKey in ramdomizeFileds) {
                    var vKey=ramdomizeFileds[rfKey];
                    if(vKey===undefined||vKey===null)continue;
                    var val=values[vKey];
                    if(val===undefined)continue;
                    var newVal={text:val}; values[vKey+"@"]=newVal;
                    if(ramdomizer.fonts)newVal.fontName=ramdomizer.fonts[randomFont];
                    if(ramdomizer.sizes)newVal.fontSize=ramdomizer.sizes[randomFSize];
                }
            }
            genDOCX.generateDOCX(0,{values:values,files:files,directory:tmplData.directory,outputPath:tmplData.outputPath},
                function(result){
                    if(!result) result={generateResult:true,userMsg:"Все документы по шаблонам успешно созданы!",storeHistoryResult:storeHistoryResult};
                    res.send(result);
                });
            return;
        }
        res.send({error:"UNKNOWN URI action!"});
    });
};

function storeHistory(tID,data){
    var lastItems=getTemplateLastItemsByDate(tID,1);
    var lastItem;
    if(lastItems)lastItem=lastItems[0];
    if(lastItem){
        var equals=true;
        for(var tfID in data) if(data[tfID]!=lastItem[tfID]) {
            equals=false; break;
        }
        if(equals) return;
    }
    historyDB.get('templates').push({id:tID,datetime:new Date(),data:data}).value();
    historyDB.write(); historyDB.read();
}