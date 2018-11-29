var JSZip = require('jszip'), Docxtemplater = require('docxtemplater');
var fs = require('fs'), path = require('path');
var server= require("../server");

global.appDocxTemplates= path.join(__dirname,'/../../docxTemplates/','');

const lowDB = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname,'/../../history/','history.db'));
const historyDB = lowDB(adapter);

// Set some defaults
historyDB.defaults({ templates: [] }).write();

var getTemplateLastItemsByDate= function(tID, count){
    //console.log("last=",historyDB.get('templates').findLast(function(item){return item.id=tID}).value());
    //console.log("filter=",historyDB.get('templates').filter(function(item){return item.id=tID}).sortBy('datetime').takeRight(100).value());
    //console.log("getTemplateLastItemsByDate map=",historyDB.get('templates').filter(function(item){return item.id=tID}).orderBy('datetime','desc').take(count).map('data').value());
    var resultSet=
        historyDB.get('templates').filter(function(item){return item.id==tID}).orderBy('datetime','desc').take(count);     //console.log("getTemplateLastItemsByDate resultSet=",resultSet.value());
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
                res.send({error:"NO finded template data by template ID!",errorMsg:"Нет заданы параметры для шаблона!"});
                return;
            }
            tFields=tmplData.fields;
            if(!tFields){
                res.send({error:"Template data no fields!",errorMsg:"Для шаблона не заданы поля параметров!"});
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
                res.send({error:"NO finded template data by template ID!",errorMsg:"Нет заданы параметры для шаблона!"});
                return;
            }
            tFields=tmplData.fields;
            if(!tFields){
                res.send({error:"Template data no fields!",errorMsg:"Для шаблона не заданы поля параметров!"});
                return;
            }
            var tTableParamsHistory=[
                {data:"datetime", name:"Дата", width:100, type:"text",datetimeFormat:"DD.MM.YY HH:mm:ss",align:"center" }
            ];
            for(var tfID in tFields){
                tTableParamsHistory.push({data:tfID, name:tfID, width:250, type:"text"});
            }
            res.send({columns:tTableParamsHistory,identifier:tTableParamsHistory[0].data,items:getTemplateLastItemsByDate(tID,100)});//console.log("getTemplateLastItemsByDate=",getTemplateLastItemsByDate(tID,2));
            return;
        }
        res.send({error:"UNKNOWN URI action!"});
    });
    app.post("/docxTemplates/*", function (req, res) {                                              //console.log("docxTemplates post data=",req.body);
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
        if(action=="sendDataAndGenDocx"){                                                           //console.log("sendDataAndGenDocx",req.body);
            var tmpls=server.getConfigTemplates(), tmplData, tFields;
            if(tmpls)tmplData=tmpls[tID];
            if(!tmplData){
                res.send({error:"NO finded template data by template ID!",errorMsg:"В конфигурации не заданы параметры для шаблона!"});
                return;
            }
            if(!tmplData.directory){
                res.send({error:"NO path with templates!",errorMsg:"В конфигурации не указан путь расположения шаблонов!"});
                return;
            }
            if(!tmplData.outputPath){
                res.send({error:"NO path for store template docx!",errorMsg:"В конфигурации не указан путь для сохранения результата!"});
                return;
            }
            if(!req.body||!req.body.values){
                res.send({error:"NO data values for generate template docx!",errorMsg:"Для заполнения шаблона нет значений!"});
                return;
            }
            try{
                var values=JSON.parse(req.body.values);
            }catch(e){
                res.send({error:"Data values not valid for generate template docx!",errorMsg:"Для заполнения шаблона указанные значения недопустимы!"});
                return;
            }
            if(!req.body.files){
                res.send({error:"NO files for generate template docx!",errorMsg:"Не указаны файлы шаблонов для генерации!"});
                return;
            }                                                                                       console.log("sendDataAndGenDocx values=",values," files=",req.body.files);
            var storeHistoryResult="SUCCESS";
            try{
                storeHistory(tID,values);
            }catch(e){
                storeHistoryResult="ERROR";
            }
            generateDOCX(0,values,req.body.files,tmplData.directory,tmplData.outputPath,function(result){
                if(!result) result={generateResult:true,userMsg:"Все документы по шаблонам успешно созданы!",storeHistoryResult:storeHistoryResult};
                res.send(result);
            });
            return;
        }
        res.send({error:"UNKNOWN URI action!"});
    });
};

function generateDOCX(ind,values,files,directory,outputPath,callback){
    if(!files||!files[ind]){
        callback(); return;
    }
    if(!values) {
        callback({error:"No data for generate docx!",errorMsg:"Нет данных для создания документа по шаблону!"});
        return;
    }
    var filename=files[ind], content;
    try {//Load the docx file as a binary
        content = fs.readFileSync(path.resolve(directory, filename), 'binary');
    } catch (error) {
        callback({error:"Failed load template docx file! Reason:"+error.message,
            errorMsg:"Не удалось найти (загрузить для обработки) файл шаблона '"+file+"'!"});
        return;
    }
    var zip = new JSZip(content), doc = new Docxtemplater();
    doc.loadZip(zip);
    doc.setData(values);//set the templateVariables
    try {// render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render()
    } catch (error) {
        var e = { message: error.message, name: error.name, stack: error.stack, properties: error.properties};  //console.log("generateDOCX error:",JSON.stringify({error: e}));
        callback({error:"Failed replace all occurences in template! Reason:"+error.message,
            errorMsg:"Не удалось обработать файл шаблона!"});
        return;
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        //throw error;
    }
    var buf = doc.getZip().generate({type: 'nodebuffer'});
    try {// buf is a nodejs buffer, you can either write it to a file or do anything else with it.
        fs.writeFileSync(path.resolve(outputPath, filename), buf);
    } catch (error) {
        callback({error:"Failed store result docx file! Reason:"+error.message,
            errorMsg:"Не удалось сохранить файл результата!"});
        return;
    }
    generateDOCX(ind+1,values,files,directory,outputPath,callback);
}
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