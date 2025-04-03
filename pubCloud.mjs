console.log('importing from pubCloud.mjs');

//import('https://episphere.github.io/gemini/gem.mjs')
const GEM = (await import('https://episphere.github.io/gemini/gem.mjs')).GEM
const embed = (new GEM).embed
//const embed = (new (await import('https://episphere.github.io/gemini/gem.mjs')).GEM).embed

async function embedPMID(pmid=36745477) {
    // x = await (await import('./pubCloud.mjs')).embedPMID()
    // x = await (await import('https://epiverse.github.io/pubCloud/pubCloud.mjs')).embedPMID()
    let txt = await (await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=text&rettype=abstract`)).text()
    let emb = await embed(txt)
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
    a.hidden=true
    document.body.appendChild(a)
    a.href = url;
    a.download = fileName;
    a.click()
    a.parentElement.removeChild(a) // cleanup
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
            loadFile.parentElement.removeChild(loadFile) // cleanup
        }
        fr.readAsText(loadFile.files[0]);
    }
    loadFile.click()
}

export {GEM, embed, embedPMID, embedPMIDs, readTextFile, saveFile}

// embedPMID = (await import('./pubCloud.mjs')).embedPMID
// embedPMID = (await import('https://epiverse.github.io/pubCloud/pubCloud.mjs')).embedPMID
// txt = await (await import('./pubCloud.mjs')).embedPMID(36745477)
