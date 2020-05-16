//
//  main.js
//
//  The arbor.js class definition
//
var Renderer = function(canvas){
    // GRAFO
    var canvas = $(canvas).get(0);
    var ctx = canvas.getContext("2d");
    trackTransforms(ctx);
    var particleSystem;
    var nodeSize = 10;

    // INTERACAO
    var desenhaTudo = false;
    var kinectData;
    var _mouseP = arbor.Point(0,0);
    var _kinectP = arbor.Point(0,0);

    // ZOOM
    var zoomTranslation = arbor.Point(0,0);
    var zoomScale = 1;
    var lastX = canvas.width/2, lastY = canvas.height/2;
    var kLastX = canvas.width/2, kLastY = canvas.height/2;
    var scaleFactor = 1.1;
    var zoom = function(clicks)
    {
        var translation = ctx.transformedPoint(lastX, lastY);
        ctx.translate(translation.x, translation.y);
        var factor = Math.pow(scaleFactor, clicks);
        zoomScale /= factor;
        ctx.scale(factor, factor);
        ctx.translate(-translation.x, -translation.y);
        if (zoomScale < 1.0)
            nodeSize = 10 * zoomScale;
        that.redraw();
    }
    var kZoom = function(factor)
    {
        var translation = ctx.transformedPoint(kLastX, kLastY);
        ctx.translate(translation.x, translation.y);
        zoomScale /= factor;
        ctx.scale(factor, factor);
        ctx.translate(-translation.x, -translation.y);
        //        if (zoomScale < 1.0)
        //            nodeSize = 10 * zoomScale;
        that.redraw();
    }
	
    // SOCKETS & KINECT
    var kActive = false;
    var kEvent = 'iddle';
    var kWasClicked = false;
    var kWasZooming = false;
    var kZoomStartSize = 0.0;
    // set kinect handler vars
    var kDragged = null;
    var kDragStart, kCanvasDragging = false;
	
    // browser suporta websockets?
    if (!window.WebSocket) {
        $("#serverStatus").html("Your browser does not support web sockets!");
        return;
    }

    // Initialize a new web socket.
    var socket = new WebSocket("ws://localhost:8181/KinectHtml5");

    // Connection established.
    socket.onopen = function () {
        $("#serverStatus").html("Conectado");
    };

    // Connection closed.
    socket.onclose = function () {
        $("#serverStatus").html("Conexão perdida");
    }

    // Receive data FROM the server!
    socket.onmessage = function (evt) {
        $("#serverStatus").html("Dados recebidos");

        //$("#dataReceived").html(evt.data);
        // Get the data in JSON format.
        eval( "kinectData = " + evt.data );
		
        kActive = ((kinectData.leftClick != 'undefined') && (kinectData.leftClick != null));
		
        if (kActive)
        {
            kEvent = 'iddle';
			
            var kinectLeftClick = (kinectData.leftClick == 1);
            $("#kinectLeft").attr('src', 'images/kinectLeft'+(kinectLeftClick ? 'Click' : 'Normal')+'.png');
            $("#kinectLeft").css('left', kinectData.leftHand.x+'px');
            $("#kinectLeft").css('top', kinectData.leftHand.y+'px');
            var kinectRightClick = (kinectData.rightClick == 1);
            $("#kinectRight").attr('src', 'images/kinectRight'+(kinectRightClick ? 'Click' : 'Normal')+'.png');
            $("#kinectRight").css('left', kinectData.rightHand.x+'px');
            $("#kinectRight").css('top', kinectData.rightHand.y+'px');
            if (kinectRightClick)
            {
                if (!kinectLeftClick)
                {
                    if (kWasClicked)
                    {
                        kEvent = 'dragged';
                    }
                    else
                    {
                        kEvent = 'clicked';
                        kWasClicked = true;
                    }
                    kWasZooming = false;
                }
                else
                {
                    if (!kWasZooming)
                    {
                        kEvent = 'zoomStart';
                        kWasZooming = true;
                        kWasClicked = false;
                    }
                    else
                    {
                        kEvent = 'zoom';
                    }
                }
            }
            else
            {
                if (kWasClicked)
                {
                    kEvent = 'dropped';
                    kWasClicked = false;
                }
                kWasZooming = false;
            }		

            eval( "that.kHandler." + kEvent + "()" );

            $("#leftClick").html(kinectLeftClick ? 'seleção' : 'navegação');
            $("#rightClick").html(kinectRightClick ? 'seleção' : 'navegação');
        }
    // Inform the server about the update.
    //socket.send("Skeleton updated on: " + (new Date()).toDateString() + ", " + (new Date()).toTimeString());
    };

    var that = {
        init:function(system){
            //
            // the particle system will call the init function once, right before the
            // first frame is to be drawn. it's a good place to set up the canvas and
            // to pass the canvas size to the particle system
            //
            // save a reference to the particle system for use in the .redraw() loop
            particleSystem = system

            // inform the system of the screen dimensions so it can map coords for us.
            // if the canvas is ever resized, screenSize should be called again with
            // the new dimensions
            particleSystem.screenSize(canvas.width, canvas.height) 
            particleSystem.screenPadding(20); // leave an extra 20px of whitespace per side

            // set up some event handlers to allow for node-dragging
            that.initMouseHandling();	
        },
        
        // Kinect Handler
        kHandler : {
            iddle:function() {
                if (desenhaTudo && kActive)
                {
                    $("#modeName").html("k_iddle");
                    var pos = $(canvas).offset();
                    _kinectP = arbor.Point(kinectData.rightHand.x-pos.left, kinectData.rightHand.y-pos.top);

                    var realMouseP = arbor.Point(kinectData.rightHand.x, kinectData.rightHand.y);
                    _kinectP.x = (_kinectP.x * zoomScale + zoomTranslation.x);
                    _kinectP.y = (_kinectP.y * zoomScale + zoomTranslation.y);

                    // funcionalidade da tooltip
                    var nearerNode = particleSystem.nearest(_kinectP);
                    if (nearerNode && nearerNode.node !== null)
                    {
                        var pt = particleSystem.toScreen(nearerNode.node.p);
                        // tooltip
                        if (((_kinectP.x > pt.x-nodeSize/2) && (_kinectP.x < pt.x+nodeSize/2))
                            && ((_kinectP.y > pt.y-nodeSize/2) && (_kinectP.y < pt.y+nodeSize/2))) 
                            {
                            //$(canvas).css('cursor', 'pointer');
                            showTooltip(nearerNode.node.data.realName, realMouseP, nodeSize, zoomScale);
                            showNodeSideInfo(nearerNode.node.name, nearerNode.node.data);
                        }
                        else
                        {
                            //$(canvas).css('cursor', 'move');
                            hideTooltip();
                            hideNodeSideInfo();
                        }
                    }

                    // atualiza valores para o zoom
                    kLastX = (kinectData.rightHand.x - canvas.offsetLeft);
                    kLastY = (kinectData.rightHand.y - canvas.offsetTop);
                    if (kDragged != null){
                        var pt2 = ctx.transformedPoint(kLastX, kLastY);
                        ctx.translate(pt2.x-kDragged.x,pt2.y-kDragged.y);
                    //redraw();
                    }
                }
            }, 
            clicked: function(){
                if (desenhaTudo && kActive)
                {
                    $("#modeName").html("k_clicked");
                    
                    if (kinectData.rightClick == 1)
                    {
                        var pos = arbor.Point(kinectData.rightHand.x, kinectData.rightHand.y);
                    }
                    else if ((kinectData.leftClick == 1))
                    {
                        var pos = arbor.Point(kinectData.leftHand.x, kinectData.leftHand.y);
                    }

                    if ((pos.x > 1010 && pos.x < 1040) && (pos.y > 0 && pos.y < 70))
                    {
                        window.location = './start/';
                    }
                    
                    pos = $(canvas).offset();
                    _kinectP = arbor.Point(kinectData.rightHand.x-pos.left, kinectData.rightHand.y-pos.top);
                    _kinectP.x = (_kinectP.x * zoomScale + zoomTranslation.x);
                    _kinectP.y = (_kinectP.y * zoomScale + zoomTranslation.y);

                    var nearerNode = particleSystem.nearest(_kinectP);
                    var pt = particleSystem.toScreen(nearerNode.node.p);
                    if ((nearerNode && nearerNode.node !== null)
                        && (((_kinectP.x > pt.x-nodeSize/2) && (_kinectP.x < pt.x+nodeSize/2))
                            && ((_kinectP.y > pt.y-nodeSize/2) && (_kinectP.y < pt.y+nodeSize/2)))) 
                            {
                        kDragged = nearerNode;

                        if (kDragged && kDragged.node !== null){
                            // while we're dragging, don't let physics move the node
                            kDragged.node.fixed = true
                        }
                    }
                    else
                    {
                        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
                        // atualiza valores para o zoom
                        kLastX = (kinectData.rightHand.x - canvas.offsetLeft);
                        kLastY = (kinectData.rightHand.y - canvas.offsetTop);
                        kDragged = ctx.transformedPoint(kLastX, kLastY);
                        kCanvasDragging = true;
                    }
                }
            },
            dragged: function(){
                if (desenhaTudo && kActive)
                {
                    $("#modeName").html("k_dragged");
                    if (!kCanvasDragging)
                    {
                        var pos = $(canvas).offset();
                        var s = arbor.Point(kinectData.rightHand.x-pos.left, kinectData.rightHand.y-pos.top);
                        s.x = (s.x * zoomScale + zoomTranslation.x);
                        s.y = (s.y * zoomScale + zoomTranslation.y);

                        if (kDragged && kDragged.node !== null){
                            var p = particleSystem.fromScreen(s);
                            kDragged.node.p = p;
                        }
                    }
                    else
                    {
                        // atualiza valores para o zoom
                        kLastX = (kinectData.rightHand.x - canvas.offsetLeft);
                        kLastY = (kinectData.rightHand.y - canvas.offsetTop);
                        //kCanvasDragging = false;
                        if (kDragged != null){
                            var pt = ctx.transformedPoint(kLastX, kLastY);
                            ctx.translate(pt.x-kDragged.x, pt.y-kDragged.y);
                            that.redraw();
                        }
                    }
                }
            },

            dropped: function(){
                if (desenhaTudo && kActive)
                {
                    $("#modeName").html("k_dropped");

                    kDragged = null;
                    //if (kCanvasDragging) zoom(e.shiftKey ? -1 : 1 );
                    kCanvasDragging = false;

                    _kinectP = null;

                    if (kDragged===null || kDragged.node===undefined) return false;
                    if (kDragged.node !== null) 
                    {
                        kDragged.node.fixed = false;
                        kDragged.node.tempMass = 1000;
                    }
                    kDragged = null;
                }
            },

            zoomStart: function(){
                if (desenhaTudo && kActive)
                {
                    var sizeA = kinectData.rightHand.x - kinectData.leftHand.x;
                    var sizeB = kinectData.rightHand.y - kinectData.leftHand.y;
                    kZoomStartSize = Math.sqrt( (sizeA*sizeA) + (sizeB*sizeB) );
                }
            },

            zoom: function() {
                if (desenhaTudo && kActive)
                {
                    var sizeA = kinectData.rightHand.x - kinectData.leftHand.x;
                    var sizeB = kinectData.rightHand.y - kinectData.leftHand.y;
                    var size = Math.sqrt( (sizeA*sizeA) + (sizeB*sizeB) );
                    var zoomFactor = (size /  kZoomStartSize);
                    kZoomStartSize = size;
                    
                    kZoom( zoomFactor );
                    
                    that.redraw();
                }
            }
        },

        redraw:function(){
            // 
            // redraw will be called repeatedly during the run whenever the node positions
            // change. the new positions for the nodes can be accessed by looking at the
            // .p attribute of a given node. however the p.x & p.y values are in the coordinates
            // of the particle system rather than the screen. you can either map them to
            // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
            // which allow you to step through the actual node objects but also pass an
            // x,y point in the screen's coordinate system
            // 
            ctx.fillStyle = "white";
            var p1 = ctx.transformedPoint(0,0);
            var p2 = ctx.transformedPoint(canvas.width,canvas.height);
            ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
            ctx.fillRect(0,0, canvas.width, canvas.height);
            zoomTranslation = p1;
			
            var energy = particleSystem.energy();

            $("#eMax").html(energy.max);
            $("#eMean").html(energy.mean);
            $("#zoomScale").html(1.0/zoomScale);

            if (energy.mean < 10.0)
            {
                desenhaTudo = true;
                $("#div_loading").hide();
            }
            if (energy.mean < 5.0)
            {
                particleSystem.stop();
            }

            particleSystem.eachEdge(function(edge, pt1, pt2){
                // edge: {source:Node, target:Node, length:#, data:{}}
                // pt1:  {x:#, y:#}  source position in screen coords
                // pt2:  {x:#, y:#}  target position in screen coords

                if (desenhaTudo)
                {
                    // draw a line from pt1 to pt2
                    if (edge.data.type == 1)
                        ctx.strokeStyle = "rgba(0,0,0, .333)";
                    else    
                        ctx.strokeStyle = "rgba(120,120,0, .555)";
                    if (edge.data.active == 1)
                    {
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(pt1.x, pt1.y);
                        ctx.lineTo(pt2.x, pt2.y);
                        ctx.stroke();
                    }
                    else
                    {
                        ctx.dashedLine(pt1.x, pt1.y, pt2.x, pt2.y); 
                    }
                }
            })

            particleSystem.eachNode(function(node, pt){
                // node: {mass:#, p:{x,y}, name:"", data:{}}
                // pt:   {x:#, y:#}  node position in screen coords

                if (desenhaTudo)
                {
                    // red for ufrgs, blue for other
                    if (node.data.myself)
                        ctx.fillStyle = '#0a0';
                    else if (node.data.type == 'UFRGS')
                        ctx.fillStyle = '#c00';
                    else
                        ctx.fillStyle = '#00c';

                    // circle for women, square for men
                    if (node.data.sex == 'F')
                    {   // draw a circle centered at pt
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, nodeSize/2+(nodeSize/10), 0, Math.PI*2, false);
                        ctx.fill();
                        if (node.data.courseLevel == 1)
                        {
                            ctx.fillStyle = '#fff';
                            ctx.beginPath();
                            ctx.arc(pt.x, pt.y, (nodeSize/2+(nodeSize/10))/2, 0, Math.PI*2, false);
                            ctx.fill();
                        }
                    }
                    else
                    {   // draw a rectangle centered at pt
                        ctx.fillRect(pt.x-nodeSize/2, pt.y-nodeSize/2, nodeSize, nodeSize);
                        if (node.data.courseLevel == 1)
                        {
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(pt.x-nodeSize/4, pt.y-nodeSize/4, nodeSize/2, nodeSize/2);
                        }
                    }
                }
            });
        },

        initMouseHandling:function(){
            // no-nonsense drag and drop (thanks springy.js)
            var dragged = null;
            var dragStart, canvasDragging = false;

            // set up a handler object that will initially listen for mousedowns then
            // for moves and mouseups while dragging
            var handler = {
                iddle:function(e) {
                    if (desenhaTudo)
                    {
                        $("#modeName").html("iddle");
                        var pos = $(canvas).offset();
                        _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);

                        var realMouseP = arbor.Point(e.pageX, e.pageY);
                        _mouseP.x = (_mouseP.x * zoomScale + zoomTranslation.x);
                        _mouseP.y = (_mouseP.y * zoomScale + zoomTranslation.y);

                        // funcionalidade da tooltip
                        var nearerNode = particleSystem.nearest(_mouseP);
                        if (nearerNode && nearerNode.node !== null)
                        {
                            var pt = particleSystem.toScreen(nearerNode.node.p);
                            // tooltip
                            if (((_mouseP.x > pt.x-nodeSize/2) && (_mouseP.x < pt.x+nodeSize/2))
                                && ((_mouseP.y > pt.y-nodeSize/2) && (_mouseP.y < pt.y+nodeSize/2))) 
                                {
                                $(canvas).css('cursor', 'pointer');
                                showTooltip(nearerNode.node.data.realName, realMouseP, nodeSize, zoomScale);
                                showNodeSideInfo(nearerNode.node.name, nearerNode.node.data);
                            }
                            else
                            {
                                $(canvas).css('cursor', 'move');
                                hideTooltip();
                                hideNodeSideInfo();
                            }
                        }

                        // atualiza valores para o zoom
                        lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
                        lastY = e.offsetY || (e.pageY - canvas.offsetTop);
                        if (dragStart != null){
                            var pt2 = ctx.transformedPoint(lastX,lastY);
                            ctx.translate(pt2.x-dragStart.x,pt2.y-dragStart.y);
                        //redraw();
                        }
                    }
                }, 
                clicked:function(e){
                    if (desenhaTudo)
                    {
                        $("#modeName").html("clicked");
                        var pos = $(canvas).offset();
                        _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
                        _mouseP.x = (_mouseP.x * zoomScale + zoomTranslation.x);
                        _mouseP.y = (_mouseP.y * zoomScale + zoomTranslation.y);

                        var nearerNode = particleSystem.nearest(_mouseP);
                        var pt = particleSystem.toScreen(nearerNode.node.p);
                        if ((nearerNode && nearerNode.node !== null)
                            && (((_mouseP.x > pt.x-nodeSize/2) && (_mouseP.x < pt.x+nodeSize/2))
                                && ((_mouseP.y > pt.y-nodeSize/2) && (_mouseP.y < pt.y+nodeSize/2)))) 
                                {
                            dragged = nearerNode;

                            if (dragged && dragged.node !== null){
                                // while we're dragging, don't let physics move the node
                                dragged.node.fixed = true
                            }
                        }
                        else
                        {
                            document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
                            // atualiza valores para o zoom
                            lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
                            lastY = e.offsetY || (e.pageY - canvas.offsetTop);
                            dragStart = ctx.transformedPoint(lastX, lastY);
                            canvasDragging = true;
                        }

                        $(canvas).unbind('mousemove', handler.iddle);
                        $(canvas).bind('mousemove', handler.dragged);
                        $(window).bind('mouseup', handler.dropped);
                    }
                    return false;
                },
                dragged:function(e){
                    if (desenhaTudo)
                    {
                        $("#modeName").html("dragged");
                        if (!canvasDragging)
                        {
                            var pos = $(canvas).offset();
                            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
                            s.x = (s.x * zoomScale + zoomTranslation.x);
                            s.y = (s.y * zoomScale + zoomTranslation.y);

                            if (dragged && dragged.node !== null){
                                var p = particleSystem.fromScreen(s);
                                dragged.node.p = p;
                            }
                        }
                        else
                        {
                            // atualiza valores para o zoom
                            lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
                            lastY = e.offsetY || (e.pageY - canvas.offsetTop);
                            //canvasDragging = false;
                            if (dragStart != null){
                                var pt = ctx.transformedPoint(lastX, lastY);
                                ctx.translate(pt.x-dragStart.x, pt.y-dragStart.y);
                                that.redraw();
                            }
                        }
                    }
                    return false;
                },

                dropped:function(e){
                    if (desenhaTudo)
                    {
                        $("#modeName").html("dropped");

                        dragStart = null;
                        //if (canvasDragging) zoom(e.shiftKey ? -1 : 1 );
                        canvasDragging = false;

                        $(canvas).unbind('mousemove', handler.dragged);
                        $(window).unbind('mouseup', handler.dropped);
                        $(canvas).bind('mousemove', handler.iddle);
                        _mouseP = null;

                        if (dragged===null || dragged.node===undefined) return false;
                        if (dragged.node !== null) 
                        {
                            dragged.node.fixed = false;
                            dragged.node.tempMass = 1000;
                        }
                        dragged = null;
                    }
                    return false;
                },
                
                handleScroll:function(e){
                    if (desenhaTudo)
                    {
                        var delta = e.wheelDelta ? e.wheelDelta/40 : (e.detail ? -e.detail : 0);
                        if (!delta) delta = e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta/40 : (e.originalEvent.detail ? -e.originalEvent.detail : 0);
                        if (delta) zoom(delta);
                    }
                    return false;
                }
            }

            // start listening
            $(canvas).mousedown(handler.clicked);
            $(canvas).bind('mousemove', handler.iddle);
            $(canvas).bind('mousewheel', handler.handleScroll);
            $(canvas).bind('DOMMouseScroll', handler.handleScroll);
        }

    }
    return that;
}    

// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
function trackTransforms(ctx){
    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function(){
        return xform;
    };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function(){
        savedTransforms.push(xform.translate(0,0));
        return save.call(ctx);
    };
    var restore = ctx.restore;
    ctx.restore = function(){
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function(sx,sy){
        xform = xform.scaleNonUniform(sx,sy);
        return scale.call(ctx,sx,sy);
    };
    var rotate = ctx.rotate;
    ctx.rotate = function(radians){
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(ctx,radians);
    };
    var translate = ctx.translate;
    ctx.translate = function(dx,dy){
        xform = xform.translate(dx,dy);
        return translate.call(ctx,dx,dy);
    };
    var transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
        var m2 = svg.createSVGMatrix();
        m2.a=a;
        m2.b=b;
        m2.c=c;
        m2.d=d;
        m2.e=e;
        m2.f=f;
        xform = xform.multiply(m2);
        return transform.call(ctx,a,b,c,d,e,f);
    };
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a,b,c,d,e,f){
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx,a,b,c,d,e,f);
    };
    var pt  = svg.createSVGPoint();
    ctx.transformedPoint = function(x,y){
        pt.x=x;
        pt.y=y;
        return pt.matrixTransform(xform.inverse());
    }
}

function showTooltip(info, pos, height, zoomScale)
{
    if (!zoomScale || (zoomScale > 1.0)) zoomScale = 1;
    if (zoomScale < 0.25) zoomScale = 0.25;
    
    $("#mainTooltip").html(info);
    $("#mainTooltip").css('top', (pos.y-20-$("#mainTooltip").height())+'px');
    $("#mainTooltip").css('left', (pos.x-($("#mainTooltip").width()/2))+'px');
    $("#mainTooltip").css('display', '');
    $("#mainTooltip").css('font-size', parseInt(12.0/zoomScale)+'px');
}

function hideTooltip()
{
    $("#mainTooltip").css('display', 'none'); 
}

function showNodeSideInfo(code, data)
{
    var info = '';
    info += '<strong>Nome:</strong> ' + data.realName + '<br/>';
    info += '<strong>Cartão:</strong> ' + code + '<br/>';
    info += '<strong>Atividades na UFRGS:</strong> <br/>' + data.activities;
    $("#nodeInfo").html(info);
    $("#nodeInfo").css('display', '');
}

function hideNodeSideInfo()
{
    $("#nodeInfo").css('display', 'none'); 
}
