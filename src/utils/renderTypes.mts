
import mapTypeToTSType from './mapTypeToTSType.mjs';
import indentHOF from './indent.mjs';


type FullUserConfig = UserConfig & {
  beforePathProcess: NonNullable<UserConfig['beforePathProcess']>;
  onPathIndexRender: NonNullable<UserConfig['onPathIndexRender']>;
  beforeRenderSchema: NonNullable<UserConfig['beforeRenderSchema']>;
}
let indent = (level: number) => '';
let userConfig = {} as FullUserConfig;

function fullfillUserConfig(config: UserConfig): FullUserConfig {
  if (!config.beforePathProcess) {
    config.beforePathProcess = (a) => a;
  }
  if (!config.onPathIndexRender) {
    config.onPathIndexRender = (a: string, b: string) => `${a} ${b}`;
  }
  if(!config.beforeRenderSchema) {
    config.beforeRenderSchema = () => {};
  }
  return config as FullUserConfig;
}

export default function renderTypes(paths: API.EndPoint[], dataTypes: Record<string, API.DataType | null>, config: UserConfig) {
  userConfig = fullfillUserConfig(config);
  indent = (level: number) => indentHOF(userConfig.indentSize, level);
  const outputPaths: string[] = [];
  const outputPathIOTypes: string[] = [];
  const mentionedSchema: Record<string, boolean> = {};
  // generate paths type
  paths.forEach(originPathCfg => {
    const pathConfig = userConfig.beforePathProcess(originPathCfg, dataTypes);
    if (!pathConfig) {
      // console.log(`${originPathCfg.url} ignored by user config`);
      return;
    }
    const { url, method, parameters, response } = pathConfig;

    const { divider, type: requestType } = generateParameterTsType(parameters, method, userConfig.typeNameSpace, mentionedSchema);

    const { type: responseType } = response ? generateParameterTsType([response as API.Parameter], method, userConfig.typeNameSpace, mentionedSchema) : { type: null };
    // if (response?.type === 'array') {
    //   console.log('array check:', responseType);
    // }
    const apiDefine = pathTypingRender(method, url, requestType, responseType, divider, pathConfig.description);


    outputPaths.push(`${indent(1)}/** ${pathConfig.description ?? ''} */\n${indent(1)}${apiDefine}`);
    outputPathIOTypes.push(`${indent(1)}"${method} ${url}": [${requestType}, ${responseType}]`);
  });



  // console.log('start generate types')
  const typesContentTemplate = renderSchemasFileContent(dataTypes, mentionedSchema);


  userConfig.onGenerateFiles(outputPaths, typesContentTemplate, renderPathToIOTypeMap(outputPathIOTypes));
}


function pathTypingRender(method: string, url: string, requestType: string | null, responseType: string | null, divider: Record<string, string[]>, description?: string) {
  const pathIndex = userConfig.onPathIndexRender(method, url);
  const apiDefine = `"${pathIndex}": defineAPI<${requestType}, ${responseType}>("${url}", "${method}"${Object.keys(divider).length ? `, {divider: ${JSON.stringify(divider)}}` : ''})`

  return apiDefine;
  // return `${space(2)}/** ${description} */\n${space(2)}${apiDefine}`
}

/** 参数位置分流器, 用于区分字段是在path、query、body等位置上 */
function appendDivider(ctx: Record<string, string[]>, position: string, keyName: string) {
  if (!ctx[position]) ctx[position] = [];
  ctx[position].push(keyName);
}

