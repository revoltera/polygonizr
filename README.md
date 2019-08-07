polygonizr
==========
**A jQuery plugin for creating a polygon mesh network bacgrkound**

[![License](https://img.shields.io/badge/license-Beerware-blue.svg)](LICENSE.md)

## Samples

### Initialization
Initialize the plugin on any jQuery DOM-element, in the sample a DIV-node with id "site-landing". The plugin creates a canvas which is by default absolute positioned and inherits the size of the parent.

```javascript
    $('#site-landing').polygonizr();
```
You can easily override default behavior on initialization by passing options to the plugin method. See below for a [list of possible settings](#settings-and-defaults).

```javascript
    $('#site-landing').polygonizr({
        numberOfNodes: 30,
        nodeEase: 'linear'
    });
```

### For lulz and funz
Among the possible overrides, you can for example also alter how the initial x and y coordinates are positioned. The <i>"specifyPolygonMeshNetworkFormation"</i> setting acts as a loop for each <i>"numberOfNodes"</i> to be drawn. To alter their positioning, simply return an x and y coordinate to create a desired pattern, as illustrated in the samples below.

Keep in mind, however, that you need to notify the plugin not to randomize the formation. This is done by passing <i>"false"</i> to the <i>"randomizePolygonMeshNetworkFormation"</i> setting.

The following two samples draws a circle and an archimedean spiral.

```javascript
    // Positions the initialized mesh nodes as a circle.
    $('#site-landing-circle').polygonizr({
        randomizePolygonMeshNetworkFormation: false,
        specifyPolygonMeshNetworkFormation: function (i) {
            var smallestCanvasDimention = Math.min(this.canvasWidth, this.canvasHeight) / 2;
            var forEachNode = {
                // Full circle in the center of the canvas.
                x: (this.canvasWidth / 2) + Math.cos(2 * Math.PI * i / this.numberOfNodes) * smallestCanvasDimention,
                y: (this.canvasHeight / 2) + Math.sin(2 * Math.PI * i / this.numberOfNodes) * smallestCanvasDimention
            };
            return forEachNode;
        }
    });

    // Positions the initialized mesh nodes as a spiral.
    $('#site-landing-spiral').polygonizr({
        randomizePolygonMeshNetworkFormation: false,
        specifyPolygonMeshNetworkFormation: function (i) {
            var turningDistance = Math.min((this.canvasWidth, this.canvasHeight) / 2) / this.numberOfNodes;
            var forEachNode = {
                // Archimedean spiral.
                x: (this.canvasWidth / 2) + (i * turningDistance * Math.PI / 180) * Math.cos((i * turningDistance) * Math.PI / 180) * turningDistance ,
                y: (this.canvasHeight / 2) + (i * turningDistance * Math.PI / 180) * Math.sin((i * turningDistance) * Math.PI / 180) * turningDistance
            };
            return forEachNode;
        }
    });

    // Positions the initialized mesh nodes on the right side of the screen, half circle style.
    $('#site-landing-halfcircle').polygonizr({
        randomizePolygonMeshNetworkFormation: false,
        specifyPolygonMeshNetworkFormation: function (i) {
            var forEachNode = {
                // Half a circle and randomized
                x: this.canvasWidth - ((this.canvasWidth / 2) + (this.canvasHeight / 2) * Math.cos(i * (2 * Math.PI / this.numberOfNodes))) * Math.random(),
                y: this.canvasHeight - (this.canvasHeight * (i / this.numberOfNodes))
            };
            return forEachNode;
        }
    });
```

## Settings and Defaults

```javascript
            // How long to pause in between new node-movements.
            restNodeMovements: 1,
            // When the cluster updates, this sets speed of nodes.
            duration: 3,
            // Define the maximum distance to move nodes.
            nodeMovementDistance: 100,
            // The number of node nodes to print out.
            numberOfNodes: 25,
            // The number of dots, unconnected to any other nodes, floating arround.
            numberOfUnconnectedNode: 25,
            // Connects passing free nodes if within the distance as specified in ConnectUnconnectedNodesDistance.
            ConnectUnconnectedNodes: true,
            // The distance between unconnected nodes to connect to each other.
            ConnectUnconnectedNodesDistance: 150,
            // Define the maximume size of each node dot.
            nodeDotSize: 2.5,
            // Sets the ease mode of the movement: linear, easeIn, easeOut, easeInOut, accelerateDecelerate.
            nodeEase: "easeOut",
            // If true, the nodes will descend into place on load.
            nodeFancyEntrance: false,
            // Makes the cluster forms an ellipse inspired formation, random if true.
            randomizePolygonMeshNetworkFormation: true,
            // Define a formula for how to initialize each node dot's position.
            specifyPolygonMeshNetworkFormation: null,
            // Number of relations between nodes.
            nodeRelations: 3,
            // The FPS for the whole canvas.
            animationFps: 30,
            // Sets the color of the node dots in the network (RGB).
            nodeDotColor: "240, 255, 250",
            // Sets the color of the node lines in the network (RGB).
            nodeLineColor: "240, 255, 250",
            // Sets the color of the filled triangles in the network (RGB).
            nodeFillColor: "240, 255, 250",
            // Sets the alpha level for the colors (1-0).
            nodeFillAlpha: 0.5,
            // Sets the alpha level for the lines (1-0).
            nodeLineAlpha: 0.5,
            // Sets the alpha level for the dots (1-0).
            nodeDotAlpha: 1.0,
            // A numberic value (0-1) defining the ods of showing the cooridnates for where a new node destination will end.
            nodeDotPrediction: 0,
            // Defines if the triangles in the network should be shown.
            nodeFillSapce: true,
            // If true, the animation is allowed to go outside the definde canvas space.
            nodeOverflow: true,
            // Define if the active animation should glow or not (not CPU friendly).
            nodeGlowing: false,
            // Define the canvas size and css position.
            canvasWidth: $(this).width(),
            canvasHeight: $(this).height(),
            canvasPosition: "absolute",
            canvasTop: "auto",
            canvasBottom: "auto",
            canvasRight: "auto",
            canvasLeft: "auto"
```