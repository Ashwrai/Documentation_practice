const path = require('path');
const fs = require('fs');
const { mdToPdf } = require('md-to-pdf');
const PDFMerger = require('pdf-merger-js');
const merger = new PDFMerger();


function parseMD(content, f){
    const components = {
        id:{
            adding: false,
            content: ""
        },
        title:{
            adding: false,
            content: ""
        },
        type: {
            adding:false,
            content: "",
        },
        version: {
            adding:false,
            content: ""
        },
        description:{
            adding: false,
            content: ""
        },
        relations:{
            adding: false,
            content: ""
        },
        comments:{
            adding: false,
            content: ""
        },
    }
    for (const line of content.split('\n')) {
        if(line.includes('###')) {
            for (const component in components) {
                components[component].adding=line.toLowerCase().includes(component)
            }
        } else {
            for (const component in components) {
                if(components[component].adding){
                    components[component].content += line.trim()
                    break;
                }
            }
        }
    }

    const finalObj = {}
    for (const component in components) {
        finalObj[component] = components[component].content
    }
    finalObj.original = `[GitHub Reference](https://github.com/Ashwrai/ES23UAB-431-08/tree/main/requirements/${f})`
    return finalObj
}

function parsedMdToTable(md){
    let content = `## ${md.id}\n`
    content+="| property | value |\n"
    content+="|--|--|\n"
    for (const component in md) {
        content+=`| ${component} | ${md[component]} |\n`
    }
    return content
}

function parsedMdToSimplifiedTable(requirements_parsed){
    let content = "| requirement | type | title | description |\n"
    content+="|--|--|--|--|\n"
    for (const requirement of requirements_parsed) {
        content+=`| [${requirement.id}](##${requirement.id.split(' ').join('-')}) | ${requirement.type} | ${requirement.title} | ${requirement.description} |\n`
    }
    return content
}

//joining path of directory 
const directoryPath = path.join(__dirname, '../../requirements/');
//passsing directoryPath and callback function
fs.readdir(directoryPath, async (err, files) => {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    const requirements = {
        rf: [],
        rnf: []
    }
    await Promise.all(files.map(async (f)=>{
        const content = await fs.readFileSync(directoryPath+f,{
            encoding: 'utf8'
        })
        try {
            const requirement = parseMD(content, f)
            if(requirement.id.startsWith('RF')){
                requirements.rf.push(requirement)
            } else {
                requirements.rnf.push(requirement)
            }
        } catch (error) {
            console.log('error while parsing', f)
        }
    }))

    const pdfs = []
    for (const requirement_type in requirements) {
        if (Object.hasOwnProperty.call(requirements, requirement_type)) {
            pdfs.push(await mdToPdf({
                content: Buffer.from(parsedMdToSimplifiedTable(requirements[requirement_type]))
            }))
        }
    }

    for (const requirement_type in requirements) {
        const category = requirements[requirement_type];
        pdfs.push(...await Promise.all(category.map(async (requirement)=>{
            return await mdToPdf({
                content: Buffer.from(parsedMdToTable(requirement), 'utf8'),
            })
        })))
    }

    for (const pdf of pdfs) {
        await merger.add(pdf.content)
    }

    const final_out = '../working-documents/requirements.pdf'
    await merger.save(final_out);
    console.log('exported', final_out)
});