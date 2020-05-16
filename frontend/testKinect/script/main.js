$(document).ready(function()
{
    hideTooltip();

    // browser suporta websockets?
    if (!window.WebSocket) {
        status.innerHTML = "Your browser does not support web sockets!";
        return;
    }

    render();
});

function render()
{	
    // SOCKETS & KINECT
    var kActive = false;
    var kEvent = 'iddle';
    var kWasClicked = false;
    var kWasZooming = false;
    var kZoomStartSize = 0.0;
    // set kinect handler vars
    var kDragged = null;
    var kDragStart, kDraggingAll = false;
	
    // Initialize a new web socket.
    var socket = new WebSocket("ws://localhost:8181/KinectHtml5");

    // Connection established.
    socket.onopen = function () {
        $("#serverStatus").html("Conectado");
    };

    // Connection closed.
    socket.onclose = function () {
        $("#serverStatus").html("Conexão perdida");
    };

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
            $("#kinectLeft").attr('src', '../images/kinectLeft'+(kinectLeftClick ? 'Click' : 'Normal')+'.png');
            $("#kinectLeft").css('left', kinectData.leftHand.x+'px');
            $("#kinectLeft").css('top', kinectData.leftHand.y+'px');
            var kinectRightClick = (kinectData.rightClick == 1);
            $("#kinectRight").attr('src', '../images/kinectRight'+(kinectRightClick ? 'Click' : 'Normal')+'.png');
            $("#kinectRight").css('left', kinectData.rightHand.x+'px');
            $("#kinectRight").css('top', kinectData.rightHand.y+'px');
            
            if (kinectLeftClick)
            {
                $("#divLeft").addClass("clicked");
            }
            else
            {
                $("#divLeft").removeClass("clicked");
            }
            
            if (kinectRightClick)
            {
                $("#divRight").addClass("clicked");
                
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
                $("#divRight").removeClass("clicked");
                
                if (kWasClicked)
                {
                    kEvent = 'dropped';
                    kWasClicked = false;
                }
                kWasZooming = false;
            }		

            eval( "kHandler." + kEvent + "()" );
        }
    // Inform the server about the update.
    //socket.send("Skeleton updated on: " + (new Date()).toDateString() + ", " + (new Date()).toTimeString());
    };
    
    var kHandler = {
        iddle:function() {
            if (kActive)
            {
                $("#modeName").html("k_iddle");
                // funcionalidade da tooltip
                //showTooltip(nearerNode.node.data.realName, realMouseP, nodeSize);
                //hideTooltip();
                
                // atualiza valores para o zoom
                kLastX = (kinectData.rightHand.x);
                kLastY = (kinectData.rightHand.y);
                if (kDragged != null){
                    //ctx.translate(pt2.x-kDragged.x,pt2.y-kDragged.y);
                }
            }
        }, 
        clicked: function(){
            if (kActive)
            {
                $("#modeName").html("k_clicked");
                var p = {x: kinectData.rightHand.x, y: kinectData.rightHand.y};

//                if (esta em um objeto)
//                {
//                    kDragged = object;
//                }
//                else
//                {
                    // atualiza valores para o zoom
                    kLastX = (kinectData.rightHand.x);
                    kLastY = (kinectData.rightHand.y);
                    kDragged = p;
                    kDraggingAll = true;
//                }
            }
        },
        dragged: function(){
            if (kActive)
            {
                $("#modeName").html("k_dragged");
                if (!kDraggingAll)
                {
                    var p = {x: kinectData.rightHand.x, y: kinectData.rightHand.y};
                    
//                    if (kDragged)
//                    {
//                        kDragged.p = p;
//                    }
                }
                else
                {
                    // atualiza valores para o zoom
                    kLastX = (kinectData.rightHand.x);
                    kLastY = (kinectData.rightHand.y);
//                    if (kDragged != null){
//                        ctx.translate(pt.x-kDragged.x, pt.y-kDragged.y);
//                    }
                }
            }
        },

        dropped: function(){
            if (kActive)
            {
                $("#modeName").html("k_dropped");

                kDragged = null;
                kDraggingAll = false;
            }
        },

        zoomStart: function(){
            if (kActive)
            {
                var sizeA = kinectData.rightHand.x - kinectData.leftHand.x;
                var sizeB = kinectData.rightHand.y - kinectData.leftHand.y;
                kZoomStartSize = Math.sqrt( (sizeA*sizeA) + (sizeB*sizeB) );
            }
        },

        zoom: function() {
            if (kActive)
            {
                var sizeA = kinectData.rightHand.x - kinectData.leftHand.x;
                var sizeB = kinectData.rightHand.y - kinectData.leftHand.y;
                var size = Math.sqrt( (sizeA*sizeA) + (sizeB*sizeB) );
                var zoomFactor = (size /  kZoomStartSize);
                kZoomStartSize = size;

                //kZoom( zoomFactor );
            }
        }
    };
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
