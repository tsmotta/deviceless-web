
// LOG
var textLog;
/***********************
 * 
 * CABECALHO:
 * CodAcao, MaoAcao, DiaAcao, HoraAcao, CountTamanho, CountPosicao, CountEstado, NrQuadrados, QuadradoSelecionar, QuadradoPosicionar, QuadradoDestino
 * 
 * CODIGOS:
 * 1 - Inicio
 * 2 - Pan
 * 3 - Zoon in
 * 4 - Zoon out
 * 5 - Clique sobre quadrado certo
 * 6 - Clique sobre quadrado errado
 * 7 - Clique em vazio
 * 8 - Largar quadrado
 * 9 - Posicionamento correto do quadrado
 * 10 - Fim
 * 11 - Reset Test
 * 12 - Reset State
 * 13 - Skip Test to Positioning
 * 
 **********************/

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

// DRAWING
var INI_SIZE = 200;
var INI_COUNT = 5;
var squareSize = INI_SIZE;
var squareStep = 2;
var stateSize = 4; 
var stateCount = INI_COUNT;
var statePosition = 3;
var positioningMargin = 0.1;
var squareArray;
var BLUE = '#08c';
var GREEN = '#0c8';
var RED = '#c88';
var DARK_RED = '#800';
var BLACK = '#000';
var WHITE = '#fff';

// INTERACTING
var MOUSE = 1;
var KINECT = 2;
var squareToClick = -1;
var squareToMove = -1;
var squareDestination = -1;
var lastOver = -1;
var lastOverColor = '';
var lastOverLeft = -1;
var lastOverLeftColor = '';
var correctSquarePosition = Point(0,0);
var translationTrace = Point(0, 0);

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
var kEvent = 'iddle';
var LEFT = 'E';
var RIGHT = 'D';
var kWasClicked = false;
var kWasZooming = false;
var kZoomStartSize = 0.0;
// set kinect handler vars
var kDragged = -1;
var kDraggingWith;
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
    hideTooltip();

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
    
    textLog = 'CodAcao; MaoAcao; DiaAcao; HoraAcao; CountTamanho; CountPosicao; CountEstado; NrQuadrados; QuadradoSelecionar; QuadradoPosicionar; QuadradoDestino';
    
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
    
    prepareSquareArray();
    redraw();
    addLog(1);
}    

function handleKinect(data)
{
    // Get the data in JSON format.
    eval( "kinectData = " + data );

    kActive = ((kinectData.leftClick != 'undefined') && (kinectData.leftClick != null));

    var kHandler = {
        iddle:function() {
            $("#modeName").html("k_iddle");

            var pos = $(canvas).offset();
            _kinectP = Point(kinectData.rightHand.x-pos.left, kinectData.rightHand.y-pos.top);
            _kinectP2 = Point(kinectData.leftHand.x-pos.left, kinectData.leftHand.y-pos.top);

            _kinectP.x = (_kinectP.x * zoomScale + zoomTranslation.x);
            _kinectP.y = (_kinectP.y * zoomScale + zoomTranslation.y); 
            _kinectP2.x = (_kinectP2.x * zoomScale + zoomTranslation.x);
            _kinectP2.y = (_kinectP2.y * zoomScale + zoomTranslation.y); 

            iddle(_kinectP, RIGHT);
            iddle(_kinectP2, LEFT);

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
            var pos = $(canvas).offset();
            _kinectP = Point(kinectData.rightHand.x-pos.left, kinectData.rightHand.y-pos.top);
            _kinectP2 = Point(kinectData.leftHand.x-pos.left, kinectData.leftHand.y-pos.top);

            _kinectP.x = (_kinectP.x * zoomScale + zoomTranslation.x);
            _kinectP.y = (_kinectP.y * zoomScale + zoomTranslation.y); 
            _kinectP2.x = (_kinectP2.x * zoomScale + zoomTranslation.x);
            _kinectP2.y = (_kinectP2.y * zoomScale + zoomTranslation.y);

            var overR = isOverSquare(_kinectP.x, _kinectP.y);
            var overL = isOverSquare(_kinectP2.x, _kinectP2.y);
            
            kDraggingWith = (kinectData.rightClick == 1 ? RIGHT : LEFT);
            
            // clicou sobre um quadrado?
            if ((overR != -1) && (overR == squareToClick || overR == squareToMove))
            {
                correctSquarePosition = _kinectP;
                clickSquare(overR, KINECT);
            }
            else if ((overL != -1) && (overL == squareToClick || overL == squareToMove))
            {
                correctSquarePosition = _kinectP2;
                clickSquare(overL, KINECT);
            }
            else
            {
                if ((overR != -1) || (overL != -1))
                    addLog(6, kDraggingWith); // click on wrong square
                else
                    addLog(7, kDraggingWith); // click on void area
                
                // ???document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
                // atualiza valores para o zoom
                kLastX = (kinectData.rightHand.x + kinectData.leftHand.x) / 2.0;
                kLastY = (kinectData.rightHand.y + kinectData.leftHand.y) / 2.0;
                //kDragged = p;
                
                if (kDraggingWith == RIGHT)
                    kDragStart = ctx.transformedPoint(kinectData.rightHand.x, kinectData.rightHand.y);
                else if (kDraggingWith == LEFT)
                    kDragStart = ctx.transformedPoint(kinectData.leftHand.x, kinectData.leftHand.y);
                kDraggingAll = true;
            }

        },
        dragged: function(){
            $("#modeName").html("k_dragged");
            if (!kDraggingAll)
            {
                //var p = Point(kinectData.rightHand.x, kinectData.rightHand.y);
                var pos = $(canvas).offset();
                
                var s;
                if (kDraggingWith == RIGHT)
                    s = Point(kinectData.rightHand.x-pos.left, kinectData.rightHand.y-pos.top);
                else if (kDraggingWith == LEFT)
                    s = Point(kinectData.leftHand.x-pos.left, kinectData.leftHand.y-pos.top);
                
                s.x = (s.x * zoomScale + zoomTranslation.x);
                s.y = (s.y * zoomScale + zoomTranslation.y);

                // esta movimentando um quadrado
                if (kDragged != -1)
                {
                    dragSquare(kDragged, s);
                }
            }
            else
            {
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
            }
            redraw();
        },

        dropped: function(){
            $("#modeName").html("k_dropped");

            if (kDraggingAll)
                addLog(2, kDraggingWith); // pan
            else if (stateSize <= 0)
                addLog(8, kDraggingWith); // drop square
            
            kDragStart = null;
            kDragged = -1;
            kDraggingWith = false;
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
            
            if (zoomFactor > 1)
                addLog(3); // zoom in
            else
                addLog(4); // zoom out
        }
    }

    if (kActive)
    {
        kEvent = 'iddle';
        
        $("#kinectLeft").show();
        $("#kinectRight").show();
        
        drawSkelleton(kinectData);
        
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

function drawSkelleton()
{
    var pos = $(canvas).offset();
    
    ctx.fillStyle = "rgba(0, 0, 0, .333)";
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
    ctx.strokeStyle = "rgba(0, 0, 0, .333)";
    ctx.lineWidth = 4;
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
            
            var pos = $(canvas).offset();
            _mouseP = Point(e.pageX-pos.left, e.pageY-pos.top);

            _mouseP.x = (_mouseP.x * zoomScale + zoomTranslation.x);
            _mouseP.y = (_mouseP.y * zoomScale + zoomTranslation.y);
            
            iddle(_mouseP);

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
            var pos = $(canvas).offset();
            _mouseP = Point(e.pageX-pos.left, e.pageY-pos.top);
            _mouseP.x = (_mouseP.x * zoomScale + zoomTranslation.x);
            _mouseP.y = (_mouseP.y * zoomScale + zoomTranslation.y);

            correctSquarePosition = _mouseP;
            var over = isOverSquare(_mouseP.x, _mouseP.y);

            // clicou sobre um quadrado?
            if (over != -1)
            {
                clickSquare(over, MOUSE);
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
            return false;
        },
        dragged:function(e){
            $("#modeName").html("dragged");
            if (!canvasDragging)
            {
                var pos = $(canvas).offset();
                var s = Point(e.pageX-pos.left, e.pageY-pos.top);
                s.x = (s.x * zoomScale + zoomTranslation.x);
                s.y = (s.y * zoomScale + zoomTranslation.y);

                // esta movimentando um quadrado
                if (dragged != -1)
                {
                    dragSquare(dragged, s);
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
                }
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

// ACOES

function iddle(posicao, kHand)
{
    var over = isOverSquare(posicao.x, posicao.y);

    // funcionalidade da tooltip
    if (!kHand || kHand == RIGHT)
    {
        if (lastOver != -1 && squareArray[lastOver])
            squareArray[lastOver].color = lastOverColor;

        if (over != -1)
        {
            lastOver = over;
            lastOverColor = squareArray[over].color;
        }
    }
    else if (kHand && kHand == LEFT)
    {
        if (lastOverLeft != -1 && squareArray[lastOverLeft])
            squareArray[lastOverLeft].color = lastOverLeftColor;

        if (over != -1)
        {
            lastOverLeft = over;
            lastOverLeftColor = squareArray[over].color;
        }
    }
    
    if (over != -1)
    {
        $(canvas).css('cursor', 'pointer');
        //showTooltip(nearerNode.node.data.realName, realMouseP, nodeSize);
        squareArray[over].color = RED;
    }
    else
    {
        $(canvas).css('cursor', 'move');
        //hideTooltip();
    }
}

function clickSquare(over, type)
{
    // clicou sobre um quadrado?
    if (over != -1)
    {
        addLog(5, kDraggingWith); // click on right square
        
        if (stateSize > 0)
        {
            // está na fase de selecao e clicou sobre o quadrado certo
            if (over == squareToClick)
            {
                lastOverColor = BLUE;
                lastOverLeftColor = BLUE;
                stateCount--;
                if (stateCount <= 0)
                {
                    stateCount = INI_COUNT;
                    stateSize--;
                    if (stateSize > 0)
                        squareSize /= squareStep;
                    else
                    {
                        squareSize = INI_SIZE;
                        var translation = ctx.transformedPoint(canvas.width/2, canvas.height/2);
                        ctx.translate(translation.x, translation.y);
                        ctx.scale(zoomScale, zoomScale);
                        ctx.translate(-translation.x, -translation.y);
                        ctx.translate(-translationTrace.x, -translationTrace.y);
                        zoomScale = 1;
                        translationTrace = Point(0, 0);
                        reset();
                    }
                }
                prepareSquareArray();
            }
        }
        else
        {
            // esta na fase de movimentacao e clicou sobre o quadrado certo
            if (over == squareToMove)
            {
                if (type == MOUSE)
                    dragged = over;
                else if (type == KINECT)
                    kDragged = over;
                
                correctSquarePosition.x -= squareArray[over].x;
                correctSquarePosition.y -= squareArray[over].y;
            }
        }
    }
}

function dragSquare(dragging, position)
{
    squareArray[dragging].color = DARK_RED;
    squareArray[dragging].x = position.x - correctSquarePosition.x;
    squareArray[dragging].y = position.y - correctSquarePosition.y;

    // chegou no destino
    if ((dragging == squareToMove)
        && analisePosition(squareToMove, squareDestination))
    {
        addLog(9, kDraggingWith); // square positioned
        
        reset();
        dragged = -1;
        stateCount--;
        if (stateCount <= 0)
        {
            stateCount = INI_COUNT;
            statePosition--;
            if (statePosition > 0)
                squareSize /= squareStep;
            else
            {
                //reset();
                $("#endTest").show();
                saveLog();
            }
        }
        prepareSquareArray();
    }
}

// DRAW
function redraw()
{
    ctx.fillStyle = "white";
    var p1 = ctx.transformedPoint(0,0);
    var p2 = ctx.transformedPoint(canvas.width,canvas.height);
    ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
    ctx.fillRect(0,0, canvas.width, canvas.height);
    zoomTranslation = p1;

    if (kActive)
        drawSkelleton();

    if (stateSize > 0)
    {
        for (i = 0; i < squareArray.length; i++)
        {
            ctx.fillStyle = squareArray[i].color;
            ctx.fillRect(squareArray[i].x, squareArray[i].y, squareSize, squareSize);
        }
    }
    else if (statePosition > 0)
    {
        // square to move
        ctx.fillStyle = squareArray[squareToMove].color;
        ctx.fillRect(squareArray[squareToMove].x, squareArray[squareToMove].y, squareSize, squareSize);
        // destination
        ctx.strokeStyle = squareArray[squareDestination].color;
        ctx.strokeRect(squareArray[squareDestination].x, squareArray[squareDestination].y, squareSize+squareSize*positioningMargin, squareSize+squareSize*positioningMargin);
    }
}

function prepareSquareArray()
{
    squareArray = Array();
    var i, j;
    
    for (i = 0; i < (canvas.width / (1.5*squareSize))-1; i++)
    {
        for (j = 0; j < (canvas.height / (1.5*squareSize))-1; j++)
        {
            var position = Point((i*1.5*squareSize)+squareSize/2, (j*1.5*squareSize)+squareSize/2);
            squareArray[squareArray.length] = {
                    x:      position.x,
                    y:      position.y,
                    color:  (stateSize > 0 ? BLUE : WHITE)
            };
            //alert(squareArray.length + " " + squareArray[squareArray.length-1].x + " " + squareArray[squareArray.length-1].y + " " + squareArray[squareArray.length-1].color);
        }
    }
    
    if (stateSize > 0)
    {
        var lastSquare = squareToClick;
        do {
            squareToClick = parseInt(Math.floor(Math.random() * squareArray.length));
        } while ((squareToClick < 0) || (squareToClick >= squareArray.length) || (lastSquare == squareToClick));
        squareArray[squareToClick].color = GREEN;
        //console.log(squareToClick);
    }
    else if (statePosition > 0)
    {
        var lastSquare = squareToMove;
        do {
            squareToMove = parseInt(Math.floor(Math.random() * squareArray.length));
        } while ((squareToMove < 0) || (squareToMove >= squareArray.length) || (lastSquare == squareToMove));
        squareArray[squareToMove].color = GREEN;
        //console.log(squareToMove);
        do {
            squareDestination = parseInt(Math.floor(Math.random() * squareArray.length));
        } while ((squareDestination < 0) || (squareDestination >= squareArray.length) || (squareDestination == squareToMove));
        squareArray[squareDestination].color = BLACK;
        //console.log(squareDestination);
    }
}

function isOverSquare(x, y)
{
    for (i = 0; i < squareArray.length; i++)
    {
        if ((x >= squareArray[i].x && x <= squareArray[i].x+squareSize)
            && (y >= squareArray[i].y && y <= squareArray[i].y+squareSize)
            && (squareArray[i].color != WHITE)
            && (i != squareDestination))
            return i;
    }
    
    return -1;
}

function analisePosition(currNr, destNr)
{
    var curr = squareArray[currNr];
    var dest = squareArray[destNr];
    
    if (
        (curr.x >= dest.x-squareSize*positioningMargin)
        && (curr.x+squareSize <= dest.x+squareSize+squareSize*positioningMargin)
        && (curr.y >= dest.y-squareSize*positioningMargin)
        && (curr.y+squareSize <= dest.y+squareSize+squareSize*positioningMargin)
        )
        return true;
    
    return false;
        
}

function addLog(codLog, hand)
{
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds()
    var timeValue = "" + hours + ((minutes < 10) ? ":0" : ":") + minutes + ((seconds < 10) ? ":0" : ":") + seconds;
    var today = now.getDay() + "/" + now.getMonth() + "/" + now.getFullYear();
    
    hand = (hand == 'E' ? 'E' : (hand == 'D' ? 'D' : 'X'));
    
    // CodAcao, MaoAcao, DiaAcao, HoraAcao, CountTamanho, CountPosicao, CountEstado, NrQuadrados, QuadradoSelecionar, QuadradoPosicionar, QuadradoDestino
    textLog += "\n" + codLog;
    textLog += ";" + hand;
    textLog += ";" + today;
    textLog += ";" + timeValue;
    textLog += ";" + stateSize;
    textLog += ";" + statePosition;
    textLog += ";" + stateCount;
    textLog += ";" + squareArray.length;
    textLog += ";" + squareToClick;
    textLog += ";" + squareToMove;
    textLog += ";" + squareDestination;
}

function saveLog()
{
    addLog(10);
    
    var name = window.prompt("Qual o nome do usuário?");
    $.ajax({
        url: "saveLog.php",
        data: {
           fileName: name,
           fileText: textLog
        },
        type: "post"
    });
}

function reset()
{
    squareToClick = -1;
    squareToMove = -1;
    squareDestination = -1;
    lastOver = -1;
    lastOverColor = '';
    lastOverLeft = -1;
    lastOverLeftColor = '';
}

function resetTest()
{
    $("#endTest").hide();
    stateSize = 4;
    
    stateCount = INI_COUNT;
    squareSize = INI_SIZE;
    
    textLog = 'CodAcao; MaoAcao; DiaAcao; HoraAcao; CountTamanho; CountPosicao; CountEstado; NrQuadrados; QuadradoSelecionar; QuadradoPosicionar; QuadradoDestino';
    addLog(11);
 
    reset();
    prepareSquareArray();
    redraw();
}

function resetInstance()
{
    addLog(12);
    reset();
    prepareSquareArray();
    redraw();
}

function goToMovements()
{
    addLog(13);
    var translation = ctx.transformedPoint(canvas.width/2, canvas.height/2);
    ctx.translate(translation.x, translation.y);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-translation.x, -translation.y);
    ctx.translate(-translationTrace.x, -translationTrace.y);
    zoomScale = 1;
    translationTrace = Point(0, 0);
    reset();
    stateSize = 0;
    stateCount = INI_COUNT;
    squareSize = INI_SIZE;
    prepareSquareArray();
    redraw();
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
        translationTrace.x += dx;
        translationTrace.y += dy;
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
