const stringify = require('csv-stringify');
const glob = require("glob");
const properties = require ("properties");
const fs = require('fs');
const path = require("path");
const csv = require('fast-csv');

var langCheck = ['fr_FR', '', 'de_DE', 'en', 'en_AE'] // on veut ces langues
var ressourceFolder = "C:\\workspaceBabyliss\\conair-uk\\cartridges\\app_babyliss_fr\\cartridge\\templates\\resources";
var csvFolder = "C:\\Script\\ressource";
var csvName = "ressource.csv";
var theDelimiter = ';'

function loadProperties(file){
    var sep = "=";
    var comment_char="#"
    var props = {};
    var data = fs.readFileSync(file,"utf8");
    var content = data.split("\n");
    for(l in content){
        var line = content[l].trim();
        var isComment = line.startsWith(comment_char);
        if(line && !isComment){
            var key_value = line.split(sep);
            var key = key_value[0].trim();
            var value = key_value[1].trim();
            props[key] = value;
        }
    }
    return props;
}

function getAllProperties(){
    var listdir = fs.readdirSync(ressourceFolder);
    for (lang in langCheck){
        
        for(dir in listdir){
            if(listdir[dir].includes(langCheck[lang])){
                console.log(langCheck[lang]);
                var file = [ressourceFolder, listdir[dir]];
                properties.parse (file.join('\\'), {path: true}, function (error, obj){
                    if (error) return console.error (error);
                    console.log(obj);
                });
            }
        }
    }
}

glob("**/*.properties", {cwd : ressourceFolder.replace('\\', '/'), absolute: true}, function (er, files) {
    if(er) {throw er};
    var map = {};
    var cpt = 0;
    files.forEach(function (file){
        properties.parse(file, { path: true }, function (error, obj){
            cpt++;
            map[file] = obj;
            if(error) {throw er};
            if(cpt == files.length){
                handleResult(map, files);
            }
        });
    });
});

function getLocale(file){
    file = file.split('.');
    return file[0].substr(-5);
}

function getFileName(file){
    file = file.split('/');
    file = file[file.length-1];
    file = file.split('_');
    return file[0];
}

function getKeys(map){
    var keylist = [];
    var sep = "=";
    for(locale in map){
        var nextMap = map[locale];
        for(key in nextMap){
            key = key.trim();
            if(!keylist.includes(key)){
                keylist.push(key);
            }
        }
    }     
    return keylist;
}

function csvLines(map, keylist){
    var csvLines = [];
    var fileName;
    for(key in keylist){
        var line = [];
        var theKey = keylist[key];
        line.push(theKey.trim());
        for(lang in langCheck){
            var locale = langCheck[lang];
            for(file in map[locale]){
                if(theKey in map[locale][file]){
                    fileName = file;
                    var trad = map[locale][file][theKey];
                    if(typeof trad === 'number' || trad === null){
                        line.push(trad);
                    }else{
                        line.push(trad.trim());
                    }   
                }
            }
        }
        line.splice(0,0,fileName);
        csvLines.push(line);
    }
    return csvLines;
}

function filter(map, files){
    var obj = {};
    for(lang in langCheck){
        var locale = langCheck[lang];
        obj[locale] = {};
        for(file in files){
            if(files[file].includes(locale)){
                var filePath = getFileName(files[file]);
                obj[locale][filePath] = map[files[file]];
            }
        }
    }
    return obj;
}

function handleResult(propertiesMap, files) {
    const newMap =  filter(propertiesMap, files);
    const keylist = getKeys(propertiesMap);
    const data = csvLines(newMap, keylist);
    var output = fs.createWriteStream(csvFolder + '\\' + csvName);
    /**
     * [
     *      [path, key, ... trads>]
     * ]
     */
    const writeStream = fs.createWriteStream(csvFolder + '\\' + csvName);

    const csvMapping = {
        key : 'Key',
    }

    langCheck.forEach(e => csvMapping[e] = e);
    const writer = stringify({objectMode: true, columns: csvMapping, header: true, delimiter: ';'});
    writer.pipe(writeStream);
     data.forEach(function(e) {
        e[0] = e[0].replace('.properties', '');
        const csvObject = {
            key : '//ressource/' + e[0] + '/' + e[1]
        }
        for(let i=2; i<e.length; i++) {
            csvObject[langCheck[i-2]] = e[i];
        }
        writer.write(csvObject);
     });
     writer.end();
}