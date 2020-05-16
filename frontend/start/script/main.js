
var Point = function(a,b)
{
    if (a && a.hasOwnProperty("y"))
    {
        b = a.y;
        a = a.x
    }
    
    return {x: a, y: b};
};

// KINECT
var kinectData = "";
var _kinectP = Point(0,0);
var kActive = false;
var kEvent = 'iddle';
var LEFT = 1;
var RIGHT = 2;
var kWasClicked = false;

$(document).ready(function()
{    
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
        //initMouseHandling();
        
        $("#kinectLeft").hide();
        $("#kinectRight").hide();
    }
    

}    

function handleKinect(data)
{
    // Get the data in JSON format.
    eval( "kinectData = " + data );

    kActive = ((kinectData.leftClick != 'undefined') && (kinectData.leftClick != null));

    var kHandler = {
        iddle:function() {
            $("#modeName").html("k_iddle");

            redraw();
        }, 
        clicked: function(){
            $("#modeName").html("k_clicked");

            if (kinectData.rightClick == 1)
            {
                var pos = Point(kinectData.rightHand.x, kinectData.rightHand.y);
            }
            else if ((kinectData.leftClick == 1))
            {
                var pos = Point(kinectData.leftHand.x, kinectData.leftHand.y);
            }
            
            
            if ((pos.x > 0 && pos.x < 384) && (pos.y > 0 && pos.y < 384))
            {
                window.location = '../testing/';
            }
            
            if ((pos.x > 384 && pos.x < 768) && (pos.y > 0 && pos.y < 384))
            {
                window.location = '../map/';
            }
            
            if ((pos.x > 0 && pos.x < 384) && (pos.y > 384 && pos.y < 768))
            {
                window.location = '../game/';
            }
            
            if ((pos.x > 384 && pos.x < 768) && (pos.y > 384 && pos.y < 768))
            {
                window.location = '../';
            }
        },
        dragged: function(){
            $("#modeName").html("k_dragged");
        },

        dropped: function(){
            $("#modeName").html("k_dropped");
        },

        zoomStart: function(){
        },

        zoom: function() {
        }
    }

    if (kActive)
    {
        kEvent = 'iddle';
        
        $("#kinectLeft").show();
        $("#kinectRight").show();
        
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

// DRAW
function redraw()
{
    
}
