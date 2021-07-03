polygonizr
==========
**A jQuery plugin for creating a polygon mesh network background**

[![License](https://img.shields.io/badge/license-Beerware-blue.svg)](LICENSE.md)

![GIF showing polygonize animation](/samples/polygonizr-readme-animation.gif)

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
These options can be updated at any point. However, some updates might require calling <i>refresh</i> afterwards to take effect (see [functions](#Functions) below).
```javascript
    // Example of how to make polygonizr responsive to window resizing.
    $(window).resize(function () {
        let $sitelading = $('#site-landing');
        $sitelading.polygonizr("stop");

        // Update polygonizr with the new window size.
        $sitelading.polygonizr({
            canvasHeight: $(this).height(),
            canvasWidth: $(this).width()
        });

        $sitelading.polygonizr("refresh");
    });
```

### Custom node positioning
Among the possible overrides, you can for example also alter how the initial x and y coordinates are positioned for each node. The <i>"specifyPolygonMeshNetworkFormation"</i> setting acts as a loop for each <i>"numberOfNodes"</i> to be painted. To alter their positioning, simply return an x and y coordinate to create a desired pattern, as illustrated in the samples below.

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
```

### Functions
Polygonizr has five functions: start, stop, clear, refresh, and destroy. Each function is described in the following subsections.
#### Start and Stop
Use start and stop to pause and continue an animation.
```javascript
    $('#site-landing').polygonizr("start");
    $('#site-landing').polygonizr("stop");
```
#### Clear
Clear will stop any ongoing animation, and then remove its drawing from the canvas.
```javascript
    $('#site-landing').polygonizr("clear");
```
#### Refresh
Refresh will first clear an animation, then read all settings and setup the animation again from scratch.
```javascript
    $('#site-landing').polygonizr("refresh");
```
#### Destroy
Destroy is used to clear the animation, and remove the instance of the plugin from the current DOM-element.
```javascript
    $('#site-landing').polygonizr("destroy");
```

## Settings and Defaults

```javascript
        // Indicates the time (in seconds) to pause after a node has reached its destination. Default: 1
        restNodeMovements: 0,
        // Indicates how long (in seconds) it will take for a node to move from start to finish. Default: 3
        duration: 3,
        // Indicates the maximum (will be randomized) distance a node can move (in pixles) from its starting position. Default: 100
        nodeMovementDistance: 100,
        // Indicates the maximum (will be randomized) distance a node can have in depth (for a better 3D effect). Default: 300
        node3dDepthDistance: 300,
        // If set to true, the animation will rotate. Default: false
        node3dRotate: false,
        // If node3dRotate is set to true, the following option indicate if rotation should pause between n restNodeMovements. Default: 1
        node3dRotateOnNthNodeMovement: 1,
        // If node3dRotate is set to true, the following option indicate the alpha of the nodes at the far end of the rotation, creating depth. Default: 0.1
        node3dRotateDepthAlpha: 0.1,
        // If node3dRotate is set to true, the following option indicates the ease mode of each node movement (linear, easeIn, easeOut, easeInOut, accelerateDecelerate). Default: linear
        node3dRotatEase: "linear",
        // If node3dRotate is set to true, the following option indicate the axis on the canvas around which the animation will rotate (median, center, left, right). Default: center
        node3dRotateAxis: "center",
        // Indicates how many nodes to paint which relation can be filled (note: nodeFillSapce must be set to true). Default: 20
        numberOfNodes: 20,
        // Indicates how many nodes to paint that does not create relations that can be filled. Default: 35
        numberOfUnconnectedNode: 35,
        // Indicates if a line should be drawn between the drawn between unconnected nodes. Default: true
        ConnectUnconnectedNodes: true,
        // Indicates the maximum distance between unconnected nodes to draw the line. Default: 250
        ConnectUnconnectedNodesDistance: 250,
        // Indicates the maximum painted size of each node's "dot".
        nodeDotSize: 2.5,
        // Indicates the ease mode of each node movement (linear, easeIn, easeOut, easeInOut, accelerateDecelerate). Default: easeOut
        nodeEase: "easeOut",
        // If true, the nodes starting position will descend into place on load. Default: false
        nodeFancyEntrance: false,
        // If true, each nodes starting position will be randomized within the canvas size. If false, each nodes position must be specified manually. Default: true
        randomizePolygonMeshNetworkFormation: true,
        // Indicates the positioning of each nodes starting position (note: randomizePolygonMeshNetworkFormation must be set to false). Default: null
        specifyPolygonMeshNetworkFormation: null,
        // Indicates how many nodes of the "numberOfNodes" that will be connected. Default: 3
        nodeRelations: 3,
        // Indicates the frame rate at which to update each node movement. Default: 30
        animationFps: 30,
        // Indicates the color (RGB), or an array of colors, of each node's "dot". Default: "200, 200, 200"
        nodeDotColor: "200, 200, 200",
        // If nodeDotColor is set to an array of colors, this option indicates in what order to pick the colors (linear or random). Default: linear
        nodeDotColoringSchema: "linear",
        // Indicates the color (RGB), or an array of colors, of the line drawn between connected nodes. Default: "150, 150, 150"
        nodeLineColor: "150, 150, 150",
        // If nodeLineColor is set to an array of colors, this option indicates in what order to pick the colors (linear or random). Default: linear
        nodeLineColoringSchema: "linear",
        // Indicates the fill color (RGB), or an array of colors, between each connected node. Default: "100, 100, 100"
        nodeFillColor: "100, 100, 100",
        // If nodeFillColor is set to an array of colors, this option indicates in what order to pick the colors (linear or random). Default: linear
        nodeFillColoringSchema: "linear",
        // Indicates the linear gradient to the fill color (RGB), or an array of colors, between each connected node. Default: null
        nodeFillGradientColor: null,
        // If nodeFillGradientColor is set to an array of colors, this option indicates in what order to pick the colors (linear or random). Default: linear
        nodeFillGradientColoringSchema: "linear",
        // Indicates the fill color's alpha level (1-0). Default: 0.5
        nodeFillAlpha: 0.5,
        // Indicates the alpha level (1-0) of the line drawn between connected nodes. Default: 0.5
        nodeLineAlpha: 0.5,
        // Indicates the alpha level (1-0) of each node's "dot". Default: 1.0
        nodeDotAlpha: 1.0,
        // Indicates the probability (1-0) of showing the coordinates for each nodes final position. Default: 0
        nodeDotPrediction: 0,
        // If true, the relation between connected nodes will be filled. Default: true
        nodeFillSapce: true,
        // If true, each node's final position can be outside the canvas boundary. Default: true
        nodeOverflow: true,
        // If true, a glowing effect is added to each node, its relations and fill respectively. Default: false
        nodeGlowing: false,
        // Indicates the width of the canvas on which to paint each node. Default: $(this).width()
        canvasWidth: $(this).width(),
        // Indicates the height of the canvas on which to paint each node. Default: $(this).height();
        canvasHeight: $(this).height(),
        // Indicate the CSS position property by which to position the canvas. Default: "absolute"
        canvasPosition: "absolute",
        // Indicate the CSS top property by which to vertically position the canvas. Default: "auto"
        canvasTop: "auto",
        // Indicate the CSS bottom property by which to vertically position the canvas. Default: "auto"
        canvasBottom: "auto",
        // Indicate the CSS right property by which to horizontally position the canvas. Default: "auto"
        canvasRight: "auto",
        // Indicate the CSS left property by which to horizontally position the canvas. Default: "auto"
        canvasLeft: "auto",
        // Indicate the CSS z-index property by which to specify the stack order of the canvas. Default: "auto"
        canvasZ: "auto"
```