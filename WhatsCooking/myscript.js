// Dimensions of display area

var width = 760,
    height = 500;

// Visual properties of the network net

var labelFill = '#444';
var adjLabelFill = '#aaa';
var edgeStroke = '#aaa';
var nodeFill = '#ccc';
var nodeRadius = 10;
var selectedNodeRadius = 30;

var linkDistance = Math.min(width,height)/4;

// Select the sub container

var net = d3.select('#net');

// Create the SVG container for the visualization and
// define its dimensions.

var svg = net.append('svg')
    .attr('width', width)
    .attr('height', height);

// Update the position properties
// of an arbtrary edge that's part of a D3 selection.

var positionEdge = function(edge, nodes) {
    edge.attr('x1', function(d) {
        return nodes ? nodes[d.source].x : d.source.x;
    }).attr('y1', function(d) {
        return nodes ? nodes[d.source].y : d.source.y;
    }).attr('x2', function(d) {
        return nodes ? nodes[d.target].x : d.target.x;
    }).attr('y2', function(d) {
        return nodes ? nodes[d.target].y : d.target.y;
    });
};

// Utility function to update the position properties
// of an arbitrary node that's part of a D3 selection.

var positionNode = function(node) {
    node.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
};

// Utility function to position text associated with
// a label pseudo-node. The optional third parameter
// requests transition to the specified fill color.

var positionLabelText = function(text, pseudonode, fillColor) {

    // What's the width of the text element?

    var textWidth = text.getBBox().width;

    // How far is the pseudo-node from the real one?

    var diffX = pseudonode.x - pseudonode.node.x;
    var diffY = pseudonode.y - pseudonode.node.y;
    var dist = Math.sqrt(diffX * diffX + diffY * diffY);

    // Shift in the x-direction a fraction of the text width

    var shiftX = textWidth * (diffX - dist) / (dist * 2);
    shiftX = Math.max(-textWidth, Math.min(0, shiftX));

    var shiftY = pseudonode.node.selected ? selectedNodeRadius : nodeRadius;
    shiftY = 0.5 * shiftY * diffY/Math.abs(diffY);

    var select = d3.select(text);
    if (fillColor) {
        select = select.transition().style('fill', fillColor);
    }
    select.attr('transform', 'translate(' + shiftX + ',' + shiftY + ')');
};


// Retrieve the external data. 

