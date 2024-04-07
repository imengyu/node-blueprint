import type { INodeDefine } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodePackage } from "@/node-blueprint/Base/Flow/Registry/NodePackage";

import NodeIconBranch from '../NodeIcon/branch.svg';
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";
import { NodeParamTypeRegistry } from "@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry";

export default { 
  register,
  packageName: 'Preprocessor',
  version: 1,
} as NodePackage;

function register() {

  const nodePreSwitch : INodeDefine = {
    guid: 'CEBBA737-3027-A825-0DF3-C4546D24928B',
    name: '平台预处理条件',
    description: '预处理条件，依据当前编译的平台做出分支',
    author: 'imengyu',
    version: 1,
    category: '预处理',
    preprocessor: true,
    ports: [
      {
        name: "",
        description: '',
        direction: 'input',
        guid: 'IN',
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
    ],
    events: {
      onCreate(node) {
        const type = NodeParamTypeRegistry.getInstance().getTypeByString('BasePlatformType');
        for (const iterator of (type?.define?.options || []) as string[]) {
          node.addPort({
            name: iterator,
            description: `当当前编译的平台为 ${iterator} 时编译`,
            direction: 'output',
            guid: iterator,
            paramType: NodeParamType.Execute,
            style: { 
              forceNoDelete: true,
            },
          }, true);
        }
      },
    },
    style: {
      logo: NodeIconBranch,
      inputPortMinWidth: 0,
    },
  };

  return [ nodePreSwitch ]
}