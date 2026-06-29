const nodeKeyMap = new WeakMap<Node, string>();
let nodeKeyCounter = 0;

export function getNodeKey(node: Node) {
  let key = nodeKeyMap.get(node);
  if (!key) {
    key = `qti-node-${++nodeKeyCounter}`;
    nodeKeyMap.set(node, key);
  }
  return key;
}
