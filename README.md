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
1. 复制一份config.template.mjs 取名为config.xxx.mjs 进行修改
2. 执行node main.mjs 程序为自动寻找同级目录下格式为config.xxx.mjs的文件，并会在控制台列举供以选择，选择完成后会自动生成文件

## tips
* 对于低版本的node，如node16, @inquirer/prompts 包需要安装v3.x 的版本