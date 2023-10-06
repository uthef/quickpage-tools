const fm = require('./filemanager.js');

const jsdom = require('jsdom');
const prettier = require('prettier')
const path = require('path');

const defaultPrettierOptions = {
    parser: 'html', 
    bracketSameLine: true, 
    bracketSpacing: false, 
    printWidth: 700, 
    useTabs: true
};

class TemplateBuilder {
    /**
     * @private
     * @param {fm.FileManager} fileManager 
     * @param {string} relativePath
     * @param {object} attributes
     * @param {Buffer} data 
     * @param {object} parameters
     * @returns {jsdom.JSDOM | undefined}
    */
    processDocument(fileManager, relativePath, attributes, data, parameters) {
        let dom = new jsdom.JSDOM(data);
        let document = dom.window.document;

        let skips = document.querySelectorAll('skip');

        if (!parameters.innerCall && skips.length > 0) {
            return undefined;
        }

        if (!parameters.innerCall && !parameters.keepContentTags) {
            let contentTags = document.querySelectorAll('content');
            contentTags.forEach(tag => tag.remove());
        }

        skips.forEach(skip => skip.remove());

        if (!attributes) attributes = {};

        this.applyRequirements(document, attributes);
        this.executeScripts(document, attributes);
        this.replaceAttributes(document, attributes);
        this.replaceInclusions(fileManager, relativePath, attributes, document);
        let parentDom = this.applyParenting(fileManager, relativePath, attributes, document);
        dom = parentDom ? parentDom : dom;
        document = dom.window.document;

        this.moveHeadData(document);

        return dom;
    }

    /**
     * @private
     * @param {fm.FileManager} fileManager
     * @param {string} relativePath
     * @param {object} attributes
     * @param {Document} document 
     */
    replaceInclusions(fileManager, relativePath, attributes, document) {
        let inclusions = document.querySelectorAll('include');

        for (let inclusion of inclusions) {
            let inclPath = inclusion.textContent;

            if (!inclPath || inclPath == "") continue;
            
            relativePath = path.join(relativePath, path.dirname(inclPath));
            let buffer = fileManager.readFile(path.join(relativePath, path.basename(inclPath)));

            attributes = Object.assign(attributes, this.convertAttributeMapToObject(inclusion.attributes));

            let inclDom = this.processDocument(fileManager, relativePath, attributes, buffer, { innerCall: true });
            let inclDocument = inclDom.window.document;

            let bodyChildren = inclDocument.body.childNodes;
            let headChildren = inclDocument.head.childNodes;
            let bodyFragment = document.createDocumentFragment();
            let headFragment = document.createDocumentFragment();

            for (let child of bodyChildren) {
                bodyFragment.append(child.cloneNode(true));
            }

            for (let child of headChildren) {
                headFragment.append(child.cloneNode(true));
            }

            inclusion.replaceWith(bodyFragment);
            document.head.append(headFragment);
        }
    }

    /**
     * @private
     * @param {fm.FileManager} fileManager
     * @param {string} relativePath
     * @param {object} attributes
     * @param {Document} document
     * @returns {jsdom.JSDOM | undefined}
     */
    applyParenting(fileManager, relativePath, attributes, document) {
        let parentTags = document.querySelectorAll('parent');
        parentTags.forEach(parent => parent.remove());
        
        if (parentTags.length > 0) {
            let parent = parentTags[0];

            let parentPath = parent.textContent;

            if (parentPath && parentPath != "") {
                relativePath = path.join(relativePath, path.dirname(parentPath));
                let buffer = fileManager.readFile(path.join(relativePath, path.basename(parentPath)));

                attributes = Object.assign(attributes, this.convertAttributeMapToObject(parent.attributes));

                let parentDom = this.processDocument(fileManager, relativePath, attributes, buffer, { innerCall: true, keepContentTags: true });

                let parentDocument = parentDom.window.document;
                let contentTag = parentDocument.querySelector('content');

                if (contentTag) {
                    let bodyChildren = document.body.childNodes;
                    let headChildren = document.head.childNodes;

                    let bodyFragment = parentDocument.createDocumentFragment();
                    let headFragment = parentDocument.createDocumentFragment();

                    for (let child of bodyChildren) {
                        bodyFragment.append(child.cloneNode(true));
                    }

                    for (let child of headChildren) {
                        headFragment.append(child.cloneNode(true));
                    }

                    contentTag.replaceWith(bodyFragment);
                    parentDocument.head.append(headFragment);
                    return parentDom;
                }
            }
        }

        return undefined;
    }

