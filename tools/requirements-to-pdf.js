const path = require('path');
const fs = require('fs');
const { mdToPdf } = require('md-to-pdf');
const PDFMerger = require('pdf-merger-js');
const merger = new PDFMerger();

//joining path of directory 
const directoryPath = path.join(__dirname, '../requirements/');
//passsing directoryPath and callback function
fs.readdir(directoryPath, async (err, files) => {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    const pdfs = await Promise.all(files.map(async (f)=>{
        const content = await fs.readFileSync(directoryPath+f,{
            encoding: 'utf8'
        })
        const pdf = await mdToPdf({
            content: content + `\n\n[See on GitHub](https://github.com/Ashwrai/ES23UAB-431-08/blob/main/requirements/${f})`
        })
        pdf.filename = `${f}.pdf`
        return pdf
    }))

    for (const pdf of pdfs) {
        await merger.add(pdf.content)
    }

    await merger.save('../documents/requeriments.pdf');


});