d3.json('train.json', function(error, data) {

    // Find the net nodes from the data set. Each
    // album is a separate node.

    var nodes = data.map(function(entry, idx, list) {
        var node = {};
        node.title    = entry.cuisine;
        node.color    = entry.color;
        node.text     = entry.text;

        // "link" refers to an individual connection
        // between nodes

        node.links = entry.ingredients.slice(0);

        // Start the nodes off in a
        // circle in the center of the container.

        var radius = 0.4 * Math.min(height,width);
        var theta = idx*2*Math.PI / list.length;
        node.x = (width/2) + radius*Math.sin(theta);
        node.y = (height/2) + radius*Math.cos(theta);

        return node;
    });

    // Identify all the indivual links between nodes on
    // the net. 

    var links = [];

    // Start by iterating through cuisines.

    data.forEach(function(srcNode, srcIdx, srcList) {

        // For each cruisine, iterate through the ingredients.

        srcNode.ingredients.forEach(function(srcLink) {

            // For each ingredient in the cuisine catagory, iterate
            // through the remaining catagories

            for (var tgtIdx = srcIdx + 1;
                     tgtIdx < srcList.length;
                     tgtIdx++) {

                // Use a variable to refer to the "tgt"
                // cuisine set for convenience.

                var tgtNode = srcList[tgtIdx];

                // Is there any ingredient in the "tgt"
                // catagory that matches the cuisine we're
                // currently considering from the "src"
                // cuisine?

                if (tgtNode.ingredients.some(function(tgtLink){
                    return tgtLink === srcLink;
                })) {

                    // If find a match, add a new
                    // link to the links array.

                    links.push({
                        source: srcIdx,
                        target: tgtIdx,
                        link: srcLink
                    });
                }
            }
        });
    });

    // Create the edges for our net by
    // eliminating duplicates from the links array.

    var edges = [];

    // Iterate through the links array.

    links.forEach(function(link) {

        // Assume for now that the current link is
        // unique.

        var existingEdge = false;

        // Look through the edges which have collected so
        // far to see if the current link is already
        // present.

        for (var idx = 0; idx < edges.length; idx++) {

            // A duplicate link has the same source
            // and target values.

            if ((link.source === edges[idx].source) &&
                (link.target === edges[idx].target)) {
                existingEdge = edges[idx];
                break;
            }
        }

        // If find an existing edge
        // add the current link to it.

        if (existingEdge) {

            existingEdge.links.push(link.link);

        } else {

            // If there was no existing edge,
            // create one now.

            edges.push({
                source: link.source,
                target: link.target,
                links: [link.link]
            });
        }
    });

    // Start the creation of the net by adding the edges.
    // We add these first so they'll appear "underneath"
    // the nodes.

    var edgeSelection = svg.selectAll('.edge')
        .data(edges)
        .enter()
        .append('line')
        .classed('edge', true)
        .style('stroke', edgeStroke)
        .call(positionEdge, nodes);

    // Next up are the nodes.

    var nodeSelection = svg.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .classed('node', true)
        .call(positionNode);

    nodeSelection.append('circle')
        .attr('r', nodeRadius)
        .attr('data-node-index', function(d,i) { return i;})
        .style('fill', nodeFill)

    nodeSelection.each(function(node){

        // identify all edges that arebincident to the node

        node.incidentEdgeSelection = edgeSelection
            .filter(function(edge) {
                return nodes[edge.source] === node ||
                       nodes[edge.target] === node;
            });
    });

    nodeSelection.each(function(node){

        // Find all adjacencies.
        // An adjacent node shares an edge with the
        // current node.

        node.adjacentNodeSelection = nodeSelection
            .filter(function(otherNode){

                // Presume that the nodes are not adjacent.
                var isAdjacent = false;

                // Exclude to be adjacent to ourselves.

                if (otherNode !== node) {

                    // Look the incident edges of both nodes to
                    // see if there are any in common.

                    node.incidentEdgeSelection.each(function(edge){
                        otherNode.incidentEdgeSelection.each(function(otherEdge){
                            if (edge === otherEdge) {
                                isAdjacent = true;
                            }
                        });
                    });

                }

                return isAdjacent;
            });

    });

    // Next we create a array for the node labels.

    var labels = [];
    var labelLinks = [];

    nodes.forEach(function(node, idx){
        // Add the pseudo-nodes to their array.

        labels.push({node: node});
        labels.push({node: node});

        // And create a link between them.

        labelLinks.push({
            source: idx * 2,
            target: idx * 2 + 1
        });
    });

    // Create a selection for the force layout.

    var labelLinkSelection = svg.selectAll('line.labelLink')
        .data(labelLinks);

    // The label pseud-nodes themselves are just
    // `<g>` containers.

    var labelSelection = svg.selectAll('g.labelNode')
        .data(labels)
        .enter()
        .append('g')
            .classed('labelNode',true);

    // Add the text itself

    labelSelection.append('text')
        .text(function(d, i) {
            return i % 2 == 0 ? '' : d.node.title;
        })
        .attr('data-node-index', function(d, i){
            return i % 2 == 0 ? 'none' : Math.floor(i/2);
        });

    // The last bit of markup are the lists of
    // connections for each link.

    var connectionSelection = net.selectAll('ul.connection')
        .data(edges)
        .enter()
        .append('ul')
        .classed('connection hidden', true)
        .attr('data-edge-index', function(d,i) {return i;});

    connectionSelection.each(function(connection){
        var selection = d3.select(this);
        connection.links.forEach(function(link){
            selection.append('li')
                .text(link);
        })
    })

    // Create the main force layout.

    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .links(edges)
        .linkDistance(linkDistance)
        .charge(-500);

    // Create the force layout for the labels.

    var labelForce = d3.layout.force()
        .size([width, height])
        .nodes(labels)
        .links(labelLinks)
        .gravity(0)
        .linkDistance(0)
        .linkStrength(0.8)
        .charge(-100);

    // Allow dragging the nodes.

    nodeSelection.call(force.drag);

    // Function to handle clicks on node elements

    var nodeClicked = function(node) {

        // Ignore events based on dragging.

        if (d3.event.defaultPrevented) return;

        var selected = node.selected;
        var fillColor;

        nodeSelection
            .each(function(node) { node.selected = false; })
            .selectAll('circle')
                .transition()
                .attr('r', nodeRadius)
                .style('fill', nodeFill);

        edgeSelection
            .transition()
            .style('stroke', edgeStroke);

        labelSelection
            .transition()
            .style('opacity', 0);

        // Check if the node was previously selected.

        if (!selected) {

            // First we transition the incident edges.

            node.incidentEdgeSelection
                .transition()
                .style('stroke', node.color);

            // Now we transition the adjacent nodes.

            node.adjacentNodeSelection.selectAll('circle')
                .transition()
                .attr('r', nodeRadius)
                .style('fill', node.color);

            labelSelection
                .filter(function(label) {
                    var adjacent = false;
                    node.adjacentNodeSelection.each(function(d){
                        if (label.node === d) {
                            adjacent = true;
                        }
                    })
                    return adjacent;
                })
                .transition()
                .style('opacity', 1)
                .selectAll('text')
                    .style('fill', adjLabelFill);

            // Transition the node itself.

            d3.selectAll('circle[data-node-index="'+node.index+'"]')
                .transition()
                .attr('r', selectedNodeRadius)
                .style('fill', node.color);

            // Make sure the node's label is visible

            labelSelection
                .filter(function(label) {return label.node === node;})
                .transition()
                .style('opacity', 1);

            // And note the desired color for bundling with
            // the transition of the label position.

            fillColor = node.text;

            
            // Transition all the labels to their
            // default styles.

            labelSelection
                .transition()
                .style('opacity', 1)
                .selectAll('text')
                    .style('fill', labelFill);

            // The fill color for the current node's
            // label must also be bundled with its
            // position transition.

            fillColor = labelFill;
        }

        // Toggle the selection state for the node.

        node.selected = !selected;

        // Update the position of the label text.

        var text = d3.select('text[data-node-index="'+node.index+'"]').node();
        var label = null;
        labelSelection.each(function(d){
            if (d.node === node) { label = d; }
        })

        if (text && label) {
            positionLabelText(text, label, fillColor);
        }

    };

    // Function to handle click on edges.

    var edgeClicked = function(edge, idx) {

        // Remember the current selection state of the edge.

        var selected = edge.selected;

        // Transition all connections to hidden

        connectionSelection
            .each(function(edge) { edge.selected = false; })
            .transition()
            .style('opacity', 0)
            .each('end', function(){
                d3.select(this).classed('hidden', true);
            });

        // If the current edge wasn't selected before
        // ransition it to the selected state now.

        if (!selected) {
            d3.select('ul.connection[data-edge-index="'+idx+'"]')
                .classed('hidden', false)
                .style('opacity', 0)
                .transition()
                .style('opacity', 1);
        }

        // Toggle the resulting selection state for the edge.

        edge.selected = !selected;

    };

    // Handle clicks on the nodes.

    nodeSelection.on('click', nodeClicked);

    labelSelection.on('click', function(pseudonode) {
        nodeClicked(pseudonode.node);
    });

    // Handle clicks on the edges.

    edgeSelection.on('click', edgeClicked);
    connectionSelection.on('click', edgeClicked);

    // Animate the force layout.

    force.on('tick', function() {

        // Constrain all the nodes to remain in the
        // net container.

        nodeSelection.each(function(node) {
            node.x = Math.max(node.x, 2*selectedNodeRadius);
            node.y = Math.max(node.y, 2*selectedNodeRadius);
            node.x = Math.min(node.x, width-2*selectedNodeRadius);
            node.y = Math.min(node.y, height-2*selectedNodeRadius);
        });

        // Kick the label layout to make sure it doesn't
        // finish while the main layout is still running.

        labelForce.start();

        // Calculate the positions of the label nodes.

        labelSelection.each(function(label, idx) {

            if(idx % 2) {
                positionLabelText(this.childNodes[0], label);
            } else {
                label.x = label.node.x;
                label.y = label.node.y;
            }
        });

        // Calculate the position for the connection lists.

        connectionSelection.each(function(connection){
            var x = (connection.source.x + connection.target.x)/2 - 27;
            var y = (connection.source.y + connection.target.y)/2;
            d3.select(this)
                .style({
                    'top':  y + 'px',
                    'left': x + 'px'
                });
        });

        // Update the posistions of the nodes and edges.

        nodeSelection.call(positionNode);
        labelSelection.call(positionNode);
        edgeSelection.call(positionEdge);
        labelLinkSelection.call(positionEdge);

    });

    // Start the layout computations.
    force.start();
    labelForce.start();

});
