const path = require('path');
const fs = require('fs');
const { mdToPdf } = require('md-to-pdf');


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
                    if(line.trim()){
                        components[component].content += line.trim()
                        if(component == 'relations') components[component].content += ','
                    }
                    break;
                }
            }
        }
    }

    const finalObj = {}
    for (const component in components) {
        finalObj[component] = components[component].content
    }

    finalObj.relations = finalObj.relations.slice(0, -1)
    if(finalObj.relations && finalObj.relations.toLowerCase()!='pending'){
        finalObj.relations = finalObj.relations.split(',').map(r=>`[${r}](#${r.split(' ').join('-').toUpperCase()})`).join(', ')
    }
    finalObj.original = `[GitHub Reference](https://github.com/Ashwrai/ES23UAB-431-08/tree/main/requirements/${f})`
    return finalObj
}

function parsedMdToTable(md){
    let content = `<a name="${md.id.split(' ').join('-')}">\n\n ## ${md.id}</a>\n\n`
    content+="| property | value |\n"
    content+="|--|--|\n"
    for (const component in md) {
        content+=`| ${component} | ${md[component]} |\n`
    }
    return content
}

function parsedMdToSimplifiedTable(requirements_parsed){
    let content = ""
    for (let i = 0; i < requirements_parsed.length; i++) {
        if(i==0||i%7==0){
            if(i>0) {
                content+=page_break
            }
            content+="| requirement | type | title | description |\n"
            content+="|--|--|--|--|\n"
        }
        const requirement = requirements_parsed[i];
        content+=`| [${requirement.id}](#${requirement.id.split(' ').join('-')}) | ${requirement.type} | ${requirement.title} | ${requirement.description} |\n`
    }
    return content
}


const page_break = '<div style="page-break-after: always;"></div>\n\n'
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

    let content = ""
    for (const requirement_type in requirements) {
        if (Object.hasOwnProperty.call(requirements, requirement_type)) {
            content+='# ' + (requirement_type == 'rf' ? 'Functional Requirements' : 'Non-Functional Requirements') + '\n' + parsedMdToSimplifiedTable(requirements[requirement_type])+page_break
        }
    }

    for (const requirement_type in requirements) {
        content+='# ' + (requirement_type == 'rf' ? 'Functional Requirements' : 'Non-Functional Requirements') + '\n'
        const category = requirements[requirement_type];
        for (let i = 1; i <= category.length; i++) {
            const element = category[i-1];
            content+=parsedMdToTable(element)
            if(i%2==0||i==category.length) {
                content+=page_break
            } else {
                content+='\n'.repeat(3)
            }
        }
    }
    
    const pdf = await mdToPdf({
        content: Buffer.from(content, 'utf8'),
    }, {
        css: 'table {width:100%!important;display:table}'
    })

    const final_out = '../working-documents/requirements.pdf'
    fs.writeFileSync(final_out, pdf.content, {
        encoding: 'utf8'
    })
    console.log('exported', final_out)
});