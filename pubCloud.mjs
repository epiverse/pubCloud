console.log('importing from pubCloud.mjs');

import('https://episphere.github.io/gemini/gem.mjs')
embed = (new (await import('https://episphere.github.io/gemini/gem.mjs')).GEM).embed

async function embedPMID(pmid=36745477){
    let txt = await (await fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=39992653&retmode=text&rettype=abstract')).text()
    return txt
}

export{
    embedPMID
}