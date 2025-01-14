import fs from 'node:fs'
import path from 'node:path'



export default function generateServiceAPIMapFile(serviceFolderPath: string, pathDefines: string[]) {
  const filePath = path.resolve(serviceFolderPath, `apiMap.ts`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fileTemplate(pathDefines.join(',\n')));
  }
}

const fileTemplate = (content: string) => `/**
* 此文件可以按照工程情况调整，脚本只会在没有生成该文件的情况下生成
*/
import defineAPI from "./defineAPI";

const apiMap = {
${content}
}
export default apiMap;
export type APIMap = typeof apiMap;
export type APIPaths = keyof APIMap;
`