    /**
    * @param {Document} document
    * @param {object} attributes
    */ 
    replaceAttributes(document, attributes) {
        let attrTags = document.querySelectorAll('attr');

        for (let attrTag of attrTags) {
            let node = document.createTextNode('NULL');

            if (attrTag.textContent in attributes) {
                node.data = attributes[attrTag.textContent];
            }

            attrTag.replaceWith(node);
        }

        let inlineAttrs = document.querySelectorAll('[attr]');
        let regexp = /@@\w+/g;

        for (let inlineAttr of inlineAttrs) {
            let text = inlineAttr.textContent;
            let matches = text.matchAll(regexp);

            for (let match of matches) {
                let varName = match[0].replace('@@', '');
                text = text.replace(match[0], varName in attributes ? attributes[varName] : 'NULL');
            }

            inlineAttr.textContent = text;
            inlineAttr.attributes.removeNamedItem('attr');
        }
    }

    /**
     * @private
     * @param {Document} document 
     * @param {object} attributes
     */
    applyRequirements(document, attributes) {
        let requireTags = document.querySelectorAll('require');

        for (let tag of requireTags) {
            if (!tag.hasAttribute('name')) {
                tag.remove();
                continue;
            }

            let varName = tag.getAttribute('name');

            if (!(varName in attributes) || attributes[varName].toLowerCase() == '@discard') {
                tag.remove();
                continue;
            }  

            if ((tag.hasAttribute('value') && tag.getAttribute('value') == attributes[varName]) || (!tag.hasAttribute('value'))) {
                let children = tag.childNodes;
                let fragment = document.createDocumentFragment();

                for (let child of children) {
                    fragment.append(child.cloneNode(true));
                }

                tag.replaceWith(fragment);

                continue;
            } 

            tag.remove();
        }
    }

    /**
     * @private
     * @param {Document} document 
    */
    moveHeadData(document) {
        let headdataTags = document.querySelectorAll('hd');

        for (let tag of headdataTags) {
            let children = tag.childNodes;
            let fragment = document.createDocumentFragment();

            children.forEach(child => fragment.append(child.cloneNode(true)));

            document.head.append(fragment);
            tag.remove();
        }
    }

    /**
     * 
     * @param {Document} document 
     * @param {object} attributes
     */
    executeScripts(document, attributes) {
        let scripts = document.querySelectorAll('script[exec]');
        let context = {attrs: attributes};

        for (let script of scripts) {
            let returnValue = this.evalInContext.call(context, script.textContent);
            // let returnValue = eval(script.textContent);
            script.replaceWith(document.createTextNode(returnValue ?? ""));
        }
    }

    /**
     * @param {fm.FileManager} fileManager 
     * @param {Array<string>} paths
     * @param {prettier.Options} options
     * @returns {number}
     */
    processAndWriteDocuments(fileManager, paths, options) {
        let regexp = /\n$/gm;
        let filesWritten = 0;

        for (let entry of paths) {
            try {
                let dom = this.processDocument(fileManager, path.dirname(entry), null, fileManager.readFile(entry), {});

                if (dom) {
                    let resOptions = options ?? defaultPrettierOptions;
                    resOptions.parser = "html";
                    let res = prettier.format(dom.serialize(), resOptions);
                    fileManager.writeFile(entry, res.replace(regexp, ""));
                    
                    filesWritten++;
                    continue;
                }
            } catch (error) {
                throw `An error ocurred while processing file "${entry}" - ${error}`;
            }
        }

        return filesWritten;
    }

    /**
     * @private
     * @param {NamedNodeMap} map
     * @returns {object}
     */
    convertAttributeMapToObject(map) {
        let obj = {};

        for (let attribute of map) {
            obj[attribute.name] = attribute.value;
        }

        return obj;
    }

    /**
     * @private
     * @param {string} code
    */
    evalInContext(code) {
        return eval(code);
    }
}

module.exports = { TemplateBuilder, defaultPrettierOptions };