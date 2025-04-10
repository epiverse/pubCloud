console.log('importing from pubCloud.mjs');

//import('https://episphere.github.io/gemini/gem.mjs')
const GEM = (await import('https://episphere.github.io/gemini/gem.mjs')).GEM
const embed = (new GEM).embed
//const embed = (new (await import('https://episphere.github.io/gemini/gem.mjs')).GEM).embed
const localforage = (await import('https://cdn.jsdelivr.net/npm/localforage@1.10.0/+esm')).default

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

async function embeddAbstracts(abss) {
    if (!abss) {
        abss = await (await import('./pubCloud.mjs')).indexAbstracts()
    }
    for (let i = 0; i < abss.length; i++) {
        console.log(`${i}: embeding pmid ${abss[i].pmid}`)
        try {
            abss[i].embed = await embed(abss[i].txt.slice(0, 35314))
        } catch (err) {
            console.log(err)
            abss[i].embed = NaN
        }
    }
    return abss
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
let countBatch = 0
async function getAllAbstracts(docs) {
    if (!docs) {
        docs = await assembleFromSource()
    }
    let txts = ''
    const ids = await listPubMedIDs()
    const k = 250
    let countBatch = 0
    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    for (let i = 0; i < ids.length; i = i + k) {
        countBatch++
        let batchPubMedIDs = ids.slice(i, i + k)
        console.log(`batch #${countBatch}, [n=${batchPubMedIDs.length}] index #${i}`)
        txts += await (await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${batchPubMedIDs.join()}&retmode=text&rettype=abstract`)).text()
        await delay(10000)
    }
    return txts
    //\nPMID: 39255366
}

async function indexAbstracts(url='https://raw.githubusercontent.com/epiverse/pubCloud/refs/heads/main/abstractsText.txt') {
    // index abstracts
    let txts = await (await fetch(url)).text()
    // txt.split(/\n\n\n/)[0].match(/\nPMID: ([\w]+)/)[1]
    let idxedAbstracts = txts.split(/\n\n\n/).map( (x, i) => {
        let pmid = NaN
        //try{
        pmid = x.match(/\nPMID: ([\w]+)/)[1]
        //} catch (err){
        //    console.log(i,err)
        //}
        let idx = {
            txt: x,
            pmid: pmid,
            i: i
        }
        //console.log(idx)
        return idx
    }
    )
    // [0].match(/\nPMID: ([\w]+)/)
    return idxedAbstracts
}

async function mendEmbeddedAbstracts(embAbs) {
    if (!embAbs) {
        embAbs = await (await fetch('./yyy.json')).json()
    }
    // -- unfinished
}

function parseAbs(txt) {
    let av = txt.split(/\n\n/g)
    return {
        publ: av[0],
        title: av[1],
        authors: av[2],
        authInfo: av[3],
        abstract: av[4],
        copyRight: av[5],
        doi: av[6],
        conflict: av[7]
    }
}

// abs assembler

async function absAssembler(abs) {
    //inputs raw twxt file
    if (!abs) {
        abs = await indexAbstracts()
    }
    // parse

    abs = abs.map(x => {
        let av = x.txt.split(/\n\n/g)
        x.publ = av[0];
        x.title = av[1];
        x.authors = av[2];
        x.authInfo = av[3];
        x.abstract = av[4];
        x.copyRight = av[5];
        x.doi = av[6];
        x.conflict = av[7];
        return x
    }
    )
    return abs
}

async function embedTitleAbs(abs) {
    if (!abs) {
        abs = await absAssembler()
    }
    for (let i = 0; i < abs.length; i++) {
        let txti = `TITLE: ${abs[i].title} \nABSTRACT: ${abs[i].abstract}`
        abs[i].embed = await embed(txti.slice(0, 35000))
        console.log(`Embedding ${i}/${abs.length}`)
    }
    return abs
}

// generate tensor tsv file

async function json4tsvTensor(jsn) {
    if (!jsn) {
        jsn = await (await fetch('./embedTitleAbs.json')).json()
    }
    jsn = jsn.map(x => x.embed)
    // extract embeddings
    let tsv = jsn.map(x => x.join('\t')).join('\n')
    return tsv
}

// docs assembler

async function assembleFromSource(url='https://raw.githubusercontent.com/epiverse/pubCloud/refs/heads/main/5%20years%20data%20publications.tsv') {
    let docs = await tsv2json(await (await fetch(url)).text());
    docs = docs.map( (x, i) => {
        x.i = i
        return x
    }
    )
    return docs
}

// create annotation files for existing embeddings, projector.tensorflow.org style

async function metaCreatorBranches(docs, keyPmids) {
    if (!docs) {
        docs = await assembleFromSource()
    }
    if (!keyPmids) {
        keyPmids = await (await fetch(`https://raw.githubusercontent.com/epiverse/pubCloud/refs/heads/main/keyPmids.json`)).json()
    }
    // get branches for keyPmids
    let listOfBranches = []
    let branches = keyPmids.map(ki => {
        let di = docs.filter(d => (ki.toString().slice(0, 8) == d.PubMedID))
        // console.log(ki,di)
        let Branch = di[0].Branch
        // clean branch description by removing /TDRP fetch
        Branch = Branch.replace(/TDRP/g, '').replace(/"/g, '').replace(/\/+/g, ' ').replace(/[, ]+/g, ',').replace(/^\,/g, '').split(',').filter(x => x.length > 0)
        listOfBranches = listOfBranches.concat(Branch)
        return [...new Set(Branch)]

    }
    )
    listOfBranches = [...new Set(listOfBranches)].sort()
    // 11 DCEG branches

    // assemble metadata file
    // Column Header
    let metaTSV = 'row\tBranches'
    for (let j = 0; j < listOfBranches.length; j++) {
        metaTSV += `\t${listOfBranches[j]}`
    }
    // Table body
    for (let i = 0; i < branches.length; i++) {  // rows
        metaTSV += `\n${i + 1}\t${branches[i].join(',')}`
        for (let j = 0; j < listOfBranches.length; j++) {
            metaTSV += `\t${listOfBranches[j]}`
        }
    }
    saveFile(metaTSV, 'metaBranch.tsv')
    return branches
}

export {GEM, embed, embedPMID, embedPMIDs, readTextFile, saveFile, assembleFromSource, indexPubMedIDs, listPubMedIDs, getAllAbstracts, indexAbstracts, embeddAbstracts, parseAbs, absAssembler, embedTitleAbs, json4tsvTensor, metaCreatorBranches}

// embedPMID = (await import('./pubCloud.mjs')).embedPMID
// embedPMID = (await import('https://epiverse.github.io/pubCloud/pubCloud.mjs')).embedPMID
// txt = await (await import('./pubCloud.mjs')).embedPMID(36745477)
// json = await (await import('https://epiverse.github.io/pubCloud/pubCloud.mjs')).assembleFromSource()
