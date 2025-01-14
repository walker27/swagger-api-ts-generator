import fs from 'node:fs'
import path from 'node:path'


/**
 * 生成 root/service/(interceptors.ts、path-types.ts)
 */
export default function generateServiceInterceptorFile(serviceFolderPath: string, pathIOTypes: string[]) {
  const interceptorFilePath = path.resolve(serviceFolderPath, `interceptors.ts`)
  const interceptorTypeFilePath = path.resolve(serviceFolderPath, `path-types.ts`)

  // 生成interceptors.d.ts文件
  fs.writeFileSync(interceptorTypeFilePath, contentTemplate(pathIOTypes.join(',\n')));

  // 生成interceptors.ts文件
  if (!fs.existsSync(interceptorFilePath)) {
    fs.writeFileSync(interceptorFilePath, INTERCEPTOR_FILE_TEMPLATE);
  }
}


const INTERCEPTOR_FILE_TEMPLATE = `/**
* 此文件可以按照工程情况调整，脚本只会在没有生成该文件的情况下生成
*/
import { Interceptors } from "../utils";
import { APITypeTuple } from "./path-types";

const __ = undefined;
const interceptors = new Interceptors<APITypeTuple>();

export default interceptors;

// interceptors.add(path, __, __);

`;

const contentTemplate = (content: string) => `/**
* ! 文件由脚本生成，不要直接修改
*/
/** */
export type APITypeTuple = {
${content}
}
`;