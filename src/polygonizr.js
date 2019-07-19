/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <Martin@Revoltera.com> wrote this file. As long as you retain this notice,
 * you can do whatever you want with this stuff. If we meet some day, and you
 * think this stuff is worth it, you can buy me a beer in return.
 * ----------------------------------------------------------------------------
 */

(function ($) {
    $.fn.polygonizr = function (options) {
        var defaults = {
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
        };

        var settings = $.extend({}, defaults, options);

        return this.each(function () {
            // Create a new canvas element and append it to the current object.
            var m_this = $(this);
            var canvasElement = document.createElement('canvas');
            canvasElement.width = settings.canvasWidth;
            canvasElement.height = settings.canvasHeight;
            canvasElement.style.position = settings.canvasPosition;
            canvasElement.style.top = settings.canvasTop;
            canvasElement.style.bottom = settings.canvasBottom;
            canvasElement.style.right = settings.canvasRight;
            canvasElement.style.left = settings.canvasLeft;
            m_this.append(canvasElement);

            // Setup canvas, context and define variable for nodes.
            var ctx = canvasElement.getContext('2d');
            var nodes = [];

            // Start setting up node nodes.
            setupClusterNodes();

            // Start animations.
            startNodeAnimations();

            ////////////////////////////////////
            // Manages setting up the nodes. //
            ////////////////////////////////////
            function setupClusterNodes() {
                // Distribute the nodes somewhere on our canvas.
                for (var i = 0; i < settings.numberOfNodes + settings.numberOfUnconnectedNode; i++) {
                    // Define the variable to hold the current node's position.
                    var currentNode = { x: 0, y: 0 };

                    // Check what cluster formation, and get the position accordingly.
                    if (settings.randomizePolygonMeshNetworkFormation) {
                        currentNode.x = Math.random() * settings.canvasWidth;
                        currentNode.y = Math.random() * settings.canvasHeight;
                    } else {
                        currentNode = settings.specifyPolygonMeshNetworkFormation(i);
                    }

                    // Populate the nodes, and keep the original position to stay close.
                    nodes.push({
                        currentX: currentNode.x,
                        originX: currentNode.x,
                        startX: currentNode.x,
                        targetX: currentNode.x,
                        currentY: currentNode.y,
                        originY: currentNode.y,
                        startY: currentNode.x,
                        targetY: currentNode.y
                    });

                    // Setup free floating, unconnected dots.
                    nodes[i].UnconnectedNode = (settings.numberOfUnconnectedNode > i);
                }

                // For each node find the 3 closest nodes.
                for (var i = 0; i < nodes.length; i++) {
                    // Collect the closest nodes.
                    var closest = [];

                    // Start of with the first node.
                    var node = nodes[i];

                    // Collect randomly closest nodes.
                    for (var j = 0; j < nodes.length; j++) {
                        var tempNode = nodes[j];
                        if (node != tempNode) {
                            for (var k = 0; k < settings.nodeRelations; k++) {
                                if (closest[k] == undefined) {
                                    closest[k] = tempNode;
                                    break;
                                } if (getDistance(node, tempNode) < getDistance(node, closest[k])) {
                                    closest[k] = tempNode;
                                    break;
                                }
                            }
                        }
                    }

                    // Set closest node.
                    node.Closest = closest;

                    // Assigne the alpha level to the current node.
                    setAlphaLevel(node);
                }
            }

            ////////////////////////////////
            // Start the frame animation. //
            ////////////////////////////////
            function startNodeAnimations() {
                // Initiate the first drawing, and then update the animation after it finishes based on the time interval.
                var animator = new Animator(settings.nodeEase,
                    settings.animationFps,
                    settings.duration,
                    settings.restNodeMovements,
                    settings.nodeFancyEntrance,
                    draw);
                animator.start();
            }

            const Constants = {
                Animation: {
                    EASING_LINEAR: "linear",
                    EASING_EASEIN: "easeIn",
                    EASING_EASEOUT: "easeOut",
                    EASING_EASEINOUT: "easeInOut",
                    EASING_ACCELERATE: "accelerateDecelerate",
                    EASING_DESCENDING: "descendingEntrance"
                }
            };

            function Animator(easing, fps, duration, delay, fancyEntrance, callback) {

                function step(timestamp) {
                    if (!m_startTime) m_startTime = timestamp;
                    if (!m_lastFrameUpdate) m_lastFrameUpdate = timestamp;
                    var currentFrame = Math.floor((timestamp - m_startTime) / (1000 / fps));

                    if (m_frameCount < currentFrame) {
                        m_frameCount = currentFrame;
                        var currentDuration = timestamp - m_lastFrameUpdate;
                        if (currentDuration <= m_duration) {
                            // Check if it is time to set new random target possitions.
                            if (m_newTargetPossition) {
                                setNewTargetPossition();
                                m_newTargetPossition = false;
                            }
                            // For each frame up till total duration, set new position for x and y.
                            if (m_entranceSingleton && fancyEntrance) {
                                setNewNodePossition(Constants.Animation.EASING_DESCENDING, currentDuration, m_duration);
                            } else {
                                setNewNodePossition(easing, currentDuration, m_duration);
                            }
                            // Check for callbakcs.
                            if (callback && typeof (callback) === "function") {
                                // Call for a redraw.
                                callback();
                            }
                        } else if (currentDuration >= (m_duration + m_delay)) {
                            m_lastFrameUpdate = timestamp;
                            m_newTargetPossition = true;
                            m_entranceSingleton = false;
                        }
                    }
                    m_requestId = m_requestAnimationFrame(step);
                }

                this.isRunning = false;

                this.start = function () {
                    if (!this.isRunning) {
                        this.isRunning = true;
                        m_duration = duration * 1000;
                        m_delay = delay * 1000;
                        m_requestId = m_requestAnimationFrame(step);
                    }
                };

                this.pause = function () {
                    if (this.isRunning) {
                        m_cancleAnimationFrame(m_requestId);
                        this.isRunning = false;
                        m_startTime = null;
                        m_frameCount = -1;
                    }
                };

                var m_requestAnimationFrame = window.requestAnimationFrame       ||
                                              window.mozRequestAnimationFrame    ||
                                              window.webkitRequestAnimationFrame ||
                                              window.oRequestAnimationFrame      ||
                                              window.msRequestAnimationFrame     ;
                var m_cancleAnimationFrame =  window.cancelAnimationFrame              ||
                                              window.mozCancelRequestAnimationFrame    ||
                                              window.webkitCancelRequestAnimationFrame ||
                                              window.oCancelRequestAnimationFrame      ||
                                              window.msCancelRequestAnimationFrame     ;

                var m_startTime = null;
                var m_frameCount = -1
                var m_requestId = null;
                var m_lastFrameUpdate = null;
                var m_newTargetPossition = true;
                var m_entranceSingleton = true;
                var m_duration;
                var m_delay;
            }

            function getEasing(easing, currentTime, startPossition, targetPossition, endTime) {
                switch (easing) {
                    case Constants.Animation.EASING_LINEAR:
                        return (targetPossition - startPossition) * (currentTime / endTime) + startPossition;
                        break;
                    case Constants.Animation.EASING_EASEIN:
                        currentTime /= endTime;
                        return (targetPossition - startPossition) * Math.pow(currentTime, 2) + startPossition;
                    case Constants.Animation.EASING_EASEOUT:
                        currentTime /= endTime;
                        return -(targetPossition - startPossition) * currentTime * (currentTime - 2) + startPossition;
                    case Constants.Animation.EASING_EASEINOUT:
                        currentTime /= (endTime / 2);
                        if (currentTime < 1) return (targetPossition - startPossition) / 2 * Math.pow(currentTime, 2) + startPossition;
                        return -(targetPossition - startPossition) / 2 * ((currentTime - 1) * ((currentTime - 1) - 2) - 1) + startPossition;
                        break;
                    case Constants.Animation.EASING_ACCELERATE:
                        currentTime /= (endTime / 2);
                        if (currentTime < 1) return (targetPossition - startPossition) / 2 * Math.pow(currentTime, 3) + startPossition;
                        return (targetPossition - startPossition) / 2 * (Math.pow(currentTime - 2, 3) + 2) + startPossition;
                        break;
                    case Constants.Animation.EASING_DESCENDING:
                        currentTime /= (endTime / 2);
                        if (currentTime < 1) return (targetPossition - startPossition) / Math.pow(currentTime, 3) + startPossition;
                        return (targetPossition - startPossition) / (Math.pow(currentTime - 2, 3) + 2) + startPossition;
                        break;
                    default:
                        return getEasing(Constants.Animation.EASING_LINEAR, currentTime, startPossition, targetPossition, endTime);
                }
            }

            function setNewNodePossition(easing, currentTime, endTime) {
                for (var i in nodes) {
                    nodes[i].currentX = getEasing(easing, currentTime, nodes[i].startX, nodes[i].targetX, endTime);
                    nodes[i].currentY = getEasing(easing, currentTime, nodes[i].startY, nodes[i].targetY, endTime);
                }
            }

            function setNewTargetPossition() {
                for (var i in nodes) {
                    // Calculate new target possitions.
                    var newTargetX = calculateNewTargetPossition(nodes[i].originX);
                    var newTargetY = calculateNewTargetPossition(nodes[i].originY);

                    // If we don't want to allow the animation to draw outside the canvas, calculate new coordinations till it won't.
                    while (settings.nodeOverflow == false && nodeIsInsideCanvas(newTargetX, newTargetY) == false)
                    {
                        newTargetX = calculateNewTargetPossition(nodes[i].originX);
                        newTargetY = calculateNewTargetPossition(nodes[i].originY);
                    }

                    nodes[i].targetX = newTargetX;
                    nodes[i].targetY = newTargetY;
                    nodes[i].startX = nodes[i].currentX;
                    nodes[i].startY = nodes[i].currentY;
                }
            }

            //////////////////////////////////////////////////////////////
            // Calculates a new target possition for a given coordinate //
            //////////////////////////////////////////////////////////////
            function calculateNewTargetPossition(originValue)
            {
                return originValue + (Math.random() < 0.5 ? -Math.random() : Math.random()) * settings.nodeMovementDistance;
            }

            ////////////////////////////////
            // Calculate the alpha levels //
            ////////////////////////////////
            function setAlphaLevel(node) {
                var screenDistance = Math.sqrt(Math.pow(settings.canvasWidth, 2) + Math.pow(settings.canvasHeight, 2));
                var nodeDistance = 0;
                for (var i in node.Closest) {
                    nodeDistance += getDistance(node.Closest[i], node.Closest[(i + 1) % node.Closest.length]);
                }
                var generalAlpha = 1 - (nodeDistance / screenDistance);
                node.lineAlpha = generalAlpha * settings.nodeLineAlpha;
                node.dotAlpha = generalAlpha * settings.nodeDotAlpha;

                //////////////////////////////////////
                // Change till desired effect, more //
                // or less randomly assigned anyway //
                //////////////////////////////////////
                if (generalAlpha > 0.85) {
                    node.fillAlpha = generalAlpha * settings.nodeFillAlpha;
                    node.lineAlpha = settings.nodeLineAlpha;
                    node.dotAlpha = settings.nodeDotAlpha;
                } else if (generalAlpha < 0.8 && generalAlpha > 0.7) {
                    node.fillAlpha = 0.5 * generalAlpha * settings.nodeFillAlpha;
                    node.lineAlpha = settings.nodeLineAlpha;
                    node.dotAlpha = settings.nodeDotAlpha;
                } else if (generalAlpha < 0.7 && generalAlpha > 0.4) {
                    node.fillAlpha = 0.2 * generalAlpha * settings.nodeFillAlpha;
                } else {
                    node.fillAlpha = 0;
                }
            }

            //////////////////////////
            // Updates what to draw //
            //////////////////////////
            function draw() {
                ctx.clearRect(0, 0, settings.canvasWidth, settings.canvasHeight);
                for (var i in nodes) {
                    // Draw the lines and circles.
                    drawLines(nodes[i]);
                    drawCircle(nodes[i]);
                }
            }

            ////////////////////////////////
            // Handles the line drawings. //
            ////////////////////////////////
            function drawLines(node) {
                // If not visible, return.
                if (!node.lineAlpha > 0 && !node.fillAlpha > 0) return;
                
                for (var i in node.Closest) {
                    // Check if we should draw the connection, or if its an unconnected node or if it is too far away.
                    var lineConnection = (node.Closest[i].UnconnectedNode == false && node.UnconnectedNode == false);
                    var drawCloseUnconnection = settings.ConnectUnconnectedNodes == true && getDistance(node, node.Closest[i]) <= settings.ConnectUnconnectedNodesDistance;

                    if (lineConnection || drawCloseUnconnection)
                    {
                        if (node.lineAlpha > 0) {
                            drawLineNodeConnection(node, i);
                        }
                        
                        if (settings.nodeFillSapce && node.fillAlpha > 0 && lineConnection == true) {
                            drawFillNodeConnection(node, i);
                        }
                    } 
                }
            }

            function drawLineNodeConnection(node, i)
            {
                ctx.beginPath();
                ctx.moveTo(node.currentX, node.currentY);
                ctx.lineTo(node.Closest[i].currentX, node.Closest[i].currentY);
                ctx.strokeStyle = 'rgba(' + settings.nodeLineColor + ',' + node.lineAlpha + ')';
                ctx.stroke();
            }

            function drawFillNodeConnection(node, i)
            {
                ctx.beginPath();
                ctx.moveTo(node.currentX, node.currentY);
                ctx.lineTo(node.Closest[i].currentX, node.Closest[i].currentY);
                ctx.lineTo(node.Closest[(i + 1) % node.Closest.length].currentX, node.Closest[(i + 1) % node.Closest.length].currentY);
                ctx.fillStyle = 'rgba(' + settings.nodeFillColor + ',' + node.fillAlpha + ')';
                ctx.fill();
            }

            ////////////////////////////////
            // Handles the node drawings. //
            ////////////////////////////////
            function drawCircle(node) {
                // If not visible, return.
                if (!node.dotAlpha > 0) return;

                ctx.beginPath();
                ctx.arc(node.currentX, node.currentY, settings.nodeDotSize, 0, Math.PI * 2, false);
                ctx.fillStyle = 'rgba(' + settings.nodeDotColor + ', ' + node.dotAlpha + ')';
                if (settings.nodeGlowing) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(' + settings.nodeDotColor + ', ' + node.dotAlpha + ')';
                }
                ctx.fill();
            }

            /////////////////////////////////////////
            // Get the distance between two nodes. //
            /////////////////////////////////////////
            function getDistance(firstNode, secondNode) {
                return Math.sqrt(Math.pow(firstNode.currentX - secondNode.currentX, 2) + Math.pow(firstNode.currentY - secondNode.currentY, 2));
            }
            
            /////////////////////////////////////////////////////////
            // Check if the node coordinates are within the canvas //
            /////////////////////////////////////////////////////////
            function nodeIsInsideCanvas(nodeX, nodeY)
            {
                if (nodeX > 0 && nodeX < settings.canvasWidth &&
                    nodeY > 0 && nodeY < settings.canvasHeight) {
                    return true;
                }
          
                return false;
            }
        });
    };
}(jQuery));