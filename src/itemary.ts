import { Events, parseLinktext } from 'obsidian';
import type { FrontMatterCache, TFile, App } from 'obsidian';


import { MyVariant, MyItem } from "./item";

export class Itemary extends Events
{
    #items: MyItem[] = []
    #sources: string[] = [];
    isReady: boolean = false;

    constructor( public readonly app: App) { super(); }

    build( app: App )
    {
        const files: TFile[] = app.vault.getMarkdownFiles();    //only with source folder??
        for( const file of files )
        {
            const frontMatter = app.metadataCache.getFileCache( file )?.frontmatter;
            if( !frontMatter ) continue;
            if( !this.hasCssClass( frontMatter, "json5e-item" ) ) continue;

            this.#items.push( this.extractItemsFromFrontmatter( file, frontMatter ) );
            this.#items = this.#items.filter(x => x != null);
        }

        console.debug( "Extracted " + this.#items.length + " items.");

        this.isReady = true;
        this.trigger( "changed" ); //notifies all listeners
    }

    getItems(): readonly MyItem[]
    {
        return this.#items;
    }

    getSources(): readonly string[]
    {
        return this.#sources;
    }


    hasCssClass( frontMatter: FrontMatterCache | null | undefined, cssClass: string ): boolean
    {
        const fm = frontMatter as ( Record<string, unknown> | undefined );
        const raw: unknown = fm?.cssclasses ?? fm?.cssclass;

        if( raw == null ) return false;

        let classes: string[] = [];
        if( Array.isArray( raw ) )
        {
            classes = raw.map(v => String(v).trim()).filter(Boolean);
        }
        else if( typeof raw === "string" )
        {
            classes = raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
        }
        else
        {
            return false;
        }
        return classes.includes( cssClass );
    }

    extractVariant(  file: TFile, variantName: string ): MyVariant
    {
        //const this.plugin.
        const markdownlink: string = this.app.fileManager.generateMarkdownLink( file, "", "#" + variantName, variantName );
        //console.debug( "variant: " + markdownlink );

        return{
                    name: variantName,
                    markdownlink: markdownlink,
                };
    }

    extractItemsFromFrontmatter( file: TFile, frontmatter: FrontMatterCache | null | undefined ): MyItem
    {
        const fm = frontmatter as ( Record<string, unknown> );

        let name: string = "";
        let imagepath: string = "";
        let detailstring: string = "";
        let infostring: string = "";
        let cost: string = "";
        let rarity: string = "undefined";      //by default?
        let rarityInt = 0;
        let variants: MyVariant[] = [];
        let type: string = "item";
        let source: string = "";
        if( fm )
        {
            if( typeof  fm["dndata-name"] === "string" )
            { name =  fm["dndata-name"]; }
            else if( typeof fm.aliases === "string"  )
            { name = fm.aliases; }
            else if( Array.isArray( fm.aliases ) && fm.aliases.length && typeof fm.aliases[0] === "string" )
            { name = fm.aliases[0] }

            //extract html image path
            if( typeof fm["dndata-image"] === "string" )
            {
                const match = fm["dndata-image"].match(/!\[[^\]]*]\(([^)]+)\)/);
                const raw = match?.[1] ?? "";   //set raw to match[1] if exists, else ""
                imagepath = parseLinktext( raw ).path;  //is simple path from vault root
            }

            //parse detail
            if( typeof fm["dndata-detail"] === "string" )
            {
                detailstring = fm["dndata-detail"]
                                        ?.replace(/\s*\(\[[^\]]*]\([^)]+\)\)/g, "")// remove " ([text](url))"
                                        .replace(/\s+,/g, ",")// fix spaces before commas
                                        .replace(/\s{2,}/g, " ")// collapse double spaces and trim
                                        .trim();

                let detailstring_lower = detailstring.toLowerCase()
                if( detailstring_lower.includes( "artifact" ) ){ cost = "infinite"; rarity = "Artifact"; rarityInt = 5; }
                else if( detailstring_lower.includes( "legendary" ) ){ cost = "200000 GM (auto)"; rarity = "legendary"; rarityInt = 4; }
                else if( detailstring_lower.includes( "very rare" ) ){ cost = "40000 GM (auto)"; rarity = "very rare"; rarityInt = 3; }
                else if( detailstring_lower.includes( "rare" ) ){ cost = "4000 GM (auto)"; rarity = "rare"; rarityInt = 2; }
                else if( detailstring_lower.includes( "uncommon" ) ){ cost = "400 GM (auto)"; rarity = "uncommon"; rarityInt = 1; }
                else if( detailstring_lower.includes( "common" ) ){ cost = "100 GM (auto)"; rarity = "common"; rarityInt = 0; }
            }

            if( typeof fm["dndata-cost"] === "string" )
            { cost = fm["dndata-cost"]; }


            let infoarray: string[] = [];
            if( typeof fm["dndata-damage"] === "string" )  //assume weapon:
            {
                infoarray.push("Damage: " + fm["dndata-damage"]);
                type = "weapon";
            }
            if( typeof fm["dndata-damage2"] === "string" )  //assume weapon:
            { infoarray.push("Two-handed: " + fm["dndata-damage2"]); }
            if( typeof fm["dndata-ac"] === "string" ) //assume armor
            {
                infoarray.push("AC: " + fm["dndata-ac"]);
                type = "armor";
            }
            if( cost !== "" ) //assume armor
            { infoarray.push("cost: " + cost); }
            if( typeof fm["dndata-weight"] === "string" ) //assume armor
            { infoarray.push("weight: " + fm["dndata-weight"]); }


            if( infoarray.length > 0 )
            {
                infostring = "(";
                for (let index = 0; index < infoarray.length-1; index++)
                {
                    infostring += infoarray[index] + ", ";
                }
                infostring += ( infoarray.pop() ?? "" ) + ")";
            }

            if( typeof fm["dndata-source"] === "string" )
            {
                source = fm["dndata-source"];
                if( !this.#sources.includes( source ) )
                {
                    this.#sources.push( source );
                }
            }

            if( Array.isArray( fm["dndata-variants"] ) )
            {
                fm["dndata-variants"].forEach( variantName => {
                    if( typeof variantName === "string" )
                        variants.push( this.extractVariant( file, variantName ) );
                });
            }
        }
        else
        { name = file.basename; }

        //extract markdown link to this file
        const sourcePath = file.path;
        const markdownlink = this.app.fileManager.generateMarkdownLink( file, "", "", name );

        //console.debug( "extracted: " + name );

        //must return item
        return {
                name: name,
                markdownlink: markdownlink,
                detail: detailstring,
                infotext: infostring,
                imagePath: imagepath,
                filePath: sourcePath,
                cost: cost,
                weight: typeof fm["dndata-weight"] === "string" ? fm["dndata-weight"] : "",
                damage: fm["dndata-damage"],
                damage2: fm["dndata-damage2"],
                ac: fm["dndata-ac"],
                range: fm["dndata-range"],
                rarity: rarity,
                rarityInt: rarityInt,
                variants: variants,
                type: type,
                source: source,
            };
    }
}
