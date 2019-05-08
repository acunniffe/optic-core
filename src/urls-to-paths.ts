import { GraphQueries, NodeQueries } from './graph/graph-queries';
import { BaseNode } from './graph/nodes/base-node';
import { Graph, NodeId } from './graph/graph';

type PathPrefix = string

class PathComponentNode extends BaseNode {
  public type: string = 'pathComponent';
  public prefix: PathPrefix;
  public component: string;
  public isTerminal: boolean;
  //@GOTCHA...these nodes are supposed to be value objects. Ideally we would subclass PathComponentNode as QualifiedPathComponentNode and be able to overwrite/replace the node in the graph
  public isQualified: boolean = false;

  constructor(prefix: PathPrefix, component: string, isTerminal: boolean) {
    super();
    this.prefix = prefix;
    this.component = component;
    this.isTerminal = isTerminal;
  }

  public toGraphViz(): string {
    return `${this.isQualified ? ':' : ''}${this.component}${this.isTerminal ? '.' : ''}`;
  }
}

class PathRootNode extends BaseNode {
  public type: string = 'root';
}

class UrlsToPaths {
  private urls: Set<string>;
  private graph: Graph;
  private rootNodeId: NodeId;

  constructor() {
    this.urls = new Set();
    this.graph = new Graph();
    this.rootNodeId = this.graph.addNode(new PathRootNode());
  }

  public addUrl(url: string) {
    if (this.urls.has(url)) {
      return;
    }
    this.urls.add(url);

    const components = url.split('/');
    let parentNodeId = this.rootNodeId;
    let prefix = '';
    const maxIndex = components.length - 1;
    const queries = new GraphQueries(this.graph);
    components.forEach((component: string, componentIndex: number) => {
      prefix = `${prefix}/${component}`;
      const isTerminal = componentIndex === maxIndex;

      let matchingCousinNode = null;
      const parentSiblingWithMatchingChild = queries.node(parentNodeId)
        .siblingsAndSelf()
        .find((sibling: NodeQueries) => {
          if (sibling.node.id === parentNodeId) {
            return false;
          }
          matchingCousinNode = sibling
            .children()
            .find((cousin: NodeQueries) => {
              if (cousin.isA('pathComponent')) {
                const c = cousin.node.value as PathComponentNode;

                return c.component === component && c.isTerminal === isTerminal;
              }

              return false;
            });

          return !!matchingCousinNode;
        });


      if (matchingCousinNode) {
        /*console.log('.', component);
        console.log('p', (queries.node(parentNodeId).node.value as PathComponentNode).component);
        console.log('s', (parentSiblingWithMatchingChild.node.value as PathComponentNode).component);
        console.log('c', (matchingCousinNode.node.value as PathComponentNode).component);*/

        this.qualify(queries.node(parentNodeId));
        this.qualify(parentSiblingWithMatchingChild);
        this.graph.ensureEdgeExistsBetween(matchingCousinNode.node.id, parentNodeId);
        parentNodeId = matchingCousinNode.node.id;
      } else {
        const node: PathComponentNode = new PathComponentNode(prefix, component, isTerminal);
        const [nodeId] = this.graph.tryAddNode(node);

        this.graph.ensureEdgeExistsBetween(nodeId, parentNodeId);

        parentNodeId = nodeId;
      }
    });
  }

  private qualify(n: NodeQueries) {
    const pathComponentNode = n.node.value as PathComponentNode;
    // basic heuristic...could look at siblings
    if (pathComponentNode.component.match(/[0-9]/g)) {
      pathComponentNode.isQualified = true;
    }
  }

  public getPaths(parentNodeId: NodeId = this.rootNodeId): PathComponents[] {
    const queries = new GraphQueries(this.graph);

    return queries.node(parentNodeId)
      .children()
      .map((child: NodeQueries) => {
        const nodeValue = (child.node.value as PathComponentNode);
        const subPaths = this.getPaths(child.node.id);
        const output = nodeValue.isQualified ? ':' : nodeValue.component;

        if (subPaths.length === 0) {
          return [[output]];
        }

        return subPaths.map((p: PathComponents) => {
          return [output, ...p];
        });
      })
      .reduce((acc: PathComponents[], values: PathComponents[]) => [...acc, ...values], []);
  }
}

type PathComponents = string[]

export {
  UrlsToPaths,
};
