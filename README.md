# ts api 接口生成器
将swagger上的接口生成ts定义和代码


目前接触到的项目的swagger分为两种
1. [@types/swagger-jsdoc](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/swagger-jsdoc/package.json), json中的特征应该为根目录有个openapi字段
2. [@types/swagger-schema-official](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/swagger-schema-official/index.d.ts)


## 脚本设计

1. json = await fetch(url)
2. { paths, schemas } = parse(json)
3. filter(paths, schemas)
4. generate files

# 使用方法
1. 执行`node main.mjs new service-name`生成配置文件
2. 填写配置文件中缺失的字段
3. 执行`node main.mjs` 在工程中生成文件

## tips
* for low version node(e.g. node16), use `@inquirer/prompts@3.x`

## Generated Files Structure
```
root
 - service-name-a
 | - api.d.ts
 | - path-types.ts
 | - apiMap.ts
 | - interceptors.ts
 | - index.ts
 | - enums.ts
 | - defineAPI.ts
 - service-name-xxx
 | ...
 ...
 - index.ts
 - utils.ts
```