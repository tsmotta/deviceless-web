
var Point = function(a,b)
{
    if (a && a.hasOwnProperty("y"))
    {
        b = a.y;
        a = a.x
    }
    
    return {x: a, y: b};
};

// GLOBALS
// CANVAS
var canvas; // = document.getElementsByTagName('canvas')[0];
var ctx; // = canvas.getContext("2d");
//trackTransforms(ctx);
var mapImage = new Image();
mapImage.src = './img/mapaGabinetes.png';

// MOUSE
var _mouseP = Point(0,0);
var zoomTranslation = Point(0,0);
var zoomScale = 1;
var lastX; // = canvas.width/2, lastY = canvas.height/2;
var lastY;
var scaleFactor = 1.1;
var dragged = -1;
var dragStart, canvasDragging = false;

// KINECT
var kinectData = "";
var _kinectP = Point(0,0);
var kActive = false;
var kUsed = false;
var kEvent = 'iddle';
var LEFT = 1;
var RIGHT = 2;
var kWasClicked = false;
var kWasZooming = false;
var kZoomStartSize = 0.0;
// set kinect handler vars
var kDragged = -1;
var kDraggingWith = 0;
var kDragStart, kDraggingAll = false;
var kLastX; // = canvas.width/2, 
var kLastY; // = canvas.height/2;

// ZOOM
function zoom(factor)
{
    var translation = ctx.transformedPoint(lastX, lastY);
    ctx.translate(translation.x, translation.y);
    factor = Math.pow(scaleFactor, factor);
    zoomScale /= factor;
    ctx.scale(factor, factor);
    ctx.translate(-translation.x, -translation.y);
    redraw();
}
function kZoom(factor)
{
    var translation = ctx.transformedPoint(kLastX, kLastY);
    ctx.translate(translation.x, translation.y);
    zoomScale /= factor;
    ctx.scale(factor, factor);
    ctx.translate(-translation.x, -translation.y);
    redraw();
}

$(document).ready(function()
{
    canvas = document.getElementsByTagName('canvas')[0];
    ctx = canvas.getContext("2d");
    trackTransforms(ctx);
    
    lastX = canvas.width/2, lastY = canvas.height/2;
    kLastX = canvas.width/2, kLastY = canvas.height/2;

    // browser suporta websockets?
    if (!window.WebSocket) {
        status.innerHTML = "Your browser does not support web sockets!";
        return;
    }
    
    startSystem();
});

function startSystem()
{
    // Initialize a new web socket.
    var socket = new WebSocket("ws://localhost:8181/Kinect");

    // Connection established.
    socket.onopen = function () {
        $("#serverStatus").html("Conectado");
    };

    // Connection closed.
    socket.onclose = function () {
        $("#serverStatus").html("Conexão perdida");
    };

    // Receive data FROM the server!
    socket.onmessage = function (evt) 
    {
        $("#serverStatus").html("Dados recebidos");
        
        handleKinect(evt.data);
        
        // Inform the server about the update.
        //socket.send("Skeleton updated on: " + (new Date()).toDateString() + ", " + (new Date()).toTimeString());
    }
    
    if ($("#serverStatus").html() != "Conectado")
    {
        initMouseHandling();
        
        $("#kinectLeft").hide();
        $("#kinectRight").hide();
    }
    
    redraw();
}    

