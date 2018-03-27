const stringify = require('csv-stringify');
const glob = require("glob");
const properties = require ("properties");
const fs = require('fs');

csvPath = 'dossier';
const csvName = 'rrr.csv';
const theDelimitier = ';';
const sep = '=';

/*
var langCheck = ['fr_FR', 'nl_NL','de_DE', 'en_HK', 'en_US', 'es_ES', 'en_GB'] // on veut ces langues
var ressourceFolder = "C:\\workspaceBabyliss\\conair-uk\\cartridges\\app_babyliss_fr\\cartridge\\templates\\resources";

var csvFolder = "C:\\Script\\ressource";
var csvName = "ressource.csv";
var theDelimiter = ';'*/

var data = '';

const readStream = fs.createReadStream(csvName);

const reader = stringify();

reader.on('readable', function(){
    while(row = reader.read()){
        data += row;
    }
});


reader.on('finish', function(){
    handleResult(data);
});


readStream.pipe(reader);
readStream.setEncoding('utf-8');


function handleResult(fileData){
    fileData = fileData.split('\n');
    const header = fileData[0].split(theDelimitier);
    const langCheck = header.slice(2, header.length);
    const langNum = {};
    const fileName = {};
    const obj = {};
    langCheck.forEach(i => {
        langNum[i.trim()] = langCheck.indexOf(i)+2;
    });
    
    
    fileData.slice(1).forEach(function(line){
        line = line.split(theDelimitier);
        var file = line[0];
        for(lang in langNum){
            var fileName = getFileName(file, lang);
            if(!(fileName in obj)){
                obj[fileName] = [];
            }
            if(typeof line[1] !== 'undefined'){
                var key = line[1];
            }
            if(typeof line[langNum[lang]] !== 'undefined'){
                var value = line[langNum[lang]];
            }
            var key_value = {};
            key_value[key] = value;
            
            obj[fileName].push(key_value);
        }
    });
    generateFile(obj);
}

function generateFile(obj){
    var output;
    for(file in obj){
        output = fs.createWriteStream(csvPath +'/'+file);
        obj[file].forEach(function(key_val){
            for(key in key_val){
                output.write(key + sep + key_val[key] + '\n');
            }
        });


    }
}

function getFileName(file, lang){
    return file + '_' + lang + '.properties';
}

