/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <Martin@Revoltera.com> wrote this file. As long as you retain this notice,
 * you can do whatever you want with this stuff. If we meet some day, and you
 * think this stuff is worth it, you can buy me a beer in return.
 * ----------------------------------------------------------------------------
 */

; (function ($) {

    class Polygonizr {

        constructor($this, options) {
            //////////////////////
            // Define variables //
            //////////////////////
            this.$this = $this;
            this.settings = $.extend({}, $.fn.polygonizr.defaults, options);

            // Create a new canvas element and append it to the current object.
            this.canvasElement = document.createElement('canvas');
            this.$this.append(this.canvasElement);

            // Setup context.
            this.ctx = this.canvasElement.getContext('2d');

            // Make a working copy of the movement distance to be modified to avoid overflow.
            this.m_nodeMovementDistance = this.settings.nodeMovementDistance;

            // Setup constant strings.
            const Constants = {
                Animation: {
                    EASING_LINEAR: "linear",
                    EASING_EASEIN: "easeIn",
                    EASING_EASEOUT: "easeOut",
                    EASING_EASEINOUT: "easeInOut",
                    EASING_ACCELERATE: "accelerateDecelerate",
                    EASING_DESCENDING: "descendingEntrance"
                },
                Rotation: {
                    MEDIAN_AXIS: "median",
                    CENTER_AXIS: "center",
                    LEFT_AXIS: "left",
                    RIGHT_AXIS: "right"
                },
                Coloring: {
                    COLORING_LINEAR: "linear",
                    COLORING_RANDOM: "random"
                }
            };

            ///////////////////////
            // Define functions. //
            ///////////////////////
            this.setupClusterNodes = function () {
                // Setup collection of nodes.
                this.nodes = [];

                // Distribute the nodes somewhere on our canvas.
                for (let i = 0; i < this.settings.numberOfNodes + this.settings.numberOfUnconnectedNode; i++) {
                    // Define the variable to hold the current node's position.
                    let currentNode = { x: 0, y: 0, z: 0 };

                    // Check what cluster formation, and get the position accordingly.
                    if (this.settings.randomizePolygonMeshNetworkFormation) {
                        currentNode.x = Math.random() * this.settings.canvasWidth;
                        currentNode.y = Math.random() * this.settings.canvasHeight;
                    }
                    else {
                        currentNode = this.settings.specifyPolygonMeshNetworkFormation(i);
                    }

                    // Set random z-origin.
                    let phi = Math.acos((Math.random() * 2) - 1);
                    currentNode.z = this.settings.node3dDepthDistance + (this.settings.node3dDepthDistance * Math.cos(phi));

                    // Set colors into arrays.
                    this.settings.nodeDotColor = Array.isArray(this.settings.nodeDotColor) ? this.settings.nodeDotColor : new Array(this.settings.nodeDotColor);
                    this.settings.nodeLineColor = Array.isArray(this.settings.nodeLineColor) ? this.settings.nodeLineColor : new Array(this.settings.nodeLineColor);
                    this.settings.nodeFillColor = Array.isArray(this.settings.nodeFillColor) ? this.settings.nodeFillColor : new Array(this.settings.nodeFillColor);
                    this.settings.nodeFillGradientColor = Array.isArray(this.settings.nodeFillGradientColor) ? this.settings.nodeFillGradientColor : new Array(this.settings.nodeFillGradientColor);

                    // Set max if no overflow is allowed.
                    if (this.settings.nodeOverflow == false) {
                        // Calculate new max heights and widths.
                        let maxDistance = this.settings.nodeMovementDistance + this.settings.nodeDotSize;
                        let maxHeight = this.settings.canvasHeight - maxDistance;
                        let maxWidth = this.settings.canvasWidth - maxDistance;

                        // Calculate new movement distance, not to go outside the canvas.
                        this.m_nodeMovementDistance = Math.min(Math.min(this.settings.nodeMovementDistance, maxWidth), Math.min(this.settings.nodeMovementDistance, maxHeight));

                        // Alter the canvas position to force it inside the canvas.
                        currentNode.x = Math.floor(currentNode.x + maxDistance > this.settings.canvasWidth ? maxWidth : currentNode.x);
                        currentNode.x = Math.floor(currentNode.x - maxDistance < maxDistance ? maxDistance : currentNode.x);
                        currentNode.y = Math.floor(currentNode.y + maxDistance > this.settings.canvasHeight ? maxHeight : currentNode.y);
                        currentNode.y = Math.floor(currentNode.y - maxDistance < maxDistance ? maxDistance : currentNode.y);
                    }

                    // Populate the nodes, and keep the original position to stay close.
                    this.nodes.push({
                        currentX: currentNode.x,
                        originX: currentNode.x,
                        startX: currentNode.x,
                        targetX: currentNode.x,
                        currentY: currentNode.y,
                        originY: currentNode.y,
                        startY: currentNode.x,
                        targetY: currentNode.y,
                        originZ: currentNode.z,
                        zAlpha: 1
                    });

                    // Setup free floating, unconnected dots.
                    this.nodes[i].UnconnectedNode = (this.settings.numberOfUnconnectedNode > i);
                }

                // For each node find the closest nodes.
                for (let i = 0; i < this.nodes.length; i++) {
                    // Start of with the first node.
                    let node = this.nodes[i];
                    let closestNodes = this.nodes;

                    // Filter out the current node from the collection.
                    closestNodes = closestNodes.filter(function(item) {
                        return item !== node;
                    });

                    // Sort all nodes in the collection based on their distance from the current node.
                    closestNodes.sort(function (a, b) {
                        if (getDistance(node, a) > getDistance(node, b)) return 1;
                        if (getDistance(node, a) < getDistance(node, b)) return -1;
                        return 0;
                    });

                    // From the sorted list of nodes, get the number of nodeRelations we want.
                    closestNodes = closestNodes.splice(0, this.settings.nodeRelations);

                    // Set closest node.
                    node.Closest = closestNodes;

                    // Set the color schema for the node.
                    node.nodeDotColor = this.settings.nodeDotColor[this.settings.nodeDotColoringSchema == Constants.Coloring.COLORING_RANDOM ?
                                                                    Math.floor(Math.random() * this.settings.nodeDotColor.length) :
                                                                    i % this.settings.nodeDotColor.length];
                    node.nodeLineColor = this.settings.nodeLineColor[this.settings.nodeLineColoringSchema == Constants.Coloring.COLORING_RANDOM ?
                                                                    Math.floor(Math.random() * this.settings.nodeLineColor.length) :
                                                                    i % this.settings.nodeLineColor.length];
                    node.nodeFillColor = this.settings.nodeFillColor[this.settings.nodeFillColoringSchema == Constants.Coloring.COLORING_RANDOM ?
                                                                    Math.floor(Math.random() * this.settings.nodeFillColor.length) :
                                                                    i % this.settings.nodeFillColor.length];
                    node.nodeFillGradientColor = this.settings.nodeFillGradientColor[this.settings.nodeFillGradientColoringSchema == Constants.Coloring.COLORING_RANDOM ?
                                                                    Math.floor(Math.random() * this.settings.nodeFillGradientColor.length) :
                                                                    i % this.settings.nodeFillGradientColor.length];

                    // Assigne the alpha level to the current node.
                    this.setAlphaLevel(node);
                }
            };

            ////////////////////////////////
            // Start the frame animation. //
            ////////////////////////////////
            this.Animator = function ($self, easing, fps, duration, delay, fancyEntrance, callback) {

                function step(timestamp) {
                    if (!m_startTime)
                        m_startTime = timestamp;
                    if (!m_lastFrameUpdate)
                        m_lastFrameUpdate = timestamp;
                    let currentFrame = Math.floor((timestamp - m_startTime) / (1000 / fps));

                    if (m_frameCount < currentFrame) {
                        m_frameCount = currentFrame;
                        let currentDuration = timestamp - m_lastFrameUpdate;
                        if (currentDuration <= m_duration) {
                            // Check if it is time to set new random target possitions.
                            if (m_newTargetPossition) {
                                setNewTargetPossition();
                                m_newTargetPossition = false;
                            }
                            // For each frame up till total duration, set new position for x and y.
                            if (m_entranceSingleton && fancyEntrance) {
                                setNewNodePossition(Constants.Animation.EASING_DESCENDING, currentDuration, m_duration);
                            }
                            else {
                                setNewNodePossition(easing, currentDuration, m_duration);
                            }

                            // Check for callbakcs.
                            if (callback && typeof (callback) === "function") {
                                // Call for a redraw.
                                callback($self);
                            }
                        }
                        else if (currentDuration >= (m_duration + m_delay)) {
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

                this.stop = function () {
                    if (this.isRunning) {
                        m_cancleAnimationFrame(m_requestId);
                        this.isRunning = false;
                        m_startTime = null;
                        m_frameCount = -1;
                    }
                };

                function setNewTargetPossition() {
                    // Used for the 3d rotation.
                    let allNewTargetX = [];

                    for (let i in $self.nodes) {
                        // Calculate new target possitions.
                        let newTargetX = $self.calculateNewTargetPossition($self.nodes[i].originX);
                        let newTargetY = $self.calculateNewTargetPossition($self.nodes[i].originY);

                        $self.nodes[i].targetX = newTargetX;
                        $self.nodes[i].targetY = newTargetY;
                        $self.nodes[i].startX = $self.nodes[i].currentX;
                        $self.nodes[i].startY = $self.nodes[i].currentY;

                        // Check if we ought to draw node-prediction.
                        $self.nodes[i].NodePrediction = $self.settings.nodeDotPrediction > 0 && Math.random() <= $self.settings.nodeDotPrediction;

                        // Add each target X.
                        allNewTargetX.push($self.nodes[i].targetX);
                    }

                    if ($self.settings.node3dRotateAxis == Constants.Rotation.MEDIAN_AXIS) {
                        // Get the median value of all target X to (3D) rotate around.
                        allNewTargetX.sort(function (a, b) { return a - b; });

                        var half = Math.floor(allNewTargetX.length / 2);

                        if (allNewTargetX.length % 2) {
                            m_rotationAxis = allNewTargetX[half];
                        } else {
                            m_rotationAxis = Math.floor((allNewTargetX[half - 1] + allNewTargetX[half]) / 2.0);
                        }
                    } else if ($self.settings.node3dRotateAxis == Constants.Rotation.LEFT_AXIS) {
                        m_rotationAxis = 0;
                    } else if ($self.settings.node3dRotateAxis == Constants.Rotation.RIGHT_AXIS) {
                        m_rotationAxis = $self.settings.canvasWidth;
                    } else {
                        m_rotationAxis = $self.settings.canvasWidth / 2;
                    }

                    // Rotate on nth-itteration.
                    m_3dRotateOnNthNodeMovement++;
                }

                function setNewNodePossition(easing, currentTime, endTime) {
                    // Calculate the current rotation, speed, and angle for the (3D) rotation.
                    m_turnSpeed = 2 * Math.PI / ($self.settings.duration * $self.settings.animationFps);
                    m_turnAngle = (m_turnAngle + m_turnSpeed) % (2 * Math.PI);
                    m_sinAngle = Math.sin(getEasing($self.settings.node3dRotatEase, currentTime, m_turnSpeed, 2 * Math.PI, endTime));
                    m_cosAngle = Math.cos(getEasing($self.settings.node3dRotatEase, currentTime, m_turnSpeed, 2 * Math.PI, endTime));

                    for (let i in $self.nodes) {
                        // Normal movement.
                        $self.nodes[i].currentX = getEasing(easing, currentTime, $self.nodes[i].startX, $self.nodes[i].targetX, endTime);
                        $self.nodes[i].currentY = getEasing(easing, currentTime, $self.nodes[i].startY, $self.nodes[i].targetY, endTime);

                        // Rotation logic.
                        if ($self.settings.node3dRotate && (m_3dRotateOnNthNodeMovement % $self.settings.node3dRotateOnNthNodeMovement) == 0) {
                            let m_dist = m_rotationAxis - $self.nodes[i].currentX;
                            m_rotX = -m_cosAngle * m_dist + m_sinAngle * ($self.nodes[i].originZ - $self.settings.node3dDepthDistance);
                            m_rotZ = -m_sinAngle * m_dist + m_cosAngle * ($self.nodes[i].originZ - $self.settings.node3dDepthDistance);
                            $self.nodes[i].currentX = m_rotX + m_rotationAxis;

                            if ($self.settings.nodeOverflow == false) {
                                // Calculate new max heights and widths.
                                let maxHeight = $self.settings.canvasHeight - $self.settings.nodeDotSize;
                                let maxWidth = $self.settings.canvasWidth - $self.settings.nodeDotSize;

                                // Alter the canvas position to force it inside the canvas.
                                $self.nodes[i].currentX = Math.floor($self.nodes[i].currentX > maxWidth ? maxWidth : $self.nodes[i].currentX);
                                $self.nodes[i].currentX = Math.floor($self.nodes[i].currentX < $self.settings.nodeDotSize ? $self.settings.nodeDotSize : $self.nodes[i].currentX);
                                $self.nodes[i].currentY = Math.floor($self.nodes[i].currentY > $self.settings.canvasHeight ? maxHeight : $self.nodes[i].currentY);
                                $self.nodes[i].currentY = Math.floor($self.nodes[i].currentY < $self.settings.nodeDotSize ? $self.settings.nodeDotSize : $self.nodes[i].currentY);
                            }

                            // To mimic depth, set a lower alpha level on that which is drawn "futher back".
                            $self.nodes[i].zAlpha = (1 - m_rotZ / (m_rotationAxis / 2));
                            let minAlpha = $self.settings.node3dRotateDepthAlpha;
                            $self.nodes[i].zAlpha = ($self.nodes[i].zAlpha > 1) ? 1 : (($self.nodes[i].zAlpha < minAlpha) ? minAlpha : $self.nodes[i].zAlpha);

                            // Reset the counter.
                            m_3dRotateOnNthNodeMovement = 0;
                        }

                    }
                }

                let m_requestAnimationFrame = window.requestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame;
                let m_cancleAnimationFrame = window.cancelAnimationFrame ||
                    window.mozCancelRequestAnimationFrame ||
                    window.webkitCancelRequestAnimationFrame ||
                    window.oCancelRequestAnimationFrame ||
                    window.msCancelRequestAnimationFrame;

                let m_startTime = null;
                let m_frameCount = -1;
                let m_requestId = null;
                let m_lastFrameUpdate = null;
                let m_newTargetPossition = true;
                let m_entranceSingleton = true;
                let m_duration;
                let m_delay;
                let m_sinAngle;
                let m_cosAngle;
                let m_turnAngle = 0;
                let m_turnSpeed = 2 * Math.PI / (100);
                let m_rotZ;
                let m_rotX;
                let m_rotationAxis = 0;
                let m_3dRotateOnNthNodeMovement = 0;
            };

            function getEasing(easing, currentTime, startPossition, targetPossition, endTime) {
                switch (easing) {
                    case Constants.Animation.EASING_LINEAR:
                        return (targetPossition - startPossition) * (currentTime / endTime) + startPossition;
                    case Constants.Animation.EASING_EASEIN:
                        currentTime /= endTime;
                        return (targetPossition - startPossition) * Math.pow(currentTime, 2) + startPossition;
                    case Constants.Animation.EASING_EASEOUT:
                        currentTime /= endTime;
                        return -(targetPossition - startPossition) * currentTime * (currentTime - 2) + startPossition;
                    case Constants.Animation.EASING_EASEINOUT:
                        currentTime /= (endTime / 2);
                        if (currentTime < 1)
                            return (targetPossition - startPossition) / 2 * Math.pow(currentTime, 2) + startPossition;
                        return -(targetPossition - startPossition) / 2 * ((currentTime - 1) * ((currentTime - 1) - 2) - 1) + startPossition;
                    case Constants.Animation.EASING_ACCELERATE:
                        currentTime /= (endTime / 2);
                        if (currentTime < 1)
                            return (targetPossition - startPossition) / 2 * Math.pow(currentTime, 3) + startPossition;
                        return (targetPossition - startPossition) / 2 * (Math.pow(currentTime - 2, 3) + 2) + startPossition;
                    case Constants.Animation.EASING_DESCENDING:
                        currentTime /= (endTime / 2);
                        if (currentTime < 1)
                            return (targetPossition - startPossition) / Math.pow(currentTime, 3) + startPossition;
                        return (targetPossition - startPossition) / (Math.pow(currentTime - 2, 3) + 2) + startPossition;
                    default:
                        return getEasing(Constants.Animation.EASING_LINEAR, currentTime, startPossition, targetPossition, endTime);
                }
            }

            //////////////////////////////////////////////////////////////
            // Calculates a new target possition for a given coordinate //
            //////////////////////////////////////////////////////////////
            this.calculateNewTargetPossition = function (originValue) {
                return originValue + (Math.random() < 0.5 ? -Math.random() : Math.random()) * this.m_nodeMovementDistance;
            };

            ////////////////////////////////
            // Calculate the alpha levels //
            ////////////////////////////////
            this.setAlphaLevel = function (node) {
                let screenDistance = Math.sqrt(Math.pow(this.settings.canvasWidth, 2) + Math.pow(this.settings.canvasHeight, 2));
                let nodeDistance = 0;
                for (let i in node.Closest) {
                    nodeDistance += getDistance(node.Closest[i], node.Closest[(i + 1) % node.Closest.length]);
                }
                let generalAlpha = 1 - (nodeDistance / screenDistance);
                node.lineAlpha = generalAlpha * this.settings.nodeLineAlpha;
                node.dotAlpha = generalAlpha * this.settings.nodeDotAlpha;

                //////////////////////////////////////
                // Change till desired effect, more //
                // or less randomly assigned anyway //
                //////////////////////////////////////
                if (generalAlpha > 0.85) {
                    node.fillAlpha = generalAlpha * this.settings.nodeFillAlpha;
                    node.lineAlpha = this.settings.nodeLineAlpha;
                    node.dotAlpha = this.settings.nodeDotAlpha;
                }
                else if (generalAlpha < 0.8 && generalAlpha > 0.7) {
                    node.fillAlpha = 0.5 * generalAlpha * this.settings.nodeFillAlpha;
                    node.lineAlpha = this.settings.nodeLineAlpha;
                    node.dotAlpha = this.settings.nodeDotAlpha;
                }
                else if (generalAlpha < 0.7 && generalAlpha > 0.4) {
                    node.fillAlpha = 0.2 * generalAlpha * this.settings.nodeFillAlpha;
                }
                else {
                    node.fillAlpha = 0;
                }
            };

            //////////////////////////
            // Updates what to draw //
            //////////////////////////
            this.draw = function ($self) {
                $self.ctx.clearRect(0, 0, $self.settings.canvasWidth, $self.settings.canvasHeight);
                for (let i in $self.nodes) {
                    // Draw the lines and circles.
                    $self.drawLines($self, $self.nodes[i]);
                    $self.drawCircle($self, $self.nodes[i]);
                }
            };

            ////////////////////////////////
            // Handles the line drawings. //
            ////////////////////////////////
            this.drawLines = function ($self, node) {
                // If not visible, return.
                if (!node.lineAlpha > 0 && !node.fillAlpha > 0)
                    return;

                for (let i in node.Closest) {
                    // Check if we should draw the connection, or if its an unconnected node or if it is too far away.
                    let lineConnection = (node.Closest[i].UnconnectedNode == false && node.Closest[(i + 1) % node.Closest.length].UnconnectedNode == false);
                    let drawCloseUnconnection = $self.settings.ConnectUnconnectedNodes == true && getDistance(node, node.Closest[i]) <= $self.settings.ConnectUnconnectedNodesDistance;

                    if (lineConnection || drawCloseUnconnection) {
                        if (node.lineAlpha > 0) {
                            if (drawCloseUnconnection) {
                                // For new connections, let the alpha out/in a bit.
                                let connectioDist = (1 - (getDistance(node, node.Closest[i]) / $self.settings.ConnectUnconnectedNodesDistance)) * 1.8;
                                connectioDist = connectioDist > 1 ? 1 : connectioDist;
                                $self.drawLineNodeConnection($self, node, i, connectioDist);
                            } else {
                                $self.drawLineNodeConnection($self, node, i, 1);
                            }
                        }

                        if ($self.settings.nodeFillSapce && node.fillAlpha > 0 && lineConnection) {
                            $self.drawFillNodeConnection($self, node, i);
                        }
                    }
                }
            };

            this.drawLineNodeConnection = function ($self, node, i, connectioAlpha) {
                $self.ctx.beginPath();
                $self.ctx.moveTo(node.currentX, node.currentY);
                $self.ctx.lineTo(node.Closest[i].currentX, node.Closest[i].currentY);
                $self.ctx.strokeStyle = 'rgba(' + node.nodeLineColor + ',' + ((node.lineAlpha * node.zAlpha) * connectioAlpha) + ')';
                $self.ctx.stroke();
            };

            this.drawFillNodeConnection = function ($self, node, i) {
                $self.ctx.beginPath();
                $self.ctx.moveTo(node.currentX, node.currentY);
                $self.ctx.lineTo(node.Closest[i].currentX, node.Closest[i].currentY);
                $self.ctx.lineTo(node.Closest[(i + 1) % node.Closest.length].currentX, node.Closest[(i + 1) % node.Closest.length].currentY);

                // Check if we want gradient color, and if the coordinates are finite.
                if (node.nodeFillGradientColor !== null && (isFinite(node.currentX) && isFinite(node.currentY) && isFinite(node.Closest[i].currentX) && isFinite(node.Closest[i].currentY))) {
                    var gradient = $self.ctx.createLinearGradient(node.currentX, node.currentY, node.Closest[i].currentX, node.Closest[i].currentY);
                    gradient.addColorStop(0, 'rgba(' + node.nodeFillColor + ',' + (node.fillAlpha * node.zAlpha) + ')');
                    gradient.addColorStop(1, 'rgba(' + node.nodeFillGradientColor + ', ' + (node.fillAlpha * node.zAlpha) + ')');
                    $self.ctx.fillStyle = gradient;
                }
                else {
                    $self.ctx.fillStyle = 'rgba(' + node.nodeFillColor + ',' + (node.fillAlpha * node.zAlpha) + ')';
                }

                $self.ctx.fill();
            };

            ////////////////////////////////
            // Handles the node drawings. //
            ////////////////////////////////
            this.drawCircle = function ($self, node) {
                // If not visible, return.
                if (!node.dotAlpha > 0)
                    return;

                $self.ctx.beginPath();
                $self.ctx.arc(node.currentX, node.currentY, $self.settings.nodeDotSize, 0, Math.PI * 2, false);
                $self.ctx.fillStyle = 'rgba(' + node.nodeDotColor + ', ' + (node.dotAlpha * node.zAlpha) + ')';

                if ($self.settings.nodeGlowing) {
                    $self.ctx.shadowBlur = 10;
                    $self.ctx.shadowColor = 'rgba(' + node.nodeDotColor + ', ' + (node.dotAlpha * node.zAlpha) + ')';
                } if (node.NodePrediction == true) {
                    let nodeSize = ($self.settings.nodeDotSize * Math.PI);
                    let nodeMiddleSize = (nodeSize / 2);
                    $self.ctx.font = nodeSize + "px Arial";
                    $self.ctx.strokeRect(node.targetX - nodeMiddleSize, node.targetY - nodeMiddleSize, nodeSize, nodeSize);
                    $self.ctx.fillText(node.targetX + ", " + node.targetY, node.targetX + nodeSize, node.targetY - nodeMiddleSize);
                }
                $self.ctx.fill();
            };

            /////////////////////////////////////////
            // Get the distance between two nodes. //
            /////////////////////////////////////////
            function getDistance(firstNode, secondNode) {
                return Math.sqrt(Math.pow(firstNode.currentX - secondNode.currentX, 2) + Math.pow(firstNode.currentY - secondNode.currentY, 2));
            }
        }

        refresh() {
            // Stop and clear any lingering drawings.
            this.clear();

            // Initiate/Update the canvas element.
            this.canvasElement.width = this.settings.canvasWidth;
            this.canvasElement.height = this.settings.canvasHeight;
            this.canvasElement.style.position = this.settings.canvasPosition;
            this.canvasElement.style.top = this.settings.canvasTop;
            this.canvasElement.style.bottom = this.settings.canvasBottom;
            this.canvasElement.style.right = this.settings.canvasRight;
            this.canvasElement.style.left = this.settings.canvasLeft;
            this.canvasElement.style.zIndex = this.settings.canvasZ;

            // Start setting up node nodes.
            this.setupClusterNodes();

            this.animation = new this.Animator(this,
                this.settings.nodeEase,
                this.settings.animationFps,
                this.settings.duration,
                this.settings.restNodeMovements,
                this.settings.nodeFancyEntrance,
                this.draw);

            this.animation.start();
        }

        start() {
            if (this.animation !== undefined) {
                this.animation.start();
            }
        }

        stop() {
            if (this.animation !== undefined) {
                this.animation.stop();
            }
        }

        clear() {
            this.stop();
            if (this.ctx !== undefined)
                this.ctx.clearRect(0, 0, this.settings.canvasWidth, this.settings.canvasHeight);
        }

        options(options) {
            if (this.$this !== undefined) {
                for (let option in options) {
                    this.settings[option] = options[option];
                }
            }
        }

        destroy() {
            if (this.$this !== undefined) {
                this.clear();
                this.$this.removeData("polygonizr");
                delete this.$this;
            }
        }
    }

    $.fn.polygonizr = function (option) {
        let options = typeof option == "object" && option;

        return this.each(function () {
            let $this = $(this);
            let $polygonizr = $this.data("polygonizr");

            if (!$polygonizr) {
                $polygonizr = new Polygonizr($this, options);
                $this.data("polygonizr", $polygonizr);
            } else if (options) {
                $polygonizr.options(options);
            }

            if (typeof option == 'string') {
                $polygonizr[option]();
            } else {
                $polygonizr.refresh();
            }
        });
    };

    $.fn.polygonizr.defaults = {
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
        // Indicates if a line should be drawn between unconnected nodes. Default: true
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
    };

}(jQuery));
