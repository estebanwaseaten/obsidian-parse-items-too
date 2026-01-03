import { App, Editor, MarkdownView, Modal, Notice, Plugin, Events, TFile, parseLinktext } from 'obsidian';

import { ParseItemsToo } from "./main"
import { MyItem } from "./item";

export class Itemary extends Events
{
    #items: MyItem[] = []

    /*constructor()
    {
        super(this);
    }*/

    build( plugin: ParseItemsToo )
    {
        const files = plugin.app.vault.getMarkdownFiles();
        for( const file of files )
        {
            const frontMatter = plugin.app.metadataCache.getFileCache( file )?.frontmatter;
            if( !frontMatter ) continue;
            if( !hasCssClass( frontMatter, "json5e-item" ) ) continue;

            this.#items.push( extractItemsFromFrontmatter( file, frontMatter ) );
            this.#items = this.#items.filter(x => x != null);
        }

        console.log( "extracted " + this.#items.length + " items.");

        /*for( const item of this.#items )
        {
            console.debug( item.name + ": " + item.detail );
        }*/

        this.trigger("changed"); //notifies all listeners
    }

    getItems(): readonly MyItem[]
    {
        return this.#items;
    }
}

function hasCssClass(frontMatter: any, cssClass: string): boolean
{
    const raw = frontMatter?.cssclasses ?? frontMatter?.cssclass;
    if( !raw ) return false;

    let temp;
    if( Array.isArray( raw ) )
    {
        temp = raw.map( String );
    }
    else
    {
        temp = String(raw).split(/[,\s]+/).filter(Boolean);
    }
    return temp.includes( cssClass );
}

function extractItemsFromFrontmatter( file: TFile, frontmatter: any ): MyItem
{
    //try to get the item name from dndata-name, aliases or filename
    let name: string = "";
    if( typeof frontmatter["dndata-name"] === "string" )
    {
        name = frontmatter["dndata-name"];
        //console.log("extract..." );
    }
    else if( Array.isArray(frontmatter?.["aliases"]) )
    {
        name = frontmatter["aliases"][0];
        //console.log("extract..." + frontmatter["aliases"][0] );
    }
    else //maybe add a setting to skip (i.e. return null)
    {
        name = file.basename;
    }

    //extract markdown link to file
    const sourcePath = file.path;
    const markdownlink = this.app.fileManager.generateMarkdownLink( file, sourcePath, "", name );

    //extract html link to file... (necessary?)
    const link = "";

    //extract html image path
    let imagepath: string = "";
    if( frontmatter["dndata-image"] )
    {
        const match = frontmatter["dndata-image"].match(/!\[[^\]]*]\(([^)]+)\)/);
        const raw = match?.[1] ?? "";   //set raw to match[1] if exists, else ""
        const { path: linkpath } = parseLinktext( raw );
        const file = app.vault.getAbstractFileByPath( linkpath );
        if (file instanceof TFile)
        {
            imagepath = app.vault.getResourcePath(file);
        }
    }

    //![](sources/base2024/book/items/img/wings-of-flying.webp#right)
    //vault.getResourcePath(file)

    //parse detail
    //remove links: (extract with .match())
    let detailstring: string = "";
    let cost: string = "";
    let rarity: string = "";
    let rarityInt = 0;
    if( frontmatter["dndata-detail"] )
    {
        detailstring = frontmatter["dndata-detail"]
                                // remove " ([text](url))"
                                ?.replace(/\s*\(\[[^\]]*]\([^)]+\)\)/g, "")
                                // fix spaces before commas
                                .replace(/\s+,/g, ",")
                                // collapse double spaces and trim
                                .replace(/\s{2,}/g, " ")
                                .trim();

        let detailstring_lower = detailstring.toLowerCase()
        if( detailstring_lower.includes( "artifact" ) ){ cost = "infinite"; rarity = "Artifact"; rarityInt = 5; }
        else if( detailstring_lower.includes( "legendary" ) ){ cost = "200000 GM (auto)"; rarity = "legendary"; rarityInt = 4; }
        else if( detailstring_lower.includes( "very rare" ) ){ cost = "40000 GM (auto)"; rarity = "very rare"; rarityInt = 3; }
        else if( detailstring_lower.includes( "rare" ) ){ cost = "4000 GM (auto)"; rarity = "rare"; rarityInt = 2; }
        else if( detailstring_lower.includes( "uncommon" ) ){ cost = "400 GM (auto)"; rarity = "uncommon"; rarityInt = 1; }
        else if( detailstring_lower.includes( "common" ) ){ cost = "100 GM (auto)"; rarity = "common"; rarityInt = 0; }
    }

    if( frontmatter["dndata-cost"] )
    {
        cost = frontmatter["dndata-cost"];
    }


    let infoarray: string[] = [];
    //infotext
    if( frontmatter["dndata-damage"] )  //assume weapon:
    {
        infoarray.push("Damage: " + frontmatter["dndata-damage"]);
    }
    if( frontmatter["dndata-damage2"] )  //assume weapon:
    {
        infoarray.push("Two-handed: " + frontmatter["dndata-damage2"]);
    }
    if( frontmatter["dndata-ac"] ) //assume armor
    {
        infoarray.push("AC: " + frontmatter["dndata-ac"]);
    }
    if( cost !== "" ) //assume armor
    {
        infoarray.push("cost: " + cost);
    }
    if( frontmatter["dndata-weight"] ) //assume armor
    {
        infoarray.push("weight: " + frontmatter["dndata-weight"]);
    }

    let infostring: String = "";
    if( infoarray.length > 0 )
    {
        infostring = "(";
        for (let index = 0; index < infoarray.length-1; index++)
        {
            infostring += infoarray[index] + ", ";
        }
        infostring += ( infoarray.pop() ?? "" ) + ")";
    }

    let variants: string[] = [];
    if( frontmatter["dndata-variants"] )
    {
        //console.log( frontmatter["dndata-variants"] );
        variants = frontmatter["dndata-variants"];
    }

    //must return item
    return {
            name: name,
            link: link,
            markdownlink: markdownlink,
            detail: detailstring,
            infotext: infostring,
            imagePath: imagepath,
            cost: cost,
            weight: frontmatter["dndata-weight"],
            damage: frontmatter["dndata-damage"],
            damage2: frontmatter["dndata-damage2"],
            ac: frontmatter["dndata-ac"],
            range: frontmatter["dndata-range"],
            rarity: rarity,
            rarityInt: rarityInt,
            variants: variants,
        };
}
