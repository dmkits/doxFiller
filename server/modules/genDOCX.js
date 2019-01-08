var JSZip = require('jszip'), Docxtemplater = require('docxtemplater');
var fs = require('fs'), path = require('path');
var log= require("../log");
/**
 * param { values, files, directory, outputPath }
 *  if value is object it's converted to XML value, original values stored in params.originalValues
 * callback = function()
 * standard XML value example:
 *      <w:p>
 *          <w:pPr>
 *              <w:rPr>
 *                  <w:color w:val="FF0000"/>
 *              </w:rPr>
 *          </w:pPr>
 *          <w:r>
 *              <w:rPr>
 *                  <w:color w:val="FF0000"/>
 *                  <w:rFonts w:eastAsia="Batang" w:cs="Tahoma" w:ascii="Tahoma" w:hAnsi="Tahoma"/>
 *                  <w:sz w:val="32"/><w:szCs w:val="32"/>
 *              </w:rPr>
 *              <w:t>My custom</w:t>
 *          </w:r>
 *      </w:p>,
 * doc.fileTypeConfig.tagRawXml="w:r" XML value example:
 *      <w:r>
 *          <w:rPr>
 *              <w:color w:val="00FF00"/>
 *              <w:rFonts w:eastAsia="Batang" w:cs="Calibri" w:ascii="Calibri" w:hAnsi="Calibri"/>
 *              <w:sz w:val="40"/><w:szCs w:val="40"/>
 *          </w:rPr>
 *          <w:t>REPLACE WITH FONT Calibri 40</w:t>
 *      </w:r>
 */
var generateDOCX= function(ind,params,callback){                                                            log.debug("genDOCX generateDOCX START:",ind,params.files,{});
    if(!params){
        callback({error:"No parameters for generate docx!",userErrorMsg:"Нет данных для создания документа по шаблону!"}); return;
    }
    if(!params.files||!params.files[ind]){
        callback(); return;
    }
    if(!params.values) {
        callback({error:"No data values for generate docx!",userErrorMsg:"Нет данных для подстановки значений для создания документа по шаблону!"});
        return;
    }
    if(!params.originalValues){//convert value to XML value
        params.originalValues={};
        for (var vKey in params.values) {
            var val=params.values[vKey];
            params.originalValues[vKey]=val;
            if(typeof(val)!=="object")continue;
            var text=null,font=null,fSize=null;
            if(val.text) text='<w:t>'+val.text+'</w:t>';
            if(val.fontName) font='<w:rFonts w:eastAsia="Batang" w:cs="'+val.fontName+'" w:ascii="'+val.fontName+'" w:hAnsi="'+val.fontName+'"/>';
            if(val.fontSize) fSize='<w:sz w:val="'+val.fontSize*2+'"/><w:szCs w:val="'+val.fontSize*2+'"/>';
            params.values[vKey]='<w:r>';
            if(font||fSize){
                params.values[vKey]+='<w:rPr>';
                if(font)params.values[vKey]+=font;
                if(fSize)params.values[vKey]+=fSize;
                params.values[vKey]+='</w:rPr>';
            }
            if(text)params.values[vKey]+=text;
            params.values[vKey]+='</w:r>'
        }                                                                                                   log.debug("genDOCX generateDOCX originalValues:",params.originalValues,params.values);
    }
    var filename=params.files[ind], content;                                                                log.debug("genDOCX generateDOCX START filename=",filename);
    try {//Load the docx file as a binary
        content = fs.readFileSync(path.resolve(params.directory, filename), 'binary');
    } catch (error) {
        callback({error:"Failed load template docx file! Reason:"+error.message,
            userErrorMsg:"Не удалось найти (загрузить для обработки) файл шаблона '"+filename+"'!"});
        return;
    }
    var zip = new JSZip(content), doc = new Docxtemplater();
    doc.loadZip(zip);
    doc.setData(params.values);//set the templateVariables
    try {/* render the document (replace all occurences of {<pName>} by values)*/                           log.debug("genDOCX generateDOCX doc.fileTypeConfig.tagRawXml",doc.fileTypeConfig.tagRawXml,{});
        doc.fileTypeConfig.tagRawXml="w:r";/*replace standard 'w:p' to 'w:r'*/                              //console.log("doc.modules[3]",doc.modules[3].fileTypeConfig,{});
        doc.render();                                                                                       //console.log("genDOCX generateDOCX doc",doc,{});
    } catch (error) {
        var e = { message: error.message, name: error.name, stack: error.stack, properties: error.properties};  log.error("genDOCX generateDOCX generateDOCX error:",e,error.properties/*,JSON.stringify({error: e})*/);
        callback({error:"Failed replace all occurences in template! Reason:"+error.message,
            userErrorMsg:"Не удалось обработать файл шаблона!"});
        return;
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        //throw error;
    }
    var buf = doc.getZip().generate({type: 'nodebuffer'});
    try {// buf is a nodejs buffer, you can either write it to a file or do anything else with it.
        fs.writeFileSync(path.resolve(params.outputPath, filename), buf);
    } catch (error) {
        callback({error:"Failed store result docx file! Reason:"+error.message,
            userErrorMsg:"Не удалось сохранить файл результата!"});
        return;
    }
    generateDOCX(ind+1,params,callback);
};
module.exports.generateDOCX=generateDOCX;
