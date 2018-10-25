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
    app.post("/docxTemplates/*", function (req, res) {                                  console.log("docxTemplates post",req.body);

        res.send({error:"UNKNOWN result!"});
    });
};


//Load the docx file as a binary
var content = fs.readFileSync(path.resolve(appDocxTemplates, 'docxTemplate1.docx'), 'binary');

var zip = new JSZip(content);

var doc = new Docxtemplater();
doc.loadZip(zip);

//set the templateVariables
doc.setData({
    first_name: 'John',
    last_name: 'Doe',
    phone: '0652455478',
    description: 'New Website'
});

try {
    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
    doc.render()
}
catch (error) {
    var e = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        properties: error.properties
    }
    console.log(JSON.stringify({error: e}));
    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
    throw error;
}

var buf = doc.getZip().generate({type: 'nodebuffer'});
// buf is a nodejs buffer, you can either write it to a file or do anything else with it.
fs.writeFileSync(path.resolve(appDocxTemplates, 'output.docx'), buf);