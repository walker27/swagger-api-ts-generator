import axios from "axios";
import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'
import fs from 'node:fs'
import getUtilsFileContent from "./utils/getUtilsFileContent.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url))


const config: UserConfig = {
  /** 缩进尺寸 */
  indentSize: 2,
  /** API 命名空间前缀，用于 declare namespace {typeNameSpace} {} */
  // todo
  typeNameSpace: '__',
  /** 加载swagger json */
  async loadJSON() {
    // todo
    const res = await axios.get('http://url', {});
    return res.data;
  },
  /** 用于过滤接口或者对接口的返回进行一定的修改 */
  beforePathProcess(path: API.EndPoint, schemas: Record<string, API.DataType>) {
    /** 过滤一些不需要的接口 */
    // if (path.url.indexOf('/xxx') === -1) return null;

    /** 移除多余的前缀 */
    // path.url = path.url.replace('/xxx', '');

    /** 跳过接口返回的通用返回结构取核心data */
    // const reponseType = path.response?.type;
    // if (reponseType && schemas[reponseType]) {
    //   const propertyData = schemas[reponseType]?.properties?.find(item => item.name === 'data');

    //   if (propertyData) {
    //     console.log(`replace response type ${reponseType} to ${propertyData.type}`);
    //     path.response = { ...propertyData, name: '' };
    //   }
    // }

    /** 对一些返回是文件内容的接口的返回做一些修正 */
    // if (!path.response && (path.url.indexOf('/export') !== -1)) {
    //   path.response = {
    //     type: 'file'
    //   };
    // }

    return path;
  },
  /** 自定义每个path的索引字符串 */
  // onPathIndexRender(method: string, url: string) {
  //   return `${method} ${url}`;
  // },
  /** 
   * 生成文件内容
   * 生成的文件目录示例:
   * output
   *  - service-name-a
   *  | - api.d.ts
   *  | - interceptors.ts
   *  | - path-types.d.ts
   *  | - index.ts
   *  - service-name-b
   *  | - api.d.ts
   *  | - interceptors.ts
   *  | - path-types.d.ts
   *  | - index.ts
   *  - index.ts
   *  - utils.ts
   */
  onGenerateFiles(pathDefineStrList: string[], schemasContent: string, pathDefineTuple: string) {
    // 填写__的内容
    // todo
    const apiRootFolderPath = path.resolve(__dirname, '..', '__')
    // todo 按照文件夹命名规则填写
    const serviceFolderName = '__'
    // todo 按照驼峰命名规则填写
    const serviceVarName = '__'

    const utilsFilePath = path.resolve(apiRootFolderPath, `utils.ts`)
    const serviceFolderPath = path.resolve(apiRootFolderPath, serviceFolderName)
    const typesFilePath = path.resolve(serviceFolderPath, `api.d.ts`)
    const apiIndexPath = path.resolve(serviceFolderPath, `index.ts`)
    const apiInterceptorPath = path.resolve(serviceFolderPath, `interceptors.ts`)
    const apiPathTypeTuple = path.resolve(serviceFolderPath, `path-types.d.ts`)
    const apiRootIndexPath = path.resolve(apiRootFolderPath, `index.ts`)

    // 生成服务文件夹
    if (!fs.existsSync(serviceFolderPath)) {
      fs.mkdirSync(serviceFolderPath, { recursive: true })
    }

    // 生成ts定义文件
    fs.writeFileSync(typesFilePath, schemasContent);

    // 生成API文件
    const apiFileContent = apiFileTemplate(pathDefineStrList)
    fs.writeFileSync(apiIndexPath, apiFileContent)

    // 生成path-types.d.ts文件
    fs.writeFileSync(apiPathTypeTuple, pathDefineTuple);

    // 生成interceptors.ts文件
    if (!fs.existsSync(apiInterceptorPath)) {
      fs.writeFileSync(apiInterceptorPath, apiInterceptorsFileTemplate());
    }

    // 生成utils文件
    if (!fs.existsSync(utilsFilePath)) {
      fs.writeFileSync(utilsFilePath, getUtilsFileContent());
    }

    // 生成或追加root/index.ts的引用
    if (!fs.existsSync(apiRootIndexPath)) {
      fs.writeFileSync(apiRootIndexPath, `\n\nconst server = {\n}\n\nexport default server;`);
    }
    const serverIndexContent = fs.readFileSync(apiRootIndexPath, 'utf-8');
    const serverIndexLines = serverIndexContent.split('\n');
    const importLine = `import ${serviceVarName} from './${serviceFolderName}'`;
    let needAddImport = true;
    const part = serverIndexLines.map((line) => {
      if (line === importLine) {
        needAddImport = false;
        return line;
      }
      if (line === 'const server = {') {
        return line + `\n  ${serviceVarName},`;
      }
      return line;
    }).join('\n');
    if (needAddImport) {
      const oContent = `${importLine}\n${part}`;
      fs.writeFileSync(apiRootIndexPath, oContent);
    }
  },

};


export default config;


function apiFileTemplate(paths: string[]) {

  return `/**
* ! 文件由脚本生成，不要直接修改
*/
import defineAPIHOC from "../utils";

const defineAPI = defineAPIHOC("");

const apiMap = {
${paths.join(',\n')}
}

type APIMap = typeof apiMap;
type APIPaths = keyof APIMap;

export default function callAPI<Path extends APIPaths>(path: Path, params?: Parameters<APIMap[Path]>[0], option?: Parameters<APIMap[Path]>[1]): ReturnType<APIMap[Path]> {
  // @ts-ignore
  return apiMap[path](params, option);
}
`;
}

function apiInterceptorsFileTemplate() {
  return `/**
* ! 文件由脚本生成，不要直接修改
*/
/// <reference types="./path-types" />
import { Interceptors } from "../utils";

const __ = undefined;
const interceptors = new Interceptors<APITypeTuple>();

export default interceptors;

// interceptors.add(path, __, __);

`;
}