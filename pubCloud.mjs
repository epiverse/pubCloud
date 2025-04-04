console.log('importing from pubCloud.mjs');

//import('https://episphere.github.io/gemini/gem.mjs')
const GEM = (await import('https://episphere.github.io/gemini/gem.mjs')).GEM
const embed = (new GEM).embed
//const embed = (new (await import('https://episphere.github.io/gemini/gem.mjs')).GEM).embed

async function embedPMID(pmid=36745477) {
    // x = await (await import('./pubCloud.mjs')).embedPMID()
    // x = await (await import('https://epiverse.github.io/pubCloud/pubCloud.mjs')).embedPMID()
    let txt = await (await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=text&rettype=abstract`)).text()
    let emb = await embed(txt.slice(0, 35314))
    return {
        pmid: pmid,
        abstract: txt,
        embedding: emb
    }
}

async function embedPMIDs(pmids=[36745477, 39992653, 12611807]) {
    let embeds = []
    let n = pmids.length
    console.log(`embedding ...`)
    for (let i = 0; i < n; i++) {
        await embeds.push(await embedPMID(pmids[i]))
        console.log(`${i + 1}/${n}`)
    }
    console.log(`embedding ... done`)
    return embeds
}

function saveFile(txt=':-)', fileName="hello.txt") {
    var bb = new Blob([txt]);
    var url = URL.createObjectURL(bb);
    var a = document.createElement('a')
    a.hidden = true
    document.body.appendChild(a)
    a.href = url;
    a.download = fileName;
    a.click()
    a.parentElement.removeChild(a)
    // cleanup
    return a
}

async function readTextFile(fun=console.log) {
    let loadFile = document.createElement('input')
    loadFile.type = 'file';
    loadFile.hidden = true;
    document.body.appendChild(loadFile);
    loadFile.onchange = evt => {
        let fr = new FileReader();
        fr.onload = function() {
            fun(fr.result)
            loadFile.parentElement.removeChild(loadFile)
            // cleanup
        }
        fr.readAsText(loadFile.files[0]);
    }
    loadFile.click()
}

/*
function tsv2json(tsv){
    let json = tsv.split(/[\n\r]+/).map(row=>row.split(/\t/))
    // transpose json
    let jsonT=[]
    let attrs = json[0]
    attrs.forEach((attr,j)=>{
        jsonT[attr]=[]
        json.slice(1).forEach((row,i)=>{
            jsonT[attr][i]=json[i][j]=row[j]
        })
    })    
    return jsonT
}
*/

function tsv2json(tsv) {
    let json = tsv.split(/[\n\r]+/).map(row => row.split(/\t/))
    let attrs = json[0]
    json = json.slice(1).map( (row, i) => {
        let rowObj = {}
        attrs.forEach( (attri, j) => {
            rowObj[attri] = row[j]
        }
        )
        return rowObj
    }
    )
    return json
}

async function indexPubMedIDs(docs) {
    if (!docs) {
        docs = await assembleFromSource()
    }
    let PubMedIDs = docs.filter(x => x.PubMedID).filter(x => x.PubMedID.length > 0).map(x => x.PubMedID)
    //.slice(20,30) // while debugging
    let indexedPubMedIDs = await embedPMIDs(PubMedIDs)
    return indexedPubMedIDs
}
async function listPubMedIDs(docs) {
    if (!docs) {
        docs = await assembleFromSource()
    }
    let PubMedIDs = docs.filter(x => x.PubMedID).filter(x => x.PubMedID.length > 0).map(x => x.PubMedID)
    return PubMedIDs
}

// Get all absracts from NCBI eutils in batch
let countBatch=0
async function getAllAbstracts(docs) {
    let txts = ''
    if (!docs) {
        docs = await assembleFromSource()
    }
    const ids = await listPubMedIDs()
    const k = 250
    const tLag = 10000
    // get abstracts in batches of 250
    for(let i=0 ; i<ids.length ; i=i+k){
        let batchPubMedIDs = ids.slice(i,i+k)
        //console.log(batchPubMedIDs)
        await setTimeout(async function(){
            countBatch++
            console.log(`batch #${countBatch}, [n=${batchPubMedIDs.length}] index #${i}`)
            txts += await (await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${batchPubMedIDs.join()}&retmode=text&rettype=abstract`)).text()
        },tLag*countBatch)
    }
    return txts
}

// master assembler

async function assembleFromSource(url='https://raw.githubusercontent.com/epiverse/pubCloud/refs/heads/main/5%20years%20data%20publications.tsv') {
    let docs = await tsv2json(await (await fetch(url)).text());
    docs = docs.map((x,i)=>{
        x.i=i
        return x
    })
    return docs
}

export {
    GEM,
    embed,
    embedPMID,
    embedPMIDs,
    readTextFile,
    saveFile,
    assembleFromSource,
    indexPubMedIDs,
    listPubMedIDs,
    getAllAbstracts}

// embedPMID = (await import('./pubCloud.mjs')).embedPMID
// embedPMID = (await import('https://epiverse.github.io/pubCloud/pubCloud.mjs')).embedPMID
// txt = await (await import('./pubCloud.mjs')).embedPMID(36745477)
// json = await (await import('https://epiverse.github.io/pubCloud/pubCloud.mjs')).assembleFromSource()
