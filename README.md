# Angular-schematics-example
Use Angular-schematics to  auto create simple ts code

# Angular Schematics 101

* 參考資料來源 [如何使用 Angular Schematics 自動產生程式碼](https://jimmylin212.github.io/post/0015_angular_schematics_intro/)

## 初始化
1. 先安裝 @angular-devkit/schematics-cli 才可以使用 schematics 指令，建議用 global 安裝，因為這個程式和 Angular 獨立的，我們可以使用 schematics 來產生各種樣板程式碼，減少時間。
```
npm install -g @angular-devkit/schematics-cli
```
2. 先新增一個空白的 schematic 吧。
```
schematics blank hello
```
![](https://i.imgur.com/usL6tBt.png)
3. collection.json，這個檔案主要的 definition 檔，裡面包含了所有定義的 schematics。
![](https://i.imgur.com/rnot7Ak.png)
4. 看一下 ./hello/index.ts 的內容
![](https://i.imgur.com/MviGkc3.png)

## schematics 概念簡介
* Schematic Factory
    首先，hello 這個 function 就是一個 factory，這個 factory 回傳一個 Rule。
* Rule
    另外一個重要的部分就是 Rule，Rule 被呼叫時需要 tree 以及 SchematicContext。當被呼叫時，Rule 會做 tree 做調整，並且回傳調整後的 tree，以便後續使用。
* Tree
Tree 是一個虛擬的資料夾結構，使用虛擬的資料夾結構有幾個優點
    1. 只會在 schematic 成功結束後才真的做出改變
    2. 可以使用 --dry-run 來預先看一下產出，而不用真的新增/修改檔案
    3. 提供更好的效能，因為並不是在流程中對檔案作操作

## 建置 schematics

* 我們的 schematics 用 typescript 撰寫，不過我們是跑在 node 環境下，所以在執行之前要記得編譯所有的 .ts 檔，不然執行是會失敗的。
```
npm run build
```
![](https://i.imgur.com/BamWmON.png)
* 因為需要編譯，如果在開發的過程當中每一個小修改都要編譯一次有點麻煩，也可以新增一個新的 command 到 package.json 內，就可以支援 hot-loading 了。
```
{
  "scripts": {
    "build-watch": "tsc -p tsconfig.json --watch"
  }
}
```

## 執行 schematics
* 可以直接使用 schematics cli 來執行特定的 schematic，指令格式為 schematics 'package-name':'schematic-name' [...options]。Package name 可以是類似 @schematics/angular，而 schematic name 可以為 component。schematic cli 預設會去 node_modules 裡面找到對應的 package 以及 schematic 執行。不過因為我們的 hello 還不是一個 package，這種情況下我們可以用以下指令執行
```
schematics .:hello 
```
![](https://i.imgur.com/CDSFSWf.png)

## 實作簡單的 schematics
1. 終於到重頭戲了，要開始實作第一個 schematic 了。來小小修改一下 hello schematic，當執行 hello schematic 的時候產生一個 hello.js 的檔案，內容為 console.log('Hello World');，要做到這件事情，可以用 .create()，程式碼如下：
```
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function hello(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    tree.create('hello.js', `console.log('Hello World');`);  // 新增這行
    return tree;
  };
}
```
![](https://i.imgur.com/QppGe6f.png)

2. 然後有修改都要重新run一次
```
npm run build
```
![](https://i.imgur.com/YZwrtkN.png)

3. 詭異的事情發生了，明明就寫了 CREATE 不過為什麼在資料夾內沒有新增檔案呢？因為當我們使用相對路徑 . 的時候，schematics 會用 debug mode 執行。debug mode 執行的結果和使用 --dry-run 一樣，並不會真的有檔案的 IO，可以使用 --debug=false 或是 --dry-run=false 來關閉，再執行一次就可以看到真的有個 hello.js 被新增出來了，執行結果也如預期印出了 Hello World。
![](https://i.imgur.com/uRqha0M.png)

## 讓 schematics 使用參數
* 不過這樣還不算是個有用的 schematic，現在我們加點東西，讓 schematic 讀參數。schematic 的 _options 包含了一起傳進來的 flags，假設我們的指令會是 schematics .:hello --name=Jimmy --debug=false，修改一下 schematic 的程式碼：
```
export function hello(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    //   console.log('Hello world');
    //   tree.create('hello.js', `console.log('Hello World');`);
    //   return tree;
    // };

    const { name } = _options; // 從 _options 讀取 name

    tree.create("hello.js", `console.log('Hello ${name}');`);
    return tree;
  };
}

```
![](https://i.imgur.com/0hZne4q.png)
* 上面的做法沒有問題，不過這會把所有的 flags 都傳進來，有些參數可能不是我們需要的，或是格式錯誤，這種情況可以新增 Schema 來描述參數的格式以及做驗證。在 ./src/hello 資料夾新增檔案 schema.json，內容如下：
```
{
  "$schema": "http://json-schema.org/schema",
  "id": "HelloSchematics",
  "title": "Hello Option Schema",
  "type": "object",
  "description": "Say hello to someone",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the person",
      "$default": {
        "$source": "argv",
        "index": 0
      }
    }
  },
  "required": [
    "name"
  ]
}
```
* 檔案中 properties 就是要傳進來的參數，type 可以接受不同種類比方 string、boolean 或是 enum，另外這邊使用了 positional option 的方式，因此不一定要寫 --name，只要是第一個參數，就會被 assign 到 name 上。接下來要讓 collection.json 知道要去哪邊找這個 schema.json，修改 collection.json 內容如下：
```
{
  "$schema": "../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "hello": {
      "description": "A blank schematic.",
      "factory": "./hello/index#hello",
      "schema": "./hello/schema.json"
    }
  }
}
```
* 甚至新增 prompt 增加 UX，再次修改 schema.json，增加 x-prompt 於 name 下，x-prompt就會將你輸入的變數作為name使用
```
{
    "$schema": "http://json-schema.org/schema",
    "id": "HelloSchematics",
    "title": "Hello Option Schema",
    "type": "object",
    "description": "Say hello to someone",
    "properties": {
        "name": {
            "type": "string",
            "description": "The name of the person",
            "$default": {
                "$source": "argv",
                "index": 0
            },
            "x-prompt": "Who do you want to greet?"
        }
    },
    "required": ["name"]
}
```
* <font color="red">在schema.json裡面的id要改成$id，從angular版本12以上就要改成這樣</font>
    [參考資料](https://github.com/angular/angular-cli/issues/22637)
```
{
    "$schema": "http://json-schema.org/schema",
    "$id": "HelloSchematics",
    "title": "Hello Option Schema",
    "type": "object",
    "description": "Say hello to someone",
    "properties": {
        "name": {
            "type": "string",
            "description": "The name of the person",
            "$default": {
                "$source": "argv",
                "index": 0
            },
            "x-prompt": "Who do you want to greet?"
        }
    },
    "required": ["name"]
}
```
* 最後再執行一次schematics .:hello --debug=false
```
schematics .:hello --debug=false
```
![](https://i.imgur.com/9ERoHW3.png)
![](https://i.imgur.com/KLQKc28.png)

## 在 schematics 使用 template
* 到目前為止都是很基本的使用方法，在真實使用情境下，我們不可能在 schematic 的 function 寫所有的 code，這時候 Angular 提供的 template 就派上用場了。要使用 template，可以新增一個 ./files/ 資料夾，當然也可以取名其他的，不過可以看一下 tsconfig.ts，可以發現 src/*/files/**/* 已經被 exclude 掉了，所以編譯的時候不會編譯到這些檔案。
![](https://i.imgur.com/ElJmC5K.png)

* 首先先增加一個資料夾叫做 hello-底線底線name@dasherize底線底線，乍看之下是個奇怪的名稱，不過其來有自。
    其中 __ 是特定的 delimiter 可以分開 name 變數和其他的部分。           dasherizer 是一個 helper function，會收到 name 的值，做特定的轉換。
    @ 是特殊字元讓 name 使用 dasherizer helper function。
    這整段的意思是說，假設我們的名稱是 AwesomeWrap 會自動幫我轉換成 hello-awesome-wrap。接下來在這個資料夾中再新增一個類似的文件取名叫 hello-__name@dasherize__.ts，內容如下：
![](https://i.imgur.com/lyLMnsg.png)

```
console.log('Hello <%= dasherize(name) %>');

// or

console.log('Hello <%= classify(name) %>');
```
* 接下來要讓 schematic 的 fuction 和 template 串聯在一起。修改 ./hello/index.js 內容如下：
```
import { Rule, SchematicContext, Tree, url, apply, template, mergeWith } from '@angular-devkit/schematics';
import { Schema } from './schema';

import { strings } from '@angular-devkit/core';

export function hello(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const sourceTemplate = url('./files'); // 取得 template 檔案
    const sourceParameterizedTemplates = apply(sourceTemplate, [
      template({
        ..._options,
        ...strings,
      })
    ]);

    return mergeWith(sourceParameterizedTemplates); // merge the template into tree
  };
}
```
* <font color="red">上面這邊因為沒有引用到tree，導致沒有辦法npm run build</font>
![](https://i.imgur.com/XtjVL5f.png)
    所以改成以下，把tree隨便拿來用一下，待優化
```
import { apply, Rule, SchematicContext, strings, template, Tree, url, mergeWith } from "@angular-devkit/schematics";
import { Schema } from "./schema";

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
// export function hello(_options: any): Rule {
export function hello(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const sourceTemplate = url("./files"); // 取得 template 檔案
    const sourceParameterizedTemplates = apply(sourceTemplate, [
      template({
        ..._options,
        ...strings,
      }),
    ]);
    tree;
    return mergeWith(sourceParameterizedTemplates); // merge the template into tree
  };
}
```
* 接下來在執行一次指令 
```
npm run build
schematics .:hello 'jimmy lin' --debug=false
```
![](https://i.imgur.com/ee3Io9M.png)
