import { apply, Rule, SchematicContext, strings, template, Tree, url, mergeWith } from "@angular-devkit/schematics";
import { Schema } from "./schema";

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
// export function hello(_options: any): Rule {
export function hello(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    //   console.log('Hello world');
    //   tree.create('hello.js', `console.log('Hello World');`);
    //   return tree;
    // };
    // }
    //     const { name } = _options; // 從 _options 讀取 name
    //     console.log(name)
    //     tree.create("hello.js", `console.log('Hello ${name}');`);
    //     return tree;
    //   };
    // }
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
