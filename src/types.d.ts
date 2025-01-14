
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
    /** 枚举值列表 */
    enums?: string[] | number[] | Array<EnumIns>,
  }
  interface EnumIns {
    value: string | number,
    description: string,
    name: string,
  }
}

declare interface UserConfig {
  /** 是否只生成定义文件，默认为false */
  typesOnly: boolean;
  /** 缩进尺寸 */
  indentSize: number;
  /** API 命名空间前缀，用于 declare namespace {typeNameSpace} {} */
  typeNameSpace: string;
  /** 所有服务所在的文件夹 */
  rootFolderPath: string;
  /** 服务文件夹名称 */
  serviceFolderName: string;
  /** 服务在代码中的变量名称 */
  serviceVariableName: string;
  
  loadJSON(): Promise<Record<string ,unknown>>;

  beforePathProcess?(path: API.EndPoint, dataTypes: Record<string, API.DataType | null>): API.EndPoint | null;

  // onPathTypeRender?(method: string, url: string, requestType: string | null, responseType: string | null, divider: Record<string, string[]>): string;

  onPathIndexRender?(method: string, url: string): string;

  beforeRenderSchema?(schema: API.DataType): void;

  // onGenerateFiles(pathDefineStrList: string[], schemasContent: string, pathDefineTuple: string): void;
}