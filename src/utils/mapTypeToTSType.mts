/** 将一些常态后端类型转换为ts中的类型 */
export default function mapTypeToTSType(dataType: Pick<API.DataType, 'type' | 'arrayElementType' | 'enums'>, namespacePrefix?: string): string {
  if(dataType.enums) {
    return dataType.enums.map(val => JSON.stringify(typeof val === 'object' ? val.value : val)).join(' | ');
  }
  switch (dataType.type) {
    case undefined:
    case null:
    case 'void':
      return 'void';
    case 'string':
      return 'string';
    case 'object':
      return '{}';
    // case 'string[]':
    //   return 'string[]';
    case 'file':
      return 'Blob';
    case 'number':
    case 'integer':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      return `Array<${mapTypeToTSType(dataType.arrayElementType!, namespacePrefix)}>`;
    default:
      return namespacePrefix ? `${namespacePrefix}.${dataType.type}` : dataType.type;
  }
}