import { Schema, Spec, Path, Reference, Parameter  } from "swagger-schema-official";
import lodash from 'lodash';


export default function extractOfficalSwaggerContent(content: Spec) {

  return {
    dataTypes: generateCommonSchemas(content.definitions),
    paths: scanPaths(content.paths),
  }
}


function generateCommonSchemas(schemas: { [definitionsName: string]: Schema } | undefined) {
  if (!schemas) return null;
  const obj: Record<string, API.DataType | null> = {};
  Object.entries(schemas)
    .forEach(([schemaName, schmeContent]) => {
      // console.log(`========== schema:${schemaName} start ==========`);
      // console.log(schemaName, schmeContent);
      if (schmeContent.$ref) {
        console.log('unknown schemaType:', schmeContent);
        return;
      }
      // console.log(' ===== origin data =====');
      // console.log(schmeContent);
      obj[schemaName] = schemaToDataType(schemaName, schmeContent);
      // console.log(' ===== restruct struct =====');
      // console.log(obj[schemaName]);
      // console.log(`========== schema:${schemaName} end ==========`);
    })

  return obj;
}

function schemaToDataType(typeName: string, schemaType: Schema | Parameter): API.DataType | null {
  if(!schemaType) return null;
  if (schemaType?.$ref) {
    return { name: typeName, type: schemaType.$ref.split('/').pop(), required: false };
  }
  const schema = schemaType;
  const { type, description, properties, required: requiredPropertyList, format, items, ...restProps } = schema;
  // console.log('===== origin data =====');
  // console.log(content);
  if(format?.indexOf('int') === -1) {
    restProps.format = format;
  }
  const obj: API.DataType = {
    name: typeName,
    type: schema.type,
    required: typeof requiredPropertyList === 'boolean' ? requiredPropertyList : false,
    infos: Object.keys(restProps).length ? [JSON.stringify(restProps)] : undefined,
    description,
  };
  if (type === 'array') {
    obj.arrayElementType = schemaToDataType('elementTypeName', items);
  }
  if (properties) {
    obj.properties = Object.entries(properties)
      .map(([propName, propContent]) => {
        const property = schemaToDataType(propName, propContent);
        if(property && Array.isArray(requiredPropertyList) && requiredPropertyList?.find(name => name === property.name)) {
          property.required = true;
        }
        return property;
      })
  }
  // console.log('===== restruct struct =====');
  // console.log(obj);
  return obj;
}

const httpMethods = ['get', 'put', 'post', 'delete'] as const;

function scanPaths(paths?: { [pathName: string]: Path }) {
  if (!paths) return [];
  const endpoints: API.EndPoint[] = [];
  Object.entries(paths)
    .forEach(([path, pathContent]) => {
      httpMethods.forEach((method) => {
        const config = pathContent[method];
        if (!config) return;
        // console.log(`========== ${method} ${path} start ==========`);
        // console.log(config);
        // config.description
        const endpoint: API.EndPoint = {
          url: path,
          method: method.toUpperCase() as API.EndPoint['method'],
          description: config.description || config.summary,
          parameters: [],
        }
        if (config.parameters) {
          config.parameters.forEach((param) => {
            if ((param as Reference).$ref) {
              console.log('unkown param type:', param);
              return;
            }
            const { name, schema, required, in: location } = param as Parameter;
            const dataType = schemaToDataType(name, schema || param) as API.Parameter;
            // if(location === 'query' && param?.$ref) {
            //   console.log('detect dirty query parameter:', param, dataType);
            //   // url上为引用类型的参数，实际情况 这个对象即整个query对象
            //   dataType.name = '';
            // }
            // todo 在body上为引用类型的参数，实际情况 这个对象即整个body对象
            if(location === 'body' && schema?.$ref) {
              // url上为引用类型的参数，实际情况 这个对象即整个query对象
              dataType.name = '';
            }
            dataType.in = location;
            dataType.required = required;
            endpoint.parameters.push(dataType)
          })
        }

        // config.requestBody
        // if (config.requestBody) {
        //   const schema = Object.values((config.requestBody as swaggerJSDoc.RequestBody).content)[0].schema;
        //   const parameter = schemaToDataType('', schema) as API.Parameter;
        //   parameter.in = 'body';
        //   endpoint.parameters.push(parameter);
        // }

        // config.responses
        if (config.responses) {
          const responseContent = (lodash.get(config, 'responses.200') ?? {});
          const schema = responseContent?.schema as Schema;
          endpoint.response = schemaToDataType('', schema);
        }
        // console.log('===== processed path =====');
        // console.log(endpoint);
        endpoints.push(endpoint);
        // console.log(`========== ${method} ${path} end ==========`);
      })

    })

  return endpoints;
}