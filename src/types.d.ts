
declare namespace API {
  type Parameter = DataType & {
    in: 'path' | 'query' | 'header' | 'body' | 'cookie' | 'formData'
    required?: boolean;
  }
  interface EndPoint {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    parameters: Parameter[];
    response?: DataType;
    description?: string;
  }
  interface DataType {
    name?: string;
    /** 包含$ref */
    type?: string; //  'object' | 'string' | 'number' | 'boolean' | 'array';
    // $ref?: string;
    properties?: Array<DataType>;
    description?: string;
    /** 记录一些被丢弃的字段信息 */
    infos?: Array<string>;
    /** 数组元素类型 */
    arrayElementType?: DataType | null;
    /** 是否必定存在或必填 true: 必填或存在 */
    required?: boolean,
  }
}

declare interface UserConfig {

  indentSize: number;

  typeNameSpace: string;
  
  loadJSON(): Promise<Record<string ,unknown>>;

  beforePathProcess?(path: API.EndPoint, dataTypes: Record<string, API.DataType | null>): API.EndPoint | null;

  onPathTypeRender?(method: string, url: string, requestType: string | null, responseType: string | null, divider: Record<string, string[]>): string;

  onGenerateFiles(pathDefineStrList: string[], schemasContent: string): void;
}