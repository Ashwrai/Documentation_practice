const PDFMerger = require('pdf-merger-js');
const merger = new PDFMerger();
const fs = require('fs');

const out_path = "../../documents/"
const in_path = "../working-documents/"
const out_name = "especificaciones y requisitos.pdf"
const requeriments_file = "requisitos.pdf"
fs.readdir(in_path, async (err, files) => {

    await Promise.all(files.map(async (f)=>{
        if(fs.lstatSync(f).isDirectory()){
            fs.readdir(`${in_path}${f}`, async (err, docs)=>{
                if(!fs.lstatSync(f).isDirectory()){
                    await merger.add(`${in_path}${f}/${docs}`)
                }
            })
            await merger.add(`${in_path}${requeriments_file}`)
            await merger.save(`${out_path}${f}`);
        }
    }))
});