function generateParameterTsType(parameters: API.Parameter[], method: string, typeNameSpacePrefix: string, metionedTypeMap: Record<string, boolean>) {
  const divider: Record<string, string[]> = {};
  const inlineTypes: string[] = [];
  const refTypes: string[] = [];
  const formatType = (parameter: API.DataType) => {
    const type = mapTypeToTSType(parameter, typeNameSpacePrefix);
    if (type.indexOf(`${typeNameSpacePrefix}.`) === 0) {
      metionedTypeMap[type.slice(typeNameSpacePrefix.length + 1)] = true;
    }
    if (type.indexOf(`Array<${typeNameSpacePrefix}.`) === 0) {
      metionedTypeMap[type.slice(typeNameSpacePrefix.length + 1 + 6, -1)] = true;
    }
    return type;
  };
  parameters.forEach(parameter => {
    if (parameter.in === 'header') return;
    if (parameter.in === 'cookie') return;
    if (parameter.in === 'path') {
      appendDivider(divider, 'path', parameter.name!);
    }
    if (parameter.in === 'query') {
      if (method !== 'GET') appendDivider(divider, 'query', parameter.name!);
    }
    if (parameter.in === 'formData' || parameter.in === 'body') {
      if (method === 'GET' || parameter.in === 'formData') appendDivider(divider, parameter.in, parameter.name!);
    }
    if (!parameter.name) {
      refTypes.push(formatType(parameter));
      return;
    }
    inlineTypes.push(`${parameter.name}${!parameter.required ? '?' : ''}: ${formatType(parameter)}`);
  })
  if (inlineTypes.length) {
    refTypes.push(`{ ${inlineTypes.join(',')} }`)
  }

  return {
    type: refTypes.length ? refTypes.join(' & ') : null,
    divider,
  }
}


function appendDesc(dataType: API.DataType, indentLevel: number = 2) {
  const descs = [dataType.description, ...dataType.infos ?? []].filter(a => !!a);
  if (!descs.length) return '';
  if (descs.length === 1) return `${indent(indentLevel)}/** ${descs[0]!.replaceAll(/\r?\n/g, '\n' + indent(indentLevel + 1))} */\n`;
  return `${indent(indentLevel)}/** ${descs.map(str => str?.replaceAll(/\r?\n/g, '\n' + indent(indentLevel + 1))).join(' ')} */\n`;

}


function renderSchema(dataType: API.DataType | null, dataTypeRenderList: string[]) {
  if (!dataType) {
    return '';
  }
  userConfig.beforeRenderSchema(dataType);
  const formatType = (parameter: API.DataType) => {
    const tempNamePrefixTag = '#.#'
    const type = mapTypeToTSType(parameter, tempNamePrefixTag);
    if (type.indexOf(`${tempNamePrefixTag}.`) === 0) {
      dataTypeRenderList.push(type.slice(tempNamePrefixTag.length + 1));
    }
    if (type.indexOf(`Array<${tempNamePrefixTag}.`) === 0) {
      dataTypeRenderList.push(type.slice(tempNamePrefixTag.length + 1 + 6, -1));
    }
    return type.replace(`${tempNamePrefixTag}.`, '');;
  };


  if (dataType.type !== 'object') {
    const str = `${appendDesc(dataType, 1)}${indent(1)}type ${dataType.name} = ${formatType(dataType)};\n\n`;
    return str;
  }
  const propertyStr = dataType.properties?.map(property => {
    return `${appendDesc(property)}${indent(2)}${property.name}${!property.required ? '?' : ''}: ${formatType(property)};\n\n`
  }).join('');

  return `${indent(1)}interface ${dataType.name} {\n\n${propertyStr}${indent(1)}}\n\n\n`;

}


/**
 * 生成API namespace 类型定义库
 */
function renderSchemasFileContent(dataTypes: Record<string, API.DataType | null>, mentionedSchema: Record<string, boolean>) {
  let typesContent = '';
  const dataTypeNames = Object.keys(mentionedSchema);
  const renderedMap: Record<string, boolean> = {};
  for (const typeName of dataTypeNames) {
    if (renderedMap[typeName]) continue;
    if (!dataTypes[typeName]) {
      console.log('detect null dataType:', typeName);
    }
    typesContent += renderSchema(dataTypes[typeName], dataTypeNames);
    renderedMap[typeName] = true;
  }
  const typesContentTemplate = `/**
* ! 文件由脚本生成，不要直接修改
*/
/** */
declare namespace ${userConfig.typeNameSpace} {
${typesContent}
}`;
  return typesContentTemplate;
}

function renderPathToIOTypeMap(items: string[]) {

  const contentTemplate = `
type APITypeTuple = {
${items.join(',\n')}
}
`;
  return contentTemplate;
}
