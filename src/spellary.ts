import { Events, parseLinktext } from 'obsidian';
import type { FrontMatterCache, TFile, App } from 'obsidian';
import { MySpell } from "./spell";

export class Spellary extends Events
{
    #spells: MySpell[] = [];
    #classes: string[] = [];
    #sources: string[] = [];
    isReady: boolean = false;

    constructor( public readonly app: App) { super(); }

    build( app: App )
    {
        const files: TFile[] = app.vault.getMarkdownFiles();
        for( const file of files )
        {
            const frontMatter = app.metadataCache.getFileCache( file )?.frontmatter;
            if( !frontMatter ) continue;
            if( !this.hasCssClass( frontMatter, "json5e-spell" ) ) continue;

            this.#spells.push( this.extractSpellsFromFrontmatter( file, frontMatter ) );
            this.#spells = this.#spells.filter(x => x != null);
        }

        console.debug( "Extracted " + this.#spells.length + " spells.");

        this.isReady = true;
        this.trigger( "changed" ); //notifies all listeners
    }

    getSpells(): readonly MySpell[]
    {
        return this.#spells;
    }

    getClasses(): readonly string[]
    {
        return this.#classes;
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

    extractSpellsFromFrontmatter( file: TFile, frontmatter: FrontMatterCache | null | undefined ): MySpell
    {
        const fm = frontmatter as ( Record<string, unknown> );

        let name: string = "";
        let imagepath: string = "";

        //let detailstring: string = "";
        //let infostring: string = "";
        let castingtime: string = "";

        let isritual: boolean = false;
        let range: string = "";
        let components: string = "";
        let duration: string = "";
        let level: string = "";
        let school: string = "";
        let classes: string = "";
        let levelInt: number = -1;
        let classArray: string[] = [];
        let detail: string = '';
        let infotext: string = '';
        let source: string = '';

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

            if( typeof fm["dndata-castingtime"] === "string" )
            { castingtime = fm["dndata-castingtime"]; }

            if( typeof fm["dndata-ritual"] === "boolean" )
            { isritual = fm["dndata-ritual"]; }

            if( typeof fm["dndata-range"] === "string" )
            { range = fm["dndata-range"]; }

            if( typeof fm["dndata-components"] === "string" )
            { components = fm["dndata-components"]; }

            if( typeof fm["dndata-duration"] === "string" )
            { duration = fm["dndata-duration"]; }

            if( typeof fm["dndata-level"] === "string" )
            {
                level = fm["dndata-level"];
                let level_lower = level.toLowerCase();
                if( level_lower.includes("1st")){levelInt = 1;}
                else if( level_lower.includes("2nd")){levelInt = 2;}
                else if( level_lower.includes("3rd")){levelInt = 3;}
                else if( level_lower.includes("4th")){levelInt = 4;}
                else if( level_lower.includes("5th")){levelInt = 5;}
                else if( level_lower.includes("6th")){levelInt = 6;}
                else if( level_lower.includes("7th")){levelInt = 7;}
                else if( level_lower.includes("8th")){levelInt = 8;}
                else if( level_lower.includes("9th")){levelInt = 9;}
                else if( level_lower.includes("cantrip")){levelInt = 0;}
            }

            if( typeof fm["dndata-school"] === "string" )
            { school = fm["dndata-school"]; }

            if( typeof fm["dndata-source"] === "string" )
            {
                source = fm["dndata-source"];
                if( !this.#sources.includes( source ) )
                {
                    this.#sources.push( source );
                }
            }

            if( Array.isArray( fm["dndata-classes"] ) )
            {
                if( fm["dndata-classes"].length > 0 )
                {
                    classes = "";
                    for (let index = 0; index < fm["dndata-classes"].length-1; index++)
                    {
                        const thisClass: unknown = fm['dndata-classes']?.[index];
                        if ( typeof thisClass === "string")
                        {
                            classes += thisClass + ", ";
                            classArray.push( thisClass );
                            if( !this.#classes.includes( thisClass ) ){ this.#classes.push( thisClass ); }
                        }
                    }
                    const index = fm["dndata-classes"].length-1;
                    const thisClass: unknown = fm['dndata-classes']?.[index];
                    if ( typeof thisClass === "string")
                    {
                        classes += thisClass;
                        classArray.push( thisClass );
                    }
                }
                 this.#classes.sort();
            }
        }
        else
        { name = file.basename; }

        detail += (level === "" ? "" : level + ', ');
        detail += (castingtime === "" ? "" : castingtime + ', ');
        detail += (components === "" ? "" : components + ', ');
        detail += (isritual ? " ritual, " : "");

        infotext += 'classes: ' + classes;


        //extract markdown link to this file
        const sourcePath = file.path;
        const markdownlink = this.app.fileManager.generateMarkdownLink( file, "", "", name );

        //must return spell
        return {
                name: name,
                markdownlink: markdownlink,
                imagePath: imagepath,
                filePath: sourcePath,
                castingtime: castingtime,
                isritual: isritual,
                range: range,
                components: components,
                duration: duration,
                level: level,
                levelInt: levelInt,
                school: school,
                classes: '(' + classes + ')',
                classArray: classArray,
                detail: detail.slice( 0, -2 ),
                infotext: infotext,
                source: source,
            };
    }
}
