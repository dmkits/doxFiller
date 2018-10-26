var JSZip = require('jszip'), Docxtemplater = require('docxtemplater');
var fs = require('fs'), path = require('path');
var server= require("../server");

global.appDocxTemplates= path.join(__dirname,'/../../docxTemplates/','');

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
        if(action=="getFields"){
            var tmpls=server.getConfigTemplates(), tmplData, tFields;
            if(tmpls)tmplData=tmpls[tID];
            if(!tmplData){
                res.send({error:"NO finded template data by template ID!"});
                return;
            }
            tFields=tmplData.fields;
            if(!tFields){
                res.send({error:"Template data no fields!"});
                return;
            }
            res.send({fields:tFields});
            return;
        }
        res.send({error:"UNKNOWN URI action!"});
    });
    app.post("/docxTemplates/*", function (req, res) {                                  console.log("docxTemplates post data=",req.body);
        if(!req.params){
            res.send({error:"UNKNOWN URI!"});
            return;
        }
        var urlParams=req.params[0].split('/'), tID=urlParams[0], action=urlParams[1];
        if(!tID){
            res.send({error:"UNKNOWN URI!"});
            return;
        }
        var tmpls=server.getConfigTemplates(), tmplData, tFields;
        if(tmpls)tmplData=tmpls[tID];
        if(!tmplData){
            res.send({error:"NO finded template data by template ID!"});
            return;
        }
        if(!tmplData.outputPath||!tmplData.outputName){
            res.send({error:"NO path or/and name for store template docx!"});
            return;
        }

        generateDOCX(tID,req.body,tmplData.outputPath,tmplData.outputName,function(result){
            res.send(result);
        });
    });
};

function generateDOCX(tID,data,outputPath,outputName,callback){
    if(!data) {
        callback({error:"No data for generate docx!",errorMsg:"Нет данных для создания документа по шаблону!"});
        return;
    }

    var content;
    try {//Load the docx file as a binary
        content = fs.readFileSync(path.resolve(appDocxTemplates, tID+'.docx'), 'binary');
    } catch (error) {
        callback({error:"Failed load template docx file! Reason:"+error.message,
            errorMsg:"Не удалось найти (загрузить для обработки) файл шаблона!"});
        return;
    }
    var zip = new JSZip(content), doc = new Docxtemplater();
    doc.loadZip(zip);
    doc.setData(data);//set the templateVariables
    try {// render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render()
    } catch (error) {
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties
        };                                                                                              //console.log("generateDOCX error:",JSON.stringify({error: e}));
        callback({error:"Failed replace all occurences in template! Reason:"+error.message,
            errorMsg:"Не удалось обработать файл шаблона!"});
        return;
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        //throw error;
    }
    var buf = doc.getZip().generate({type: 'nodebuffer'});
    try {// buf is a nodejs buffer, you can either write it to a file or do anything else with it.
        fs.writeFileSync(path.resolve(outputPath, outputName+'.docx'), buf);
    } catch (error) {
        callback({error:"Failed store result docx file! Reason:"+error.message,
            errorMsg:"Не удалось сохранить файл результата!"});
        return;
    }
    callback({result:"Template generate SUCCESS.",userMsg:"Документ по шаблону успешно создан."});
}
