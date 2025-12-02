# Graph Viewer

## Context

I have a graph ontology (metamodel) which I use with a property graph. The metamodel defines the list of possible nodes, the properties in the nodes, the relationships possible between nodes and the properties possible on the relationships. The data in the graph will always adhere to this.

I have a basic app in place already. Go over the codebase in "src" directory and enhance it to implement the requirements below.

## App requirements

I want to build a visualization tool that can:
1. Render the nodes I select. That will be the starting point
2. When the user clicks on a node, it will show the data for that node from the graph. There may be 10s or 100s or even 1000s of actual nodes that may match the result. I want a "smart, efficient and elegant" way to display this information.
3. The data to be generated should be nodes that are rendered like an org chart. There should be nodes that are displayed in a grid-like structure. When I click on a node, more nodes should be created below that and the child nodes should be connected to the parent node. The most current parent-child relationship should be displayed with an animated line. Others should be a normal static line.
4. Every node should be represented with a stylish rectangular box. The box should have the title of the node and the type of node and a "details" icon. Clicking the icon should open a drawer on the right which should show the complete details of the node.

## Interaction Pattern

- Initial nodes to be displayed:
    - Dataspaces
    - Classes
    - Business Concepts

- Clicking on each one of them should make a REST call to /api where the call will be "/api/{type}". For example /api/dataspaces" or "/api/classes". This will give a response of a list of those nodes back. When you get the response, render the respective nodes.
- Every node type should have a different type of object to be rendered that will differentiate dataspace, classes and business concepts.
- Generate a server side code that can generate mock data for each of these APIs.