function handleKinect(data)
{
    // Get the data in JSON format.
    eval( "kinectData = " + data );

    kActive = ((kinectData.leftClick != 'undefined') && (kinectData.leftClick != null));

    var kHandler = {
        iddle:function() {
            $("#modeName").html("k_iddle");

            // atualiza valores para o zoom
            kLastX = (kinectData.rightHand.x + kinectData.leftHand.x) / 2.0;
            kLastY = (kinectData.rightHand.y + kinectData.leftHand.y) / 2.0;
            
            if (kDragStart != null){
                var pt2 = ctx.transformedPoint(kLastX,kLastY);
                ctx.translate(pt2.x-kDragStart.x,pt2.y-kDragStart.y);
            }

            redraw();
        }, 
        clicked: function(){
            $("#modeName").html("k_clicked");

            // ???document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
            // atualiza valores para o zoom
            kLastX = (kinectData.rightHand.x + kinectData.leftHand.x) / 2.0;
            kLastY = (kinectData.rightHand.y + kinectData.leftHand.y) / 2.0;
            
            kDraggingWith = (kinectData.rightClick == 1 ? RIGHT : LEFT);
            
            if (kinectData.rightClick == 1)
            {
                var pos = Point(kinectData.rightHand.x, kinectData.rightHand.y);
            }
            else if ((kinectData.leftClick == 1))
            {
                var pos = Point(kinectData.leftHand.x, kinectData.leftHand.y);
            }
            
            if ((pos.x > 1010 && pos.x < 1040) && (pos.y > 0 && pos.y < 70))
            {
                window.location = '../start/';
            }
            
            //kDragged = p;
            //kDragStart = ctx.transformedPoint(kLastX, kLastY);
            if (kDraggingWith == RIGHT)
                kDragStart = ctx.transformedPoint(kinectData.rightHand.x, kinectData.rightHand.y);
            else if (kDraggingWith == LEFT)
                kDragStart = ctx.transformedPoint(kinectData.leftHand.x, kinectData.leftHand.y);
            kDraggingAll = true;

        },
        dragged: function(){
            $("#modeName").html("k_dragged");

            // atualiza valores para o zoom
            kLastX = (kinectData.rightHand.x + kinectData.leftHand.x) / 2.0;
            kLastY = (kinectData.rightHand.y + kinectData.leftHand.y) / 2.0;
            
            if (kDragStart != null){
                if (kDraggingWith == RIGHT)
                    var pt = ctx.transformedPoint(kinectData.rightHand.x, kinectData.rightHand.y);
                else if (kDraggingWith == LEFT)
                    var pt = ctx.transformedPoint(kinectData.leftHand.x, kinectData.leftHand.y);
                //var pt = ctx.transformedPoint(kLastX, kLastY);
                ctx.translate(pt.x-kDragStart.x, pt.y-kDragStart.y);
            }
            
            redraw();
        },

        dropped: function(){
            $("#modeName").html("k_dropped");

            kDragStart = null;
            kDragged = -1;
            kDraggingWith = 0;
            kDraggingAll = false;
        },

        zoomStart: function(){
            var sizeA = kinectData.rightHand.x - kinectData.leftHand.x;
            var sizeB = kinectData.rightHand.y - kinectData.leftHand.y;
            kZoomStartSize = Math.sqrt( (sizeA*sizeA) + (sizeB*sizeB) );
        },

        zoom: function() {
            var sizeA = kinectData.rightHand.x - kinectData.leftHand.x;
            var sizeB = kinectData.rightHand.y - kinectData.leftHand.y;
            var size = Math.sqrt( (sizeA*sizeA) + (sizeB*sizeB) );
            var zoomFactor = (size /  kZoomStartSize);
            kZoomStartSize = size;

            kZoom( zoomFactor );
        }
    }

    if (kActive)
    {
        kEvent = 'iddle';
        
        if (!kUsed)
            window.setTimeout(function() {$("#imgHelp").hide(); kUsed = true; }, 9000);
        
        $("#kinectLeft").show();
        $("#kinectRight").show();
        
        redraw();

        if (kUsed)
        {
            var kinectLeftClick = (kinectData.leftClick == 1);
            $("#kinectLeft").attr('src', '../images/kinectLeft'+(kinectLeftClick ? 'Click' : 'Normal')+'.png');
            $("#kinectLeft").css('left', kinectData.leftHand.x-24+'px');
            $("#kinectLeft").css('top', kinectData.leftHand.y+'px');
            var kinectRightClick = (kinectData.rightClick == 1);
            $("#kinectRight").attr('src', '../images/kinectRight'+(kinectRightClick ? 'Click' : 'Normal')+'.png');
            $("#kinectRight").css('left', kinectData.rightHand.x+'px');
            $("#kinectRight").css('top', kinectData.rightHand.y+'px');

            if (kinectRightClick)
            {
                if (!kinectLeftClick)
                {
                    if (kWasClicked == RIGHT)
                    {
                        kEvent = 'dragged';
                    }
                    else
                    {
                        kEvent = 'clicked';
                        kWasClicked = RIGHT;
                    }
                    kWasZooming = false;
                }
                else
                {
                    if (!kWasZooming)
                    {
                        kEvent = 'zoomStart';
                        kWasZooming = true;
                        kWasClicked = 0;
                    }
                    else
                    {
                        kEvent = 'zoom';
                    }
                }
            }
            else if (kinectLeftClick)
            {
                if (kWasClicked == LEFT)
                {
                    kEvent = 'dragged';
                }
                else
                {
                    kEvent = 'clicked';
                    kWasClicked = LEFT;
                }
                kWasZooming = false;
            }

            if (!kinectLeftClick && !kinectRightClick)
            {
                if (kWasClicked != 0)
                {
                    kEvent = 'dropped';
                    kWasClicked = 0;
                }
                kWasZooming = false;
            }		

            eval( "kHandler." + kEvent + "()" );
        }
    }
    else if (kUsed)
        window.location.reload(false);
}

