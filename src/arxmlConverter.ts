import { parseString } from 'xml2js';

export interface ArxmlConverterOptions {
    sort?: 'all' | 'none';
    except?: string[];
}

export class ArxmlConverter {
    private options: ArxmlConverterOptions;

    constructor(options: ArxmlConverterOptions = {}) {
        this.options = {
            sort: options.sort || 'none',
            except: options.except || []
        };
    }

    async convertToArtext(xmlContent: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Use faster parsing options for large files
            const parserOptions = {
                explicitArray: true,
                mergeAttrs: false,
                explicitRoot: true,
                async: true, // Enable async parsing
                normalizeTags: false,
                normalize: false,
                explicitCharkey: false,
                trim: true,
                ignoreAttrs: false
            };
            
            parseString(xmlContent, parserOptions, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    const artext = this.transformToArtext(result);
                    resolve(artext);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Quickly check if an ARXML file contains ECUC content without full conversion
     */
    async hasEcucContent(xmlContent: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const parserOptions = {
                explicitArray: true,
                mergeAttrs: false,
                explicitRoot: true,
                async: true,
                normalizeTags: false,
                normalize: false,
                explicitCharkey: false,
                trim: true,
                ignoreAttrs: false
            };
            
            parseString(xmlContent, parserOptions, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    const hasEcuc = this.checkForEcucContent(result);
                    resolve(hasEcuc);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    private transformToArtext(xmlObj: any): string {
        const output: string[] = [];
        let hasEcucContent = false;

        // Add safety check and debugging
        if (!xmlObj) {
            output.push('// Error: XML parsing result is null or undefined\n');
            return output.join('');
        }

        if (!xmlObj.AUTOSAR) {
            output.push('// Error: No AUTOSAR root element found in XML\n');
            output.push(`// Available root elements: ${Object.keys(xmlObj).join(', ')}\n`);
            return output.join('');
        }

        const autosar = xmlObj.AUTOSAR;
        
        // Extract schema information
        if (autosar.$?.['xsi:schemaLocation']) {
            const schemaLocation = autosar.$['xsi:schemaLocation'];
            const schemaVersion = this.extractSchemaVersion(schemaLocation);
            output.push(`schema ${schemaVersion}\n`);
        }

        // Process AR-PACKAGES
        if (autosar['AR-PACKAGES']) {
            const packages = this.ensureArray(autosar['AR-PACKAGES']);
            for (const packageGroup of packages) {
                if (packageGroup['AR-PACKAGE']) {
                    const arPackages = this.ensureArray(packageGroup['AR-PACKAGE']);
                    for (const arPackage of arPackages) {
                        const packageResult = this.processArPackage(arPackage, output, '');
                        if (packageResult.hasEcuc) {
                            hasEcucContent = true;
                        }
                    }
                }
            }
        }
        
        // If no ECUC content was found, show disclaimer
        if (!hasEcucContent) {
            output.length = 0; // Clear existing output
            output.push(`// ⚠️  ARXML Reader Disclaimer\n`);
            output.push(`// \n`);
            output.push(`// Despite the name "ARXML Reader", this extension currently supports\n`);
            output.push(`// only ECUC (ECU Configuration) values within ARXML files.\n`);
            output.push(`// \n`);
            output.push(`// This file does not contain supported ECUC elements:\n`);
            output.push(`//   ✓ ECUC-MODULE-CONFIGURATION-VALUES\n`);
            output.push(`//   ✓ ECUC-CONTAINER-VALUE\n`);
            output.push(`//   ✓ ECUC-NUMERICAL-PARAM-VALUE\n`);
            output.push(`//   ✓ ECUC-TEXTUAL-PARAM-VALUE\n`);
            output.push(`//   ✓ ECUC-REFERENCE-VALUE\n`);
            output.push(`// \n`);
            output.push(`// Other AUTOSAR elements (software components, interfaces, data types,\n`);
            output.push(`// system descriptions, etc.) will be supported in future versions.\n`);
            output.push(`// \n`);
            output.push(`// 👉 Use "Show Original XML" command to view the raw ARXML content.\n`);
            output.push(`// \n`);
            output.push(`// This file contains:\n`);
            this.analyzeUnsupportedContent(xmlObj, output);
        }

        return output.join('');
    }

    private checkForEcucContent(xmlObj: any): boolean {
        if (!xmlObj.AUTOSAR) {
            return false;
        }

        const autosar = xmlObj.AUTOSAR;
        
        // Process AR-PACKAGES
        if (autosar['AR-PACKAGES']) {
            const packages = this.ensureArray(autosar['AR-PACKAGES']);
            for (const packageGroup of packages) {
                if (packageGroup['AR-PACKAGE']) {
                    const arPackages = this.ensureArray(packageGroup['AR-PACKAGE']);
                    for (const arPackage of arPackages) {
                        if (this.packageHasEcucContent(arPackage)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    private packageHasEcucContent(arPackage: any): boolean {
        // Check ELEMENTS for ECUC content
        if (arPackage.ELEMENTS && arPackage.ELEMENTS[0]) {
            const elements = arPackage.ELEMENTS[0];
            
            // Check for ECUC-MODULE-CONFIGURATION-VALUES
            if (elements['ECUC-MODULE-CONFIGURATION-VALUES']) {
                return true;
            }
        }

        // Check sub-packages recursively
        if (arPackage['AR-PACKAGES']) {
            const subPackages = this.ensureArray(arPackage['AR-PACKAGES']);
            for (const subPackageGroup of subPackages) {
                if (subPackageGroup['AR-PACKAGE']) {
                    const subArPackages = this.ensureArray(subPackageGroup['AR-PACKAGE']);
                    for (const subArPackage of subArPackages) {
                        if (this.packageHasEcucContent(subArPackage)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    private processArPackage(arPackage: any, output: string[], packagePath: string): { hasEcuc: boolean } {
        const shortName = arPackage['SHORT-NAME']?.[0] || '';
        const currentPath = packagePath ? `${packagePath}.${shortName}` : shortName;
        let hasEcucContent = false;
        
        // Only output package line if this package contains ELEMENTS
        if (arPackage.ELEMENTS) {
            const elementResult = this.processElements(arPackage.ELEMENTS, output, 0);
            if (elementResult.hasEcuc) {
                hasEcucContent = true;
                output.push(`package ${currentPath}\n\n`);
                // Re-process elements to actually output content now that we know it has ECUC
                this.processElements(arPackage.ELEMENTS, output, 0);
            }
        }

        // Process nested AR-PACKAGEs
        if (arPackage['AR-PACKAGES']) {
            const nestedPackages = this.ensureArray(arPackage['AR-PACKAGES']);
            for (const packageGroup of nestedPackages) {
                if (packageGroup['AR-PACKAGE']) {
                    const nestedArPackages = this.ensureArray(packageGroup['AR-PACKAGE']);
                    for (const nestedPackage of nestedArPackages) {
                        const nestedResult = this.processArPackage(nestedPackage, output, currentPath);
                        if (nestedResult.hasEcuc) {
                            hasEcucContent = true;
                        }
                    }
                }
            }
        }
        
        return { hasEcuc: hasEcucContent };
    }

    private processElements(elements: any, output: string[], depth: number): { hasEcuc: boolean } {
        const elementsArray = this.ensureArray(elements);
        let hasEcucContent = false;
        
        for (const element of elementsArray) {
            if (element['ECUC-MODULE-CONFIGURATION-VALUES']) {
                hasEcucContent = true;
                let modules = this.ensureArray(element['ECUC-MODULE-CONFIGURATION-VALUES']);
                
                if (this.options.sort === 'all') {
                    modules = this.sortModules(modules);
                }

                for (const module of modules) {
                    this.processEcucModule(module, output, depth);
                }
            }
        }
        
        return { hasEcuc: hasEcucContent };
    }

    private processEcucModule(module: any, output: string[], depth: number): void {
        const indent = this.getIndent(depth);
        const shortName = module['SHORT-NAME']?.[0] || '';
        const definitionRef = module['DEFINITION-REF']?.[0];
        const refText = definitionRef?._ || definitionRef || '';
        const structifiedRef = this.structify(refText);
        
        output.push(`${indent}module ${structifiedRef} "${shortName}"`);

        // Add implementation config variant
        if (module['IMPLEMENTATION-CONFIG-VARIANT']) {
            const variant = module['IMPLEMENTATION-CONFIG-VARIANT'][0];
            const camelized = this.camelize(variant);
            output.push(` (${camelized})`);
        }

        // Add annotations, syscond, etc.
        const gstStuff = this.appendGstStuff(module);
        output.push(gstStuff);
        output.push(`\n${indent}{\n`);

        // Process containers
        if (module.CONTAINERS) {
            const containers = this.ensureArray(module.CONTAINERS);
            for (const containerGroup of containers) {
                if (containerGroup['ECUC-CONTAINER-VALUE']) {
                    let containerValues = this.ensureArray(containerGroup['ECUC-CONTAINER-VALUE']);
                    
                    if (this.options.sort === 'all') {
                        containerValues = this.sortContainers(containerValues);
                    }

                    for (const container of containerValues) {
                        this.processEcucContainer(container, output, depth + 1);
                    }
                }
            }
        }

        output.push(`${indent}}\n`);
    }

    private processEcucContainer(container: any, output: string[], depth: number): void {
        const indent = this.getIndent(depth);
        const shortName = container['SHORT-NAME']?.[0] || '';
        const definitionRef = container['DEFINITION-REF']?.[0];
        const refText = definitionRef?._ || definitionRef || '';
        const lastShortName = this.lastShortName(refText);

        output.push(`${indent}${lastShortName} "${shortName}"`);
        
        const gstStuff = this.appendGstStuff(container);
        output.push(gstStuff);
        output.push(`\n${indent}{\n`);

        // Process parameter values
        if (container['PARAMETER-VALUES']) {
            this.processParameterValues(container['PARAMETER-VALUES'], output, depth + 1);
        }

        // Process reference values
        if (container['REFERENCE-VALUES']) {
            this.processReferenceValues(container['REFERENCE-VALUES'], output, depth + 1);
        }

        // Process sub-containers
        if (container['SUB-CONTAINERS']) {
            const subContainers = this.ensureArray(container['SUB-CONTAINERS']);
            for (const subContainerGroup of subContainers) {
                if (subContainerGroup['ECUC-CONTAINER-VALUE']) {
                    let subContainerValues = this.ensureArray(subContainerGroup['ECUC-CONTAINER-VALUE']);
                    
                    if (this.options.sort === 'all') {
                        subContainerValues = this.sortContainers(subContainerValues);
                    }

                    for (const subContainer of subContainerValues) {
                        this.processEcucContainer(subContainer, output, depth + 1);
                    }
                }
            }
        }

        output.push(`${indent}}\n`);
    }

    private processParameterValues(parameterValues: any[], output: string[], depth: number): void {
        const indent = this.getIndent(depth);
        
        for (const paramGroup of parameterValues) {
            // Process numerical parameters
            if (paramGroup['ECUC-NUMERICAL-PARAM-VALUE']) {
                let numericalParams = this.ensureArray(paramGroup['ECUC-NUMERICAL-PARAM-VALUE']);
                
                if (this.options.sort === 'all') {
                    numericalParams = this.sortParameters(numericalParams);
                }

                for (const param of numericalParams) {
                    const definitionRef = param['DEFINITION-REF']?.[0];
                    const refText = definitionRef?._ || definitionRef || '';
                    const paramName = this.lastShortName(refText);
                    const value = param.VALUE?.[0] || '';
                    
                    output.push(`${indent}${paramName} = ${value}`);
                    
                    // Add hex value if not boolean
                    if (value !== 'true' && value !== 'false' && !isNaN(Number(value))) {
                        const hexValue = parseInt(value).toString(16).toUpperCase();
                        output.push(` (= 0x${hexValue})`);
                    }
                    
                    const gstStuff = this.appendGstStuff(param);
                    output.push(`${gstStuff}\n`);
                }
            }

            // Process textual parameters
            if (paramGroup['ECUC-TEXTUAL-PARAM-VALUE']) {
                let textualParams = this.ensureArray(paramGroup['ECUC-TEXTUAL-PARAM-VALUE']);
                
                if (this.options.sort === 'all') {
                    textualParams = this.sortParameters(textualParams);
                }

                for (const param of textualParams) {
                    const definitionRef = param['DEFINITION-REF']?.[0];
                    const refText = definitionRef?._ || definitionRef || '';
                    const paramName = this.lastShortName(refText);
                    const value = param.VALUE?.[0] || '';
                    
                    output.push(`${indent}${paramName} = "${value}"`);
                    
                    const gstStuff = this.appendGstStuff(param);
                    output.push(`${gstStuff}\n`);
                }
            }
        }
    }

    private processReferenceValues(referenceValues: any[], output: string[], depth: number): void {
        const indent = this.getIndent(depth);
        
        for (const refGroup of referenceValues) {
            // Process reference values
            if (refGroup['ECUC-REFERENCE-VALUE']) {
                let refValues = this.ensureArray(refGroup['ECUC-REFERENCE-VALUE']);
                
                if (this.options.sort === 'all') {
                    refValues = this.sortReferences(refValues);
                }

                for (const ref of refValues) {
                    const definitionRef = ref['DEFINITION-REF']?.[0];
                    const refDefText = definitionRef?._ || definitionRef || '';
                    const refName = this.lastShortName(refDefText);
                    const valueRef = ref['VALUE-REF']?.[0];
                    const valueRefText = valueRef?._ || valueRef || '';
                    const structifiedRef = this.structify(valueRefText);
                    
                    output.push(`${indent}${refName} = ${structifiedRef}`);
                    
                    const gstStuff = this.appendGstStuff(ref);
                    output.push(`${gstStuff}\n`);
                }
            }

            // Process instance reference values
            if (refGroup['ECUC-INSTANCE-REFERENCE-VALUE']) {
                let instanceRefs = this.ensureArray(refGroup['ECUC-INSTANCE-REFERENCE-VALUE']);
                
                if (this.options.sort === 'all') {
                    instanceRefs = this.sortReferences(instanceRefs);
                }

                for (const instanceRef of instanceRefs) {
                    const definitionRef = instanceRef['DEFINITION-REF']?.[0];
                    const refDefText = definitionRef?._ || definitionRef || '';
                    const refName = this.lastShortName(refDefText);
                    
                    output.push(`${indent}${refName} = `);
                    
                    if (instanceRef['VALUE-IREF']) {
                        const valueIref = this.ensureArray(instanceRef['VALUE-IREF'])[0];
                        if (valueIref && valueIref['TARGET-REF']) {
                            const targetRef = valueIref['TARGET-REF'][0];
                            const targetRefText = targetRef?._ || targetRef || '';
                            const structifiedTarget = this.structify(targetRefText);
                            output.push(structifiedTarget);
                        }
                        
                        if (valueIref && valueIref['CONTEXT-ELEMENT-REF']) {
                            const contextRefs = this.ensureArray(valueIref['CONTEXT-ELEMENT-REF']);
                            const contexts = contextRefs.map(ref => {
                                const contextRefText = ref?._ || ref || '';
                                return this.structify(contextRefText);
                            });
                            output.push(` context ${contexts.join(', ')}`);
                        }
                    }
                    
                    const gstStuff = this.appendGstStuff(instanceRef);
                    output.push(`${gstStuff}\n`);
                }
            }
        }
    }

    // Utility methods
    private ensureArray(item: any): any[] {
        return Array.isArray(item) ? item : [item];
    }

    private getIndent(depth: number): string {
        return '    '.repeat(depth);
    }

    private structify(path: string): string {
        if (!path || typeof path !== 'string') {
            return '';
        }
        const parts = path.split('/');
        // Skip the first empty part from leading '/', include everything else
        return parts.slice(1).join('.');
    }

    private lastShortName(path: string): string {
        if (!path || typeof path !== 'string') {
            return '';
        }
        const parts = path.split('/');
        return parts[parts.length - 1];
    }

    private camelize(text: string): string {
        const words = text.split('-');
        return words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    }

    private appendGstStuff(element: any): string {
        let result = '';
        
        // System conditions - check both direct and variation point nested
        if (element['SW-SYSCOND']) {
            const syscond = element['SW-SYSCOND'][0];
            const syscondText = typeof syscond === 'string' ? syscond : (syscond?._ || syscond || '');
            if (syscondText && typeof syscondText === 'string') {
                result += ` [${syscondText.trim()}]`;
            }
        } else if (element['VARIATION-POINT']) {
            // Handle variation points with nested conditions
            const variationPoints = this.ensureArray(element['VARIATION-POINT']);
            for (const vp of variationPoints) {
                if (vp['SW-SYSCOND']) {
                    const syscond = vp['SW-SYSCOND'][0];
                    const syscondText = typeof syscond === 'string' ? syscond : (syscond?._ || syscond || '');
                    if (syscondText && typeof syscondText === 'string') {
                        result += ` [${syscondText.trim()}]`;
                    }
                }
                // Also check for post-build variant conditions in variation points
                if (vp['POST-BUILD-VARIANT-CONDITION']) {
                    const conditions = this.ensureArray(vp['POST-BUILD-VARIANT-CONDITION']);
                    const conditionStrings = conditions.map(cond => {
                        const criterionRef = cond['MATCHING-CRITERION-REF']?.[0] || '';
                        const value = cond.VALUE?.[0] || '';
                        const criterionName = this.lastShortName(criterionRef);
                        const valueText = typeof value === 'string' ? value : (value?._ || value || '');
                        return `${criterionName} == ${valueText}`;
                    });
                    result += ` <${conditionStrings.join(' && ')}>`;
                }
            }
        }

        // Post-build variant conditions (direct)
        if (element['POST-BUILD-VARIANT-CONDITION']) {
            const conditions = this.ensureArray(element['POST-BUILD-VARIANT-CONDITION']);
            const conditionStrings = conditions.map(cond => {
                const criterionRef = cond['MATCHING-CRITERION-REF']?.[0] || '';
                const value = cond.VALUE?.[0] || '';
                const criterionName = this.lastShortName(criterionRef);
                const valueText = typeof value === 'string' ? value : (value?._ || value || '');
                return `${criterionName} == ${valueText}`;
            });
            result += ` <${conditionStrings.join(' && ')}>`;
        }

        // Annotations
        if (element.ANNOTATIONS) {
            const annotations = this.ensureArray(element.ANNOTATIONS);
            const annotationTexts = [];
            
            for (const annotation of annotations) {
                if (annotation.ANNOTATION) {
                    const annotationItems = this.ensureArray(annotation.ANNOTATION);
                    for (const item of annotationItems) {
                        let annotationText = '';
                        
                        if (item.LABEL && item.LABEL[0] && item.LABEL[0]['L-4']) {
                            const labelValue = item.LABEL[0]['L-4'];
                            const labelText = Array.isArray(labelValue) ? labelValue[0] : labelValue;
                            if (typeof labelText === 'string') {
                                annotationText += `[${labelText.trim()}] `;
                            }
                        }
                        
                        if (item['ANNOTATION-TEXT'] && item['ANNOTATION-TEXT'][0] && item['ANNOTATION-TEXT'][0].VERBATIM && item['ANNOTATION-TEXT'][0].VERBATIM[0] && item['ANNOTATION-TEXT'][0].VERBATIM[0]['L-5']) {
                            const verbatimValue = item['ANNOTATION-TEXT'][0].VERBATIM[0]['L-5'];
                            const verbatimText = Array.isArray(verbatimValue) ? verbatimValue[0] : verbatimValue;
                            if (typeof verbatimText === 'string') {
                                annotationText += verbatimText.trim();
                            }
                        }
                        
                        if (annotationText) {
                            annotationTexts.push(annotationText);
                        }
                    }
                }
            }
            
            if (annotationTexts.length > 0) {
                result += ` /* ${annotationTexts.join(' ')} */`;
            }
        }

        return result;
    }

    private extractSchemaVersion(schemaLocation: string): string {
        // E.g.: "http://autosar.org/schema/r4.0 autosar_00048.xsd" -> "00048"
        const parts = schemaLocation.split(' ');
        if (parts.length > 1) {
            const xsdFile = parts[parts.length - 1];
            
            // Match patterns like "autosar_00048.xsd" or "AUTOSAR_4-0-2.xsd"
            let versionMatch = xsdFile.match(/autosar_(\d+)\.xsd/i);
            if (versionMatch) {
                return versionMatch[1];
            }
            
            versionMatch = xsdFile.match(/AUTOSAR_(\d+-\d+-\d+)\.xsd/);
            if (versionMatch) {
                return versionMatch[1].replace(/-/g, '.');
            }
        }
        return 'unknown';
    }

    private sortModules(modules: any[]): any[] {
        return modules.sort((a, b) => {
            const aKey = this.getSortKey(a);
            const bKey = this.getSortKey(b);
            return aKey.localeCompare(bKey);
        });
    }

    private sortContainers(containers: any[]): any[] {
        return containers.sort((a, b) => {
            const aKey = this.getSortKey(a);
            const bKey = this.getSortKey(b);
            return aKey.localeCompare(bKey);
        });
    }

    private sortParameters(parameters: any[]): any[] {
        return parameters.sort((a, b) => {
            const aKey = this.getSortKey(a);
            const bKey = this.getSortKey(b);
            return aKey.localeCompare(bKey);
        });
    }

    private sortReferences(references: any[]): any[] {
        return references.sort((a, b) => {
            const aKey = this.getSortKey(a);
            const bKey = this.getSortKey(b);
            return aKey.localeCompare(bKey);
        });
    }

    private getSortKey(element: any): string {
        const definitionRef = element['DEFINITION-REF']?.[0] || '';
        const paramName = this.lastShortName(definitionRef);
        
        // Check if this parameter should be excluded from sorting
        if (this.options.except?.includes(paramName)) {
            return definitionRef;
        }

        // Include short name or value in sort key
        const shortName = element['SHORT-NAME']?.[0] || '';
        const value = element.VALUE?.[0] || '';
        const valueRef = element['VALUE-REF']?.[0] || '';
        const valueIref = element['VALUE-IREF']?.[0] || '';
        
        const contentKey = shortName || value || valueRef || valueIref || '';
        return `${definitionRef}"${contentKey}"`;
    }

    private analyzeUnsupportedContent(xmlObj: any, output: string[]): void {
        if (xmlObj.AUTOSAR && xmlObj.AUTOSAR['AR-PACKAGES']) {
            const packages = this.ensureArray(xmlObj.AUTOSAR['AR-PACKAGES']);
            const elementTypes = new Set<string>();
            
            this.collectElementTypes(packages, elementTypes);
            
            if (elementTypes.size > 0) {
                output.push(`// Found elements: ${Array.from(elementTypes).join(', ')}\n`);
            } else {
                output.push(`// No recognizable AUTOSAR elements found in this file.\n`);
            }
        }
    }
    
    private collectElementTypes(packages: any[], elementTypes: Set<string>): void {
        for (const packageGroup of packages) {
            if (packageGroup['AR-PACKAGE']) {
                const arPackages = this.ensureArray(packageGroup['AR-PACKAGE']);
                for (const arPackage of arPackages) {
                    // Check for ELEMENTS
                    if (arPackage.ELEMENTS) {
                        const elementsArray = this.ensureArray(arPackage.ELEMENTS);
                        for (const element of elementsArray) {
                            // Add all element type names to the set
                            Object.keys(element).forEach(key => {
                                if (key !== '$' && key !== '_') {
                                    elementTypes.add(key);
                                }
                            });
                        }
                    }
                    
                    // Recursively check nested packages
                    if (arPackage['AR-PACKAGES']) {
                        this.collectElementTypes(this.ensureArray(arPackage['AR-PACKAGES']), elementTypes);
                    }
                }
            }
        }
    }
}
