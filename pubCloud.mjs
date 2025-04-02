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
    // x is the content of the file
    var bb = new Blob([txt]);
    var url = URL.createObjectURL(bb);
    var a = document.createElement('a')
    a.href = url;
    if (fileName) {
        if (typeof (fileName) == "string") {
            // otherwise this is just a boolean toggle or something of the sort
            a.download = fileName;
        }
        a.click()
        // then download it automatically
    }
    return a
}

async function readTextFile() {
    let ip = document.createElement('input');
    ip.type = 'file'
    let fr = new FileReader();
    fr.onload = function() {
        let fname = fr.files[0].name.match(/(.+)\.[^\.]+/)[1] + '.csv'
        debugger
    }
    fr.readAsText(fr.files[0]);
}

/*
	//ip.click()
	const reader = new FileReader();
    reader.onload = function(e) {
    document.getElementById('fileContent').textContent = e.target.result;
      };

      reader.onerror = function(e) {
        document.getElementById('fileContent').textContent = "Error reading file: " + e.message;
      };

      reader.readAsText(file);
    }
}
*/

export {GEM, embed, embedPMID, embedPMIDs, readTextFile, saveFile}

// embedPMID = (await import('./pubCloud.mjs')).embedPMID
// embedPMID = (await import('https://epiverse.github.io/pubCloud/pubCloud.mjs')).embedPMID
// txt = await (await import('./pubCloud.mjs')).embedPMID(36745477)
