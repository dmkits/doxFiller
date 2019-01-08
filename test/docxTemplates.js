var genDOCX = require('../server/modules/genDOCX'),
    log= require('../server/log');
log.init(true,true);
//"rawXml":'<w:p><w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r></w:p>'
//"rawXmlStd":
//    '<w:p>'+
//    '<w:pPr>'+
//        '<w:rPr>'+
//            '<w:color w:val="FF0000"/>'+
//        '</w:rPr>'+
//    '</w:pPr>'+
//    '<w:r>'+
//        '<w:rPr>'+
//            '<w:color w:val="FF0000"/>'+
//            '<w:rFonts w:eastAsia="Batang" w:cs="Tahoma" w:ascii="Tahoma" w:hAnsi="Tahoma"/>'+
//            '<w:sz w:val="32"/><w:szCs w:val="32"/>'+
//        '</w:rPr>'+
//        '<w:t>My custom</w:t>'+
//    '</w:r>'+
//    '<w:r>'+
//        '<w:rPr>'+
//            '<w:color w:val="00FF00"/>'+
//            '<w:rFonts w:eastAsia="Batang" w:cs="Tahoma" w:ascii="Tahoma" w:hAnsi="Tahoma"/>'+
//            '<w:sz w:val="32"/><w:szCs w:val="32"/>'+
//        '</w:rPr>'+
//        '<w:t>XML</w:t>'+
//    '</w:r>'+
//    '</w:p>',
//"rawXmlWR":
//    '<w:r>'+
//        '<w:rPr>'+
//            //'<w:color w:val="00FF00"/>'+
//            '<w:rFonts w:eastAsia="Batang" w:cs="Tahoma" w:ascii="Tahoma" w:hAnsi="Tahoma"/>'+
//            '<w:sz w:val="32"/><w:szCs w:val="32"/>'+
//        '</w:rPr>'+
//        '<w:t>REPLACE WITH FONT Tahoma 32</w:t>'+
//    '</w:r>',
var values={
    "rawXml":{text:"PARAM rawXml WITH Font Tahoma 16", fontName:"Tahoma",fontSize:16},
    "21":{text:"PARAM 21 WITH Font Calibri 22", fontName:"Calibri",fontSize:22 },
    "11":"Text 11", "2":"TEXT2",
    "7.1":"text 7.1",
    "3.1":{text:"XML text 3.1"}
};
genDOCX.generateDOCX(0,{values:values,files:["1xml.docx"],directory:"./",outputPath:"./out"},
    function(err){                                                                                  console.log("genDOCX.generateDOCX result:",(err)?err:"SUCCESS");

    });