function drawSkelleton()
{
    var pos = $(canvas).offset();
    
    ctx.fillStyle = "rgba(100, 0, 0, .222)";
    ctx.beginPath();
    ctx.arc((kinectData.head.x-pos.left) * zoomScale + zoomTranslation.x, (kinectData.head.y-pos.top) * zoomScale + zoomTranslation.y, 40 * zoomScale, 0, Math.PI*2, false);
    ctx.fill();
    
    drawLine(kinectData.leftShoulder, kinectData.rightShoulder);
    drawLine(kinectData.leftShoulder, kinectData.leftElbow);
    drawLine(kinectData.leftElbow, kinectData.leftHand);
    drawLine(kinectData.rightShoulder, kinectData.rightElbow);
    drawLine(kinectData.rightElbow, kinectData.rightHand);
    drawLine(kinectData.leftShoulder, kinectData.rightHip);
    drawLine(kinectData.rightShoulder, kinectData.leftHip);
    drawLine(kinectData.leftHip, kinectData.rightHip);
    drawLine(kinectData.leftHip, kinectData.leftAnkle);
    drawLine(kinectData.rightHip, kinectData.rightAnkle);

}

function drawLine(pt1, pt2)
{
    var pos = $(canvas).offset();
    ctx.strokeStyle = "rgba(100, 0, 0, .222)";
    ctx.lineWidth = 4 * zoomScale;
    ctx.beginPath();
    ctx.moveTo((pt1.x-pos.left) * zoomScale + zoomTranslation.x, (pt1.y-pos.top) * zoomScale + zoomTranslation.y);
    ctx.lineTo((pt2.x-pos.left) * zoomScale + zoomTranslation.x, (pt2.y-pos.top) * zoomScale + zoomTranslation.y);
    ctx.stroke();
}

// MOUSE CONTROL
function initMouseHandling()
{ 
    // set up a handler object that will initially listen for mousedowns then
    // for moves and mouseups while dragging
    var handler = {
        iddle:function(e) {
            $("#modeName").html("iddle");
            
            // atualiza valores para o zoom
            lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
            lastY = e.offsetY || (e.pageY - canvas.offsetTop);
            
            if (dragStart != null){
                var pt2 = ctx.transformedPoint(lastX,lastY);
                ctx.translate(pt2.x-dragStart.x,pt2.y-dragStart.y);
            }
            
            redraw();
        }, 
        clicked:function(e){
            $("#modeName").html("clicked");

            document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
            // atualiza valores para o zoom
            lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
            lastY = e.offsetY || (e.pageY - canvas.offsetTop);
            dragStart = ctx.transformedPoint(lastX, lastY);
            canvasDragging = true;

            $(canvas).unbind('mousemove', handler.iddle);
            $(canvas).bind('mousemove', handler.dragged);
            $(window).bind('mouseup', handler.dropped);
            return false;
        },
        dragged:function(e){
            $("#modeName").html("dragged");

            // atualiza valores para o zoom
            lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
            lastY = e.offsetY || (e.pageY - canvas.offsetTop);
            //canvasDragging = false;
            if (dragStart != null){
                var pt = ctx.transformedPoint(lastX, lastY);
                ctx.translate(pt.x-dragStart.x, pt.y-dragStart.y);
            }
            
            redraw();
            return false;
        },

        dropped:function(e){
            $("#modeName").html("dropped");

            dragStart = null;
            //if (canvasDragging) zoom(e.shiftKey ? -1 : 1 );
            canvasDragging = false;

            $(canvas).unbind('mousemove', handler.dragged);
            $(window).unbind('mouseup', handler.dropped);
            $(canvas).bind('mousemove', handler.iddle);
            _mouseP = null;

            if (dragged==-1) return false;            
            dragged = -1;
            return false;
        },

        handleScroll:function(e){
            $("#modeName").html("zoom");
            
            var delta = e.wheelDelta ? e.wheelDelta/40 : (e.detail ? -e.detail : 0);
            if (!delta) delta = e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta/40 : (e.originalEvent.detail ? -e.originalEvent.detail : 0);
            if (delta) zoom(delta);
            return false;
        }
    }

    // start listening
    $(canvas).mousedown(handler.clicked);
    $(canvas).bind('mousemove', handler.iddle);
    $(canvas).bind('mousewheel', handler.handleScroll);
    $(canvas).bind('DOMMouseScroll', handler.handleScroll);
}

// DRAW
function redraw()
{
    ctx.fillStyle = "white";
    var p1 = ctx.transformedPoint(0,0);
    var p2 = ctx.transformedPoint(canvas.width, canvas.height);
    ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
    ctx.fillRect(0,0, canvas.width, canvas.height);
    zoomTranslation = p1;

    ctx.drawImage(mapImage, 112, -2267);

    if (kActive)
        drawSkelleton();
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

function showTooltip(info, pos, height)
{
    $("#mainTooltip").html(info);
    $("#mainTooltip").css('top', (pos.y-20-$("#mainTooltip").height())+'px');
    $("#mainTooltip").css('left', (pos.x-($("#mainTooltip").width()/2))+'px');
    $("#mainTooltip").css('display', '');
}

function hideTooltip()
{
    $("#mainTooltip").css('display', 'none'); 
}
