


const utilsTsTemplate = `/**
 * 此文件可以按照工程情况调整，脚本只会在没有生成该文件的情况下生成
 */
type APIHelper = {
  divider?: { path?: string[], query?: string[], body?: string[], formData?: string[] }
}

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

function parameterDividerHOC(url: string, httpMethod: HTTPMethod, divider: APIHelper['divider']) {
  const sorterMap = Object.entries(divider || {}).reduce((acc, [key, value]) => {
    value.forEach((v) => {
      acc[v] = key;
    });
    return acc;
  }, {} as Record<string, string>);

  const defaultParameterStoreKey = httpMethod === 'GET' ? 'query' : 'body';

  return function divider(parameters?: Record<string, any> | Array<any>) {
    if (!parameters) {
      return { url };
    }
    if (Array.isArray(parameters)) {
      return { url, opt: { data: parameters } };
    }
    let queryUrl = url;
    const sortedStore: Record<string, any> = {};
    for (const key in parameters) {
      if (parameters[key] === undefined || parameters[key] === null) {
        continue;
      }
      const storeKey = sorterMap[key] ?? defaultParameterStoreKey;
      const value = parameters[key];

      if (storeKey === 'path') {
        queryUrl = queryUrl.replace(\`{\${key}}\`, value as string);
        continue;
      }
      if (!sortedStore[storeKey]) {
        sortedStore[storeKey] = storeKey === 'formData' ? new FormData() : {};
      }
      if (storeKey === 'formData') {
        (sortedStore[storeKey] as FormData).append(key, value as string | Blob);
      } else {
        sortedStore[storeKey][key] = value;
      }
    }
    const output: Record<string, any> = {};
    if (sortedStore.query) {
      output.params = sortedStore.query;
    }
    if (sortedStore.body) {
      output.data = sortedStore.body;
    }
    if (sortedStore.formData) {
      output.data = sortedStore.formData;
    }
    if (!sortedStore.body && !sortedStore.formData && httpMethod !== 'GET') {
      output.data = {};
    }
    return { url: queryUrl, opt: output };
  }

}

export default function defineAPIHOC(urlPrefix: string) {

  return function defineAPI<Params, Response>(url: string, method: HTTPMethod, helper?: APIHelper) {
    const divider = parameterDividerHOC(url, method, helper?.divider);
    // the return type is a trick, this can make callAPI get a correct type
    return (params: Params, options?: Parameters<typeof request>[1]) => {
      const { url: queryUrl, opt: dataPartOptions } = divider(params);
      return request(\`\${urlPrefix}\${queryUrl}\`, {
        method,
        ...dataPartOptions,
        ...options
      }) as Response
    }
  }
}

`

export default function getUtilsFileContent () {
  return utilsTsTemplate;
}