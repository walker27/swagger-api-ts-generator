import fs from 'node:fs'
import path from 'node:path';


/**
 * 生成 root/service/index.ts
 */
export default function generateServiceIndexFile(serviceFolderPath: string) {
  const filePath = path.resolve(serviceFolderPath, `index.ts`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, CONTENT_TEMPLATE);
  }
}


const CONTENT_TEMPLATE = `/**
* 此文件可以按照工程情况调整，脚本只会在没有生成该文件的情况下生成
*/
import apiMap, { APIPaths, APIMap } from './apiMap';
/** */
export default function callAPI<Path extends APIPaths>(path: Path, params?: Parameters<APIMap[Path]>[0], option?: Parameters<APIMap[Path]>[1]): ReturnType<APIMap[Path]> {
  // @ts-ignore
  return apiMap[path](params, option);
}`;