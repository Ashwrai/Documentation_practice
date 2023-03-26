const PDFMerger = require('pdf-merger-js');
const merger = new PDFMerger();
const fs = require('fs');

const out_path = "../../documents/"
const out_name = "Especificacions i Requeriments.pdf"
const requeriments_file = "requeriments.pdf"
fs.readdir(out_path, async (err, files) => {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    await Promise.all(files.map(async (f)=>{
        if(f!=requeriments_file && f!=out_name){
            await merger.add(`${out_path}${f}`)
        }
    }))
    await merger.add(`${out_path}${requeriments_file}`)
    await merger.save(`${out_path}${out_name}`);
});