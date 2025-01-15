import fs from 'node:fs'
import path from 'node:path'


/**
 * 生成 root/service/defineAPI.ts
 */
export default function generateServiceDefineAPIFile(serviceFolderPath: string) {
  const filePath = path.resolve(serviceFolderPath, `defineAPI.ts`);
  if(!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, FILE_TEMPLATE);
  }
}

const FILE_TEMPLATE = `/**
* 此文件可以按照工程情况调整，脚本只会在没有生成该文件的情况下生成
*/
import defineAPIHOC from "../utils";
import interceptors from "./interceptors";
// todo defineAPIHOC 第一个参数为请求方法的公共前缀
const defineAPI = defineAPIHOC("", interceptors);
export default defineAPI;
`