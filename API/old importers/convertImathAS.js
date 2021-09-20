const LibreTexts = require("./reuse.js")

const root = "Community_Gallery/IMathAS_Assessments";

async function main(path = root) {
    await LibreTexts.sleep(2000)
    let response = await LibreTexts.authenticatedFetch(path, 'subpages?limit=all&dream.out.format=json', "query", "LibreBot");
    response = await response.json();
    
    let subpageArray = response['page.subpage'];
    if (!subpageArray)
        return;
    
    if (!subpageArray.length) {
        subpageArray = [subpageArray];
    }
    
    for (let page of subpageArray) {
        switch (page.article) {
            case "topic":
                const id = page["@id"];
                if (id === page.title)
                    continue;
                
                // console.log(page);
                let result = await LibreTexts.authenticatedFetch(id, `move?title=${id}&dream.out.format=json`, "query", "LibreBot", {
                    method: "POST"
                });
                if (!result.ok)
                    console.error(await result.json());
                break;
            default:
                console.log(page.path['#text']);
                await main(page.path['#text'])
                break;
        }
        await LibreTexts.sleep(2000)
    }
    // console.log(response);
}

main()
