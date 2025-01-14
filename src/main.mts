import swaggerJSDoc from "swagger-jsdoc";
import { Spec } from "swagger-schema-official";
import extractJSDocContent from "./utils/extractJSDocContent.mjs";
import extractOfficalSwaggerContent from "./utils/extractOfficialSwaggerContent.mjs";
import getConfigFile from "./utils/getConfigFile.mjs";
import generateService from "./utils/generateService.mjs";

(async function main() {

  const config = await getConfigFile();

  if (!config) {
    console.log('读取配置文件失败');
    return;
  }

  const jsonContent = await config.loadJSON();
  if (!jsonContent) {
    console.log('load json 失败');
    return;
  }

  // json => paths、dataTypes
  const { dataTypes, paths } = (() => {
    if (jsonContent.openapi) {
      console.log('检测到为jsdoc-swagger结构');
      return extractJSDocContent(jsonContent as swaggerJSDoc.OAS3Definition)
    }
    if (jsonContent.swagger) {
      console.log('检测到为标准swagger结构');
      return extractOfficalSwaggerContent(jsonContent as unknown as Spec);
    }
    return { dataTypes: null, paths: null };
  })();

  if(!dataTypes || !paths) {
    console.log('未检测到swagger 数据');
    return;
  }

  // paths, dataTypes => files
  generateService(paths, dataTypes, config);

  console.log('done');

})()

