const PDFMerger = require('pdf-merger-js');

const fs = require('fs');

const out_path = "../../documents/"
const in_path = "../working-documents/"
const requeriments_file = "requirements.pdf"

if (!fs.existsSync(out_path)){
    fs.mkdirSync(out_path);
}

fs.readdir(in_path, async (err, files) => {
    await Promise.all(files.map(async (sprint)=>{
        if(fs.lstatSync(`${in_path}${sprint}`).isDirectory()){

            // read all sprints
            fs.readdir(`${in_path}${sprint}`, async (err, docs) => {
                // for every sprint, append all the documents
                const merger = new PDFMerger();
                await Promise.all(docs.map(async (doc)=>{
                    if(!fs.lstatSync(`${in_path}${sprint}/${doc}`).isDirectory()){
                        await merger.add(`${in_path}${sprint}/${doc}`)
                    }
                }))
                // append the requirements file
                await merger.add(`${in_path}${requeriments_file}`)

                // export to /documents
                const final_name = `${out_path}${sprint}.pdf`
                await merger.save(`${out_path}${sprint}.pdf`);
                console.log('exported', final_name)

                try {
                    const symlink_path = `${out_path}${sprint}-contents`
                    fs.symlinkSync(`../others/working-documents/${sprint}`, symlink_path, 'dir')
                    console.log('created symlink', symlink_path)
                } catch (error) {
                    console.log('symlink already exists')
                }
            });
        }
    }))
});