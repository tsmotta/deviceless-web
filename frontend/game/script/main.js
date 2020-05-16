
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

var sitGame = "---*---*---";
var gameEnded = false;

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
            
            if ((pos.x > 1010 && pos.x < 1040) && (pos.y > 0 && pos.y < 70))
            {
                window.location = '../start/';
            }
            
            if (!gameEnded)
            {            
                var coords = explodeState();

                // coord 1-1
                if ((pos.x > 0 && pos.x < 256) && (pos.y > 0 && pos.y < 256) && (coords[0][0] == '-'))
                {
                    Jogar("X"+coords[0][1]+coords[0][2]+"*"+coords[1][0]+coords[1][1]+coords[1][2]+"*"+coords[2][0]+coords[2][1]+coords[2][2]);
                }
                // coord 1-2
                if ((pos.x > 256 && pos.x < 512) && (pos.y > 0 && pos.y < 256) && (coords[0][1] == '-'))
                {
                    Jogar(coords[0][0]+"X"+coords[0][2]+"*"+coords[1][0]+coords[1][1]+coords[1][2]+"*"+coords[2][0]+coords[2][1]+coords[2][2]);
                }
                // coord 1-3
                if ((pos.x > 512 && pos.x < 768) && (pos.y > 0 && pos.y < 256) && (coords[0][2] == '-'))
                {
                    Jogar(coords[0][0]+coords[0][1]+"X"+"*"+coords[1][0]+coords[1][1]+coords[1][2]+"*"+coords[2][0]+coords[2][1]+coords[2][2]);
                }
                // coord 2-1
                if ((pos.x > 0 && pos.x < 256) && (pos.y > 256 && pos.y < 512) && (coords[1][0] == '-'))
                {
                    Jogar(coords[0][0]+coords[0][1]+coords[0][2]+"*"+"X"+coords[1][1]+coords[1][2]+"*"+coords[2][0]+coords[2][1]+coords[2][2]);
                }
                // coord 2-2
                if ((pos.x > 256 && pos.x < 512) && (pos.y > 256 && pos.y < 512) && (coords[1][1] == '-'))
                {
                    Jogar(coords[0][0]+coords[0][1]+coords[0][2]+"*"+coords[1][0]+"X"+coords[1][2]+"*"+coords[2][0]+coords[2][1]+coords[2][2]);
                }
                // coord 2-3
                if ((pos.x > 512 && pos.x < 768) && (pos.y > 256 && pos.y < 512) && (coords[1][2] == '-'))
                {
                    Jogar(coords[0][0]+coords[0][1]+coords[0][2]+"*"+coords[1][0]+coords[1][1]+"X"+"*"+coords[2][0]+coords[2][1]+coords[2][2]);
                }
                // coord 3-1
                if ((pos.x > 0 && pos.x < 256) && (pos.y > 512 && pos.y < 768) && (coords[2][0] == '-'))
                {
                    Jogar(coords[0][0]+coords[0][1]+coords[0][2]+"*"+coords[1][0]+coords[1][1]+coords[1][2]+"*"+"X"+coords[2][1]+coords[2][2]);
                }
                // coord 3-2
                if ((pos.x > 256 && pos.x < 512) && (pos.y > 512 && pos.y < 768) && (coords[2][1] == '-'))
                {
                    Jogar(coords[0][0]+coords[0][1]+coords[0][2]+"*"+coords[1][0]+coords[1][1]+coords[1][2]+"*"+coords[2][0]+"X"+coords[2][2]);
                }
                // coord 3-3
                if ((pos.x > 512 && pos.x < 768) && (pos.y > 512 && pos.y < 768) && (coords[2][2] == '-'))
                {
                    Jogar(coords[0][0]+coords[0][1]+coords[0][2]+"*"+coords[1][0]+coords[1][1]+coords[1][2]+"*"+coords[2][0]+coords[2][1]+"X");
                }
            }
            else
            {
                if ((pos.x > 0 && pos.x < 768) && (pos.y > 0 && pos.y < 384))
                {
                    window.location.reload();
                }
                // coord 1-2
                if ((pos.x > 0 && pos.x < 768) && (pos.y > 384 && pos.y < 768))
                {
                    window.location = '../start/';
                }
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
    Mostra(sitGame);
}

function explodeState()
{
    var lines = sitGame.split("*");
    var board = Array(Array(3), Array(3), Array(3));
    
    for (var i = 0; i < 3; i++)
    {
        for (var j = 0; j < 3; j++)
        {
            board[i][j] = lines[i].charAt(j);
        }
    }
    
    return board;
}

function Mostra(situation)
{
    sitGame = situation;

    if (sitGame.indexOf("Q") != -1) // vitoria do pc
    {
        $("#gameResult").html("Você perdeu!<br/>Jogar de novo<br/>------------<br/>Voltar");
        $("#gameResult").show();
        gameEnded = true;
    }
    else if (sitGame.indexOf("-") == -1) // empate
    {
        $("#gameResult").html("Deu empate<br/>Jogar de novo<br/>------------<br/>Voltar");
        $("#gameResult").show();
        gameEnded = true;
    }
    
    var lines = sitGame.split("*");
    
    for (var i = 0; i < 3; i++)
    {
        for (var j = 0; j < 3; j++)
        {
            if (lines[i].charAt(j) == 'X')
                $("#coord"+(i+1)+""+(j+1)).attr("src", "./img/x.png").show();
            if ((lines[i].charAt(j) == 'O') || (lines[i].charAt(j) == 'Q'))
                $("#coord"+(i+1)+""+(j+1)).attr("src", "./img/o.png").show();
        }
    }
}

//GAME
// retirado de http://www.marilia.unesp.br/Home/Instituicao/Docentes/RicardoTassinari/Jovia.txt
 // Os comentário são sempre precedidos pelas duas barras //.

 // O programa tem apenas duas funções: 'Jogar' e 'Mostrar'.

 // A função 'Mostrar', no fim do programa, tem mais artifícios de programação e
 //  basicamente serve para montar a página em que está os quadradinhos do Jogo da Velha
 //  e para informar as jogadas feitas pelo usuário. 

 // A função 'Jogar' abaixo é a que diz ao computador como jogar.
 // Ela foi construída de forma simples para que mesmo um leigo em JavaScript (a linguagem 
 //  de programação aqui utilizada) possa entender seu funcionamento.
 // Basicamente, ela retorna a próxima jogada em função da jogada feita 'JogadaFeita'
 //  (além de manter os pontos do programa 'PtosJoVIA' e o número de empates 'Empates').
 // Suas linhas são todas da forma SE () ENTÃO {}, isto é, se ocorre o que está entre
 //  parênteses, então ocorre o que está entre chaves. O resto é apenas comentários e não
 //  influencia no programa. Como JavaScript se utiliza do Inglês, as linhas são da forma
 //   if () {} (o 'então' é omitido).
 // Em 'JogadaFeita', o sinal '-' indica espaço em branco e o sinal'*' indica a separação
 //  de cada uma das linhas do Jogo da Velha, além de se ter os usuais 'X' e 'O'('Q' indica
 //  onde o computador conseguiu fazer uma seqüencia de três círculos e ganhar).
 // Entre chaves sempre temos a função 'return' (retorna), que executa a segunda função
 //  'Mostra' do programa, com a indicação de que jogada o computador faz.
 // Os números na frente das linhas indicam (apenas para nós seres humanos) a seqüência na
 //  árvore de possibilidades. O asterísco no final indica que o jogo ainda não terminou ali.

 // O que chamamos aqui de 'jogada' tem normalmente dois movimentos, um do computador e um do
 //  usuário, ou vice-versa. Dai um jogo ter no máximo 5 jogadas.
 
function Jogar( JogadaFeita ) 
{
    // JOGO COMEÇADO PELO USUÁRIO 
    // Respostas para a primeira jogada
 
    if ( JogadaFeita == 'X--*---*---' ) {
        return Mostra( 'X--*-O-*---' )
        } //1*
    if ( JogadaFeita == '-X-*---*---' ) {
        return Mostra( '-X-*-O-*---' )
        } //2*
    if ( JogadaFeita == '--X*---*---' ) {
        return Mostra( '--X*-O-*---' )
        } //3*
    if ( JogadaFeita == '---*X--*---' ) {
        return Mostra( '---*XO-*---' )
        } //4*
    if ( JogadaFeita == '---*-X-*---' ) {
        return Mostra( '---*-X-*--O' )
        } //5*
    if ( JogadaFeita == '---*--X*---' ) {
        return Mostra( '---*-OX*---' )
        } //6*
    if ( JogadaFeita == '---*---*X--' ) {
        return Mostra( '---*-O-*X--' )
        } //7*
    if ( JogadaFeita == '---*---*-X-' ) {
        return Mostra( '---*-O-*-X-' )
        } //8*
    if ( JogadaFeita == '---*---*--X' ) {
        return Mostra( '---*-O-*--X' )
        } //9*
 
    // Respostas para as segunda e terceira jogadas
 
    if ( JogadaFeita == 'XX-*-O-*---' ) {
        return Mostra( 'XXO*-O-*---' )
        } //1,1*
    if ( JogadaFeita == 'X-X*-O-*---' ) {
        return Mostra( 'XOX*-O-*---' )
        } //1,2*
    if ( JogadaFeita == 'X--*XO-*---' ) {
        return Mostra( 'X--*XO-*O--' )
        } //1,3*
    if ( JogadaFeita == 'X--*-OX*---' ) {
        return Mostra( 'XO-*-OX*---' )
        } //1,4*
    if ( JogadaFeita == 'X--*-O-*X--' ) {
        return Mostra( 'X--*OO-*X--' )
        } //1,5*
    if ( JogadaFeita == 'X--*-O-*-X-' ) {
        return Mostra( 'X--*OO-*-X-' )
        } //1,6*
    if ( JogadaFeita == 'X--*-O-*--X' ) {
        return Mostra( 'X--*-OO*--X' )
        } //1,7*
 
    if ( JogadaFeita == 'XXO*XO-*---' ) {
        return Mostra( 'XXQ*XQ- Q--' )
        } //1,1,1
    if ( JogadaFeita == 'XXO*-OX*---' ) {
        return Mostra( 'XXQ*-QX Q--' )
        } //1,1,2
    if ( JogadaFeita == 'XXO*-O-*X--' ) {
        return Mostra( 'XXO*OO-*X--' )
        } //1,1,3*
    if ( JogadaFeita == 'XXO*-O-*-X-' ) {
        return Mostra( 'XXQ*-Q- QX-' )
        } //1,1,4
    if ( JogadaFeita == 'XXO*-O-*--X' ) {
        return Mostra( 'XXQ*-Q- Q-X' )
        } //1,1,5
 
    if ( JogadaFeita == 'XOX*XO-*---' ) {
        return Mostra( 'XQX*XQ-*-Q-' )
        } //1,2,1
    if ( JogadaFeita == 'XOX*-OX*---' ) {
        return Mostra( 'XQX*-QX*-Q-' )
        } //1,2,2
    if ( JogadaFeita == 'XOX*-O-*X--' ) {
        return Mostra( 'XQX*-Q-*XQ-' )
        } //1,2,3
    if ( JogadaFeita == 'XOX*-O-*-X-' ) {
        return Mostra( 'XOX*-OO*-X-' )
        } //1,2,4*
    if ( JogadaFeita == 'XOX*-O-*--X' ) {
        return Mostra( 'XQX*-Q-*-QX' )
        } //1,2,5
 
    if ( JogadaFeita == 'XX-*XO-*O--' ) {
        return Mostra( 'XXQ*XQ-*Q--' )
        } //1,3,1
    if ( JogadaFeita == 'X-X*XO-*O--' ) {
        return Mostra( 'XOX*XO-*O--' )
        } //1,3,2*
    if ( JogadaFeita == 'X--*XOX*O--' ) {
        return Mostra( 'X-Q*XQX*Q--' )
        } //1,3,3
    if ( JogadaFeita == 'X--*XOX*OX-' ) {
        return Mostra( 'X-Q*XQX*QX-' )
        } //1,3,4
    if ( JogadaFeita == 'X--*XO-*O-X' ) {
        return Mostra( 'X-Q*XQ-*Q-X' )
        } //1,3,5
 
    if ( JogadaFeita == 'XOX*-OX*---' ) {
        return Mostra( 'XQ-*XQX*-Q-' )
        } //1,4,1
    if ( JogadaFeita == 'XO-*XOX*---' ) {
        return Mostra( 'XQ-*XQX*-Q-' )
        } //1,4,2
    if ( JogadaFeita == 'XO-*-OX*X--' ) {
        return Mostra( 'XQ-*-QX*XQ-' )
        } //1,4,3
    if ( JogadaFeita == 'XO-*-OX*-X-' ) {
        return Mostra( 'XO-*-OX*OX-' )
        } //1,4,4*
    if ( JogadaFeita == 'XO-*-OX*--X' ) {
        return Mostra( 'XQ-*-QX*-QX' )
        } //1,4,5
 
    if ( JogadaFeita == 'XX-*OO-*X--' ) {
        return Mostra( 'XX-*QQQ*X--' )
        } //1,5,1
    if ( JogadaFeita == 'X-X*OO-*X--' ) {
        return Mostra( 'X-X*QQQ*X--' )
        } //1,5,2
    if ( JogadaFeita == 'X--*OOX*X--' ) {
        return Mostra( 'X--*OOX*XO-' )
        } //1,5,3*
    if ( JogadaFeita == 'X--*OO-*XX-' ) {
        return Mostra( 'X--*QQQ*XX-' )
        } //1,5,4
    if ( JogadaFeita == 'X--*OO-*X-X' ) {
        return Mostra( 'X--*QQQ*X-X' )
        } //1,5,5
 
    if ( JogadaFeita == 'XX-*OO-*-X-' ) {
        return Mostra( 'XX-*QQQ*-X-' )
        } //1,6,1
    if ( JogadaFeita == 'X-X*OO-*-X-' ) {
        return Mostra( 'X-X*QQQ*-X-' )
        } //1,6,2
    if ( JogadaFeita == 'X--*OOX*-X-' ) {
        return Mostra( 'X-O*OOX*-X-' )
        } //1,6,3*
    if ( JogadaFeita == 'X--*OO-*XX-' ) {
        return Mostra( 'X--*QQQ*XX-' )
        } //1,6,4
    if ( JogadaFeita == 'X--*OO-*-XX' ) {
        return Mostra( 'X--*QQQ*-XX' )
        } //1,6,5
 
    if ( JogadaFeita == 'XX-*-OO*--X' ) {
        return Mostra( 'XX-*QQQ*--X' )
        } //1,7,1
    if ( JogadaFeita == 'X-X*-OO*--X' ) {
        return Mostra( 'X-X*QQQ*--X' )
        } //1,7,2
    if ( JogadaFeita == 'X--*XOO*--X' ) {
        return Mostra( 'X--*XOO*O-X' )
        } //1,7,3*
    if ( JogadaFeita == 'X--*-OO*X-X' ) {
        return Mostra( 'X--*QQQ*X-X' )
        } //1,7,4
    if ( JogadaFeita == 'X--*-OO*-XX' ) {
        return Mostra( 'X--*QQQ*-XX' )
        } //1,7,5
 
    if ( JogadaFeita == '-XX*-O-*---' ) {
        return Mostra( 'OXX*-O-*---' )
        } //2,1*
    if ( JogadaFeita == '-X-*XO-*---' ) {
        return Mostra( 'OX-*XO-*---' )
        } //2,2*
    if ( JogadaFeita == '-X-*-OX*---' ) {
        return Mostra( '-XO*-OX*---' )
        } //2,3*
    if ( JogadaFeita == '-X-*-O-*X--' ) {
        return Mostra( '-X-*-OO*X--' )
        } //2,4*
    if ( JogadaFeita == '-X-*-O-*-X-' ) {
        return Mostra( '-X-*-O-*-XO' )
        } //2,5*
    if ( JogadaFeita == '-X-*-O-*--X' ) {
        return Mostra( '-X-*OO-*--X' )
        } //2,6*
 
    if ( JogadaFeita == 'OXX*XO-*---' ) {
        return Mostra( 'QXX*XQ-*--Q' )
        } //2,1,1
    if ( JogadaFeita == 'OXX*-OX*---' ) {
        return Mostra( 'QXX*-QX*--Q' )
        } //2,1,2
    if ( JogadaFeita == 'OXX*-O-*X--' ) {
        return Mostra( 'QXX*-Q-*X-Q' )
        } //2,1,3
    if ( JogadaFeita == 'OXX*-O-*-X-' ) {
        return Mostra( 'QXX*-Q-*-XQ' )
        } //2,1,4
    if ( JogadaFeita == 'OXX*-O-*--X' ) {
        return Mostra( 'OXX*-OO*--X' )
        } //2,1,5*
 
    if ( JogadaFeita == 'OXX*XO-*---' ) {
        return Mostra( 'QXX*XQ-*--Q' )
        } //2,2,1
    if ( JogadaFeita == 'OX-*XOX*---' ) {
        return Mostra( 'QX-*XQX*--Q' )
        } //2,2,2
    if ( JogadaFeita == 'OX-*XO-*X--' ) {
        return Mostra( 'QX-*XQ-*X-Q' )
        } //2,2,3
    if ( JogadaFeita == 'OX-*XO-*-X-' ) {
        return Mostra( 'QX-*XQ-*-XQ' )
        } //2,2,4
    if ( JogadaFeita == 'OX-*XO-*--X' ) {
        return Mostra( 'OXO*XO-*--X' )
        } //2,2,5*
 
    if ( JogadaFeita == 'XXO*-OX*---' ) {
        return Mostra( 'XXQ*-QX*Q--' )
        } //2,3,1
    if ( JogadaFeita == '-XO*XOX*---' ) {
        return Mostra( '-XQ*XQX*Q--' )
        } //2,3,2
    if ( JogadaFeita == '-XO*-OX*X--' ) {
        return Mostra( '-XO*-OX*X-O' )
        } //2,3,3*
    if ( JogadaFeita == '-XO*-OX*-X-' ) {
        return Mostra( '-XQ*-QX*QX-' )
        } //2,3,4
    if ( JogadaFeita == '-XO*-OX*--X' ) {
        return Mostra( '-XQ*-QX*Q-X' )
        } //2,3,5
 
    if ( JogadaFeita == 'XX-*-OO*X--' ) {
        return Mostra( 'XX-*QQQ*X--' )
        } //2,4,1
    if ( JogadaFeita == '-XX*-OO*X--' ) {
        return Mostra( '-XX*QQQ*X--' )
        } //2,4,2
    if ( JogadaFeita == '-X-*XOO*X--' ) {
        return Mostra( 'OX-*XOO*X--' )
        } //2,4,3*
    if ( JogadaFeita == '-X-*-OO*XX-' ) {
        return Mostra( '-X-*QQQ*XX-' )
        } //2,4,4
    if ( JogadaFeita == '-X-*-OO*X-X' ) {
        return Mostra( '-X-*QQQ*X-X' )
        } //2,4,5
 
    if ( JogadaFeita == 'XX-*-O-*-XO' ) {
        return Mostra( 'XXO*-O-*-XO' )
        } //2,5,1*
    if ( JogadaFeita == '-XX*-O-*-XO' ) {
        return Mostra( 'QXX*-Q-*-XQ' )
        } //2,5,2
    if ( JogadaFeita == '-X-*XO-*-XO' ) {
        return Mostra( 'QX-*XQ-*-XQ' )
        } //2,5,3
    if ( JogadaFeita == '-X-*-OX*-XO' ) {
        return Mostra( 'QX-*-QX*-XQ' )
        } //2,5,4
    if ( JogadaFeita == '-X-*-O-*XXO' ) {
        return Mostra( 'QX-*-Q-*XXQ' )
        } //2,5,5
 
    if ( JogadaFeita == 'XX-*OO-*--X' ) {
        return Mostra( 'XX-*QQQ*--X' )
        } //2,6,1
    if ( JogadaFeita == '-XX*OO-*--X' ) {
        return Mostra( '-XX*QQQ*--X' )
        } //2,6,2
    if ( JogadaFeita == '-X-*OOX*--X' ) {
        return Mostra( '-XO*OOX*--X' )
        } //2,6,3*
    if ( JogadaFeita == '-X-*OO-*X-X' ) {
        return Mostra( '-X-*QQQ*X-X' )
        } //2,6,4
    if ( JogadaFeita == '-X-*OO-*-XX' ) {
        return Mostra( '-X-*QQQ*-XX' )
        } //2,6,5
 
    if ( JogadaFeita == '--X*XO-*---' ) {
        return Mostra( '-OX*XO-*---' )
        } //3,1*
    if ( JogadaFeita == '--X*-OX*---' ) {
        return Mostra( '--X*-OX*--O' )
        } //3,2*
    if ( JogadaFeita == '--X*-O-*X--' ) {
        return Mostra( '--X*OO-*X--' )
        } //3,3*
    if ( JogadaFeita == '--X*-O-*-X-' ) {
        return Mostra( '--X*OO-*-X-' )
        } //3,4*
    if ( JogadaFeita == '--X*-O-*--X' ) {
        return Mostra( '--X*-OO*--X' )
        } //3,5*
 
    if ( JogadaFeita == 'XOX*XO-*---' ) {
        return Mostra( 'XQX*XQ-*-Q-' )
        } //3,1,1
    if ( JogadaFeita == '-OX*XOX*---' ) {
        return Mostra( '-QX*XQX*-Q-' )
        } //3,1,2
    if ( JogadaFeita == '-OX*XO-*X--' ) {
        return Mostra( '-QX*XQ-*XQ-' )
        } //3,1,3
    if ( JogadaFeita == '-OX*XO-*-X-' ) {
        return Mostra( 'OOX*XO-*-X-' )
        } //3,1,4*
    if ( JogadaFeita == '-OX*XO-*--X' ) {
        return Mostra( '-QX*XQ-*-QX' )
        } //3,1,5
 
    if ( JogadaFeita == 'X-X*-OX*--O' ) {
        return Mostra( 'XOX*-OX*--O' )
        } //3,2,1*
    if ( JogadaFeita == '-XX*-OX*--O' ) {
        return Mostra( 'QXX*-QX*--Q' )
        } //3,2,2
    if ( JogadaFeita == '--X*XOX*--O' ) {
        return Mostra( 'Q-X*XQX*--Q' )
        } //3,2,3
    if ( JogadaFeita == '--X*-OX*X-O' ) {
        return Mostra( 'Q-X*-QX*X-Q' )
        } //3,2,4
    if ( JogadaFeita == '--X*-OX*-XO' ) {
        return Mostra( 'Q-X*-QX*-XQ' )
        } //3,2,5
 
    if ( JogadaFeita == 'X-X*-O-*X--' ) {
        return Mostra( 'X-X*QQQ*X--' )
        } //3,3,1
    if ( JogadaFeita == '-XX*OO-*X--' ) {
        return Mostra( '-XX*QQQ*X--' )
        } //3,3,2
    if ( JogadaFeita == '--X*OOX*X--' ) {
        return Mostra( '--X*OOX*X-O' )
        } //3,3,3*
    if ( JogadaFeita == '--X*OO-*XX-' ) {
        return Mostra( '--X*QQQ*XX-' )
        } //3,3,4
    if ( JogadaFeita == '--X*OO-*X-X' ) {
        return Mostra( '--X*QQQ*X-X' )
        } //3,3,5
 
    if ( JogadaFeita == 'X-X*OO-*-X-' ) {
        return Mostra( 'X-X*QQQ*-X-' )
        } //3,4,1
    if ( JogadaFeita == '-XX*OO-*-X-' ) {
        return Mostra( '-XX*QQQ*-X-' )
        } //3,4,2
    if ( JogadaFeita == '--X*OOX*-X-' ) {
        return Mostra( '--X*OOX*-XO' )
        } //3,4,3*
    if ( JogadaFeita == '--X*OO-*XX-' ) {
        return Mostra( '--X*QQQ*XX-' )
        } //3,4,4
    if ( JogadaFeita == '--X*OO-*-XX' ) {
        return Mostra( '--X*QQQ*-XX' )
        } //3,4,5
 
    if ( JogadaFeita == 'X-X*-OO*--X' ) {
        return Mostra( 'X-X*QQQ*--X' )
        } //3,5,1
    if ( JogadaFeita == '-XX*-OO*--X' ) {
        return Mostra( '-XX*QQQ*--X' )
        } //3,5,2
    if ( JogadaFeita == '--X*XOO*--X' ) {
        return Mostra( '--X*XOO*-OX' )
        } //3,5,3*
    if ( JogadaFeita == '--X*-OO*X-X' ) {
        return Mostra( '--X*QQQ*X-X' )
        } //3,5,4
    if ( JogadaFeita == '--X*-OO*-XX' ) {
        return Mostra( '--X*QQQ*-XX' )
        } //3,5,5
 
    if ( JogadaFeita == '---*XOX*---' ) {
        return Mostra( '--O*XOX*---' )
        } //4,1*
    if ( JogadaFeita == '---*XO-*X--' ) {
        return Mostra( 'O--*XO-*X--' )
        } //4,2*
    if ( JogadaFeita == '---*XO-*-X-' ) {
        return Mostra( '---*XO-*OX-' )
        } //4,3*
    if ( JogadaFeita == '---*XO-*--X' ) {
        return Mostra( '-O-*XO-*--X' )
        } //4,4*
 
    if ( JogadaFeita == 'X-O*XOX*---' ) {
        return Mostra( 'X-Q*XQX*Q--' )
        } //4,1,1
    if ( JogadaFeita == '-XO*XOX*---' ) {
        return Mostra( '-XQ*XQX*Q--' )
        } //4,1,2
    if ( JogadaFeita == '--O*XOX*X--' ) {
        return Mostra( 'O-O*XOX*X--' )
        } //4,1,3*
    if ( JogadaFeita == '--O*XOX*-X-' ) {
        return Mostra( '--Q*XQX*QX-' )
        } //4,1,4
    if ( JogadaFeita == '--O*XOX*--X' ) {
        return Mostra( '--Q*XQX*Q-X' )
        } //4,1,5
 
    if ( JogadaFeita == 'OX-*XO-*X--' ) {
        return Mostra( 'QX-*XQ-*X-Q' )
        } //4,2,1
    if ( JogadaFeita == 'O-X*XO-*X--' ) {
        return Mostra( 'Q-X*XQ-*X-Q' )
        } //4,2,2
    if ( JogadaFeita == 'O--*XOX*X--' ) {
        return Mostra( 'Q--*XQX*X-Q' )
        } //4,2,3
    if ( JogadaFeita == 'O--*XO-*XX-' ) {
        return Mostra( 'Q--*XQ-*XXQ' )
        } //4,2,4
    if ( JogadaFeita == 'O--*XO-*X-X' ) {
        return Mostra( 'O--*XO-*XOX' )
        } //4,2,5*
 
    if ( JogadaFeita == 'X--*XO-*OX-' ) {
        return Mostra( 'X-Q*XQ-*QX-' )
        } //4,3,1
    if ( JogadaFeita == '-X-*XO-*OX-' ) {
        return Mostra( '-XQ*XQ-*QX-' )
        } //4,3,2
    if ( JogadaFeita == '--X*XO-*OX-' ) {
        return Mostra( '--X*XO-*OXO' )
        } //4,3,3*
    if ( JogadaFeita == '---*XOX*OX-' ) {
        return Mostra( '--Q*XQX*QX-' )
        } //4,3,4
    if ( JogadaFeita == '---*XO-*OXX' ) {
        return Mostra( '--Q*XQ-*QXX' )
        } //4,3,5
 
    if ( JogadaFeita == 'XO-*XO-*--X' ) {
        return Mostra( 'XQ-*XQ-*-QX' )
        } //4,4,1
    if ( JogadaFeita == '-OX*XO-*--X' ) {
        return Mostra( '-QX*XQ-*-QX' )
        } //4,4,2
    if ( JogadaFeita == '-O-*XOX*--X' ) {
        return Mostra( '-Q-*XQX*-QX' )
        } //4,4,3
    if ( JogadaFeita == '-O-*XO-*X-X' ) {
        return Mostra( '-Q-*XQ-*XQX' )
        } //4,4,4
    if ( JogadaFeita == '-O-*XO-*-XX' ) {
        return Mostra( '-O-*XO-*OXX' )
        } //4,4,5*
 
    if ( JogadaFeita == 'X--*-X-*--O' ) {
        return Mostra( 'X--*-X-*O-O' )
        } //5,1*
    if ( JogadaFeita == '-X-*-X-*--O' ) {
        return Mostra( '-X-*-X-*-OO' )
        } //5,2*
    if ( JogadaFeita == '--X*-X-*--O' ) {
        return Mostra( '--X*-X-*O-O' )
        } //5,3*
    if ( JogadaFeita == '---*XX-*--O' ) {
        return Mostra( '---*XXO*--O' )
        } //5,4*
    if ( JogadaFeita == '---*-XX*--O' ) {
        return Mostra( '---*OXX*--O' )
        } //5,5*
    if ( JogadaFeita == '---*-X-*X-O' ) {
        return Mostra( '--O*-X-*X-O' )
        } //5,6*
    if ( JogadaFeita == '---*-X-*-XO' ) {
        return Mostra( '-O-*-X-*-XO' )
        } //5,7*

 
    if ( JogadaFeita == 'XX-*-X-*O-O' ) {
        return Mostra( 'XX-*-X-*QQQ' )
        } //5,1,1
    if ( JogadaFeita == 'X-X*-X-*O-O' ) {
        return Mostra( 'X-X*-X-*QQQ' )
        } //5,1,2
    if ( JogadaFeita == 'X--*XX-*O-O' ) {
        return Mostra( 'X--*XX-*QQQ' )
        } //5,1,3
    if ( JogadaFeita == 'X--*-XX*O-O' ) {
        return Mostra( 'X--*-XX*QQQ' )
        } //5,1,4
    if ( JogadaFeita == 'X--*-X-*OXO' ) {
        return Mostra( 'XO-*-X-*OXO' )
        } //5,1,5*
 
    if ( JogadaFeita == 'XX-*-X-*-OO' ) {
        return Mostra( 'XX-*-X-*QQQ' )
        } //5,2,1
    if ( JogadaFeita == '-XX*-X-*-OO' ) {
        return Mostra( '-XX*-X-*QQQ' )
        } //5,2,2
    if ( JogadaFeita == '-X-*XX-*-OO' ) {
        return Mostra( '-X-*XX-*QQQ' )
        } //5,2,3
    if ( JogadaFeita == '-X-*-XX*-OO' ) {
        return Mostra( '-X-*-XX*QQQ' )
        } //5,2,4
    if ( JogadaFeita == '-X-*-X-*XOO' ) {
        return Mostra( '-XO*-X-*XOO' )
        } //5,2,5*
 
    if ( JogadaFeita == 'X-X*-X-*O-O' ) {
        return Mostra( 'X-X*-X-*QQQ' )
        } //5,3,1
    if ( JogadaFeita == '-XX*-X-*O-O' ) {
        return Mostra( '-XX*-X-*QQQ' )
        } //5,3,2
    if ( JogadaFeita == '--X*XX-*O-O' ) {
        return Mostra( '--X*XX-*QQQ' )
        } //5,3,3
    if ( JogadaFeita == '--X*-XX*O-O' ) {
        return Mostra( '--X*-XX*QQQ' )
        } //5,3,4
    if ( JogadaFeita == '--X*-X-*OXO' ) {
        return Mostra( '-OX*-X-*OXO' )
        } //5,3,5*
 
    if ( JogadaFeita == 'X--*XXO*--O' ) {
        return Mostra( 'X-Q*XXQ*--Q' )
        } //5,4,1
    if ( JogadaFeita == '-X-*XXO*--O' ) {
        return Mostra( '-XQ*XXQ*--Q' )
        } //5,4,2
    if ( JogadaFeita == '--X*XXO*--O' ) {
        return Mostra( '--X*XXO*O-O' )
        } //5,4,3*
    if ( JogadaFeita == '---*XXO*X-O' ) {
        return Mostra( '--Q*XXQ*X-Q' )
        } //5,4,4
    if ( JogadaFeita == '---*XXO*-XO' ) {
        return Mostra( '--Q*XXQ*-XQ' )
        } //5,4,5
 
    if ( JogadaFeita == 'X--*OXX*--O' ) {
        return Mostra( 'X--*OXX*O-O' )
        } //5,5,1*
    if ( JogadaFeita == '-X-*OXX*--O' ) {
        return Mostra( '-X-*OXX*-OO' )
        } //5,5,2*
    if ( JogadaFeita == '--X*OXX*--O' ) {
        return Mostra( '--X*OXX*O-O' )
        } //5,5,3*
    if ( JogadaFeita == '---*OXX*X-O' ) {
        return Mostra( '--O*OXX*X-O' )
        } //5,5,4*
    if ( JogadaFeita == '---*OXX*-XO' ) {
        return Mostra( '-O-*OXX*-XO' )
        } //5,5,5*
 
    if ( JogadaFeita == 'X-O*-X-*X-O' ) {
        return Mostra( 'X-Q*-XQ*X-Q' )
        } //5,6,1
    if ( JogadaFeita == '-XO*-X-*X-O' ) {
        return Mostra( '-XQ*-XQ*X-Q' )
        } //5,6,2
    if ( JogadaFeita == '--O*XX-*X-O' ) {
        return Mostra( '--Q*XXQ*X-Q' )
        } //5,6,3
    if ( JogadaFeita == '--O*-XX*X-O' ) {
        return Mostra( '--O*OXX*X-O' )
        } //5,6,4*
    if ( JogadaFeita == '--O*-X-*XXO' ) {
        return Mostra( '--Q*-XQ*XXQ' )
        } //5,6,5
 
    if ( JogadaFeita == 'XO-*-X-*-XO' ) {
        return Mostra( 'XOO*-X-*-XO' )
        } //5,7,1*
    if ( JogadaFeita == '-OX*-X-*-XO' ) {
        return Mostra( '-OX*-X-*OXO' )
        } //5,7,2*
    if ( JogadaFeita == '-O-*XX-*-XO' ) {
        return Mostra( '-O-*XXO*-XO' )
        } //5,7,3*
    if ( JogadaFeita == '-O-*-XX*-XO' ) {
        return Mostra( '-O-*OXX*-XO' )
        } //5,7,4*
    if ( JogadaFeita == '-O-*-X-*XXO' ) {
        return Mostra( '-OO*-X-*XXO' )
        } //5,7,5*
 
    if ( JogadaFeita == '---*-OX*X--' ) {
        return Mostra( '-O-*-OX*X--' )
        } //6,1*
    if ( JogadaFeita == '---*-OX*-X-' ) {
        return Mostra( '---*-OX*-XO' )
        } //6,2*
    if ( JogadaFeita == '---*-OX*--X' ) {
        return Mostra( '--O*-OX*--X' )
        } //6,3*
 
    if ( JogadaFeita == 'XO-*-OX*X--' ) {
        return Mostra( 'XQ-*-QX*XQ-' )
        } //6,1,1
    if ( JogadaFeita == '-OX*-OX*X--' ) {
        return Mostra( '-QX*-QX*XQ-' )
        } //6,1,2
    if ( JogadaFeita == '-O-*XOX*X--' ) {
        return Mostra( '-Q-*XQX*XQ-' )
        } //6,1,3
    if ( JogadaFeita == '-O-*-OX*XX-' ) {
        return Mostra( '-O-*-OX*XXO' )
        } //6,1,4*
    if ( JogadaFeita == '-O-*-OX*X-X' ) {
        return Mostra( '-Q-*-QX*XQX' )
        } //6,1,5
 
    if ( JogadaFeita == 'X--*-OX*-XO' ) {
        return Mostra( 'X--*-OX*OXO' )
        } //6,2,1*
    if ( JogadaFeita == '-X-*-OX*-XO' ) {
        return Mostra( 'QX-*-QX*-XQ' )
        } //6,2,2
    if ( JogadaFeita == '--X*-OX*-XO' ) {
        return Mostra( 'Q-X*-QX*-XQ' )
        } //6,2,3
    if ( JogadaFeita == '---*XOX*-XO' ) {
        return Mostra( 'Q--*XQX*-XQ' )
        } //6,2,4
    if ( JogadaFeita == '---*-OX*XXO' ) {
        return Mostra( 'Q--*-QX*XXQ' )
        } //6,2,5
 
    if ( JogadaFeita == 'X-O*-OX*--X' ) {
        return Mostra( 'X-Q*-QX*Q-X' )
        } //6,3,1
    if ( JogadaFeita == '-XO*-OX*--X' ) {
        return Mostra( '-XQ*-QX*Q-X' )
        } //6,3,2
    if ( JogadaFeita == '--O*XOX*--X' ) {
        return Mostra( '--Q*XQX*Q-X' )
        } //6,3,3
    if ( JogadaFeita == '--O*-OX*X-X' ) {
        return Mostra( '--O*-OX*XOX' )
        } //6,3,4*
    if ( JogadaFeita == '--O*-OX*-XX' ) {
        return Mostra( '--Q*-QX*QXX' )
        } //6,3,5
 
    if ( JogadaFeita == '---*-O-*XX-' ) {
        return Mostra( '---*-O-*XXO' )
        } //7,1*
    if ( JogadaFeita == '---*-O-*X-X' ) {
        return Mostra( '---*-O-*XOX' )
        } //7,2*
 
    if ( JogadaFeita == 'X--*-O-*XXO' ) {
        return Mostra( 'X--*OO-*XXO' )
        } //7,1,1*
    if ( JogadaFeita == '-X-*-O-*XXO' ) {
        return Mostra( 'QX-*-Q-*XXQ' )
        } //7,1,2
    if ( JogadaFeita == '--X*-O-*XXO' ) {
        return Mostra( 'Q-X*-Q-*XXQ' )
        } //7,1,3
    if ( JogadaFeita == '---*XO-*XXO' ) {
        return Mostra( 'Q--*XQ-*XXQ' )
        } //7,1,4
    if ( JogadaFeita == '---*-OX*XXO' ) {
        return Mostra( 'Q--*-QX*XXQ' )
        } //7,1,5
 
    if ( JogadaFeita == 'X--*-O-*XOX' ) {
        return Mostra( 'XQ-*-Q-*XQX' )
        } //7,2,1
    if ( JogadaFeita == '-X-*-O-*XOX' ) {
        return Mostra( '-X-*-OO*XOX' )
        } //7,2,2*
    if ( JogadaFeita == '--X*-O-*XOX' ) {
        return Mostra( '-QX*-Q-*XQX' )
        } //7,2,3
    if ( JogadaFeita == '---*XO-*XOX' ) {
        return Mostra( '-Q-*XQ-*XQX' )
        } //7,2,4
    if ( JogadaFeita == '---*-OX*XOX' ) {
        return Mostra( '-Q-*-QX*XQX' )
        } //7,2,5
 
    if ( JogadaFeita == '---*-O-*-XX' ) {
        return Mostra( '---*-O-*OXX' )
        } //8,1*
 
    if ( JogadaFeita == 'X--*-O-*OXX' ) {
        return Mostra( 'X-Q*-Q-*QXX' )
        } //8,1,1
    if ( JogadaFeita == '-X-*-O-*OXX' ) {
        return Mostra( '-XQ*-Q-*QXX' )
        } //8,1,2
    if ( JogadaFeita == '--X*-O-*OXX' ) {
        return Mostra( '--X*-OO*OXX' )
        } //8,1,3*
    if ( JogadaFeita == '---*XO-*OXX' ) {
        return Mostra( '--Q*XQ-*QXX' )
        } //8,1,4
    if ( JogadaFeita == '---*-OX*OXX' ) {
        return Mostra( '--Q*-QX*QXX' )
        } //8,1,5
 
    // Respostas para as quarta e quinta jogadas
 
    // Respostas para 1,1,3*
    if ( JogadaFeita == 'XXO*OOX*X--' ) {
        return Mostra( 'XXO*OOX*X-O' )
        }//*
    if ( JogadaFeita == 'XXO*OO-*XX-' ) {
        return Mostra( 'XXO*QQQ*XX-' )
        }
    if ( JogadaFeita == 'XXO*OO-*X-X' ) {
        return Mostra( 'XXO*QQQ*X-X' )
        }
 
    if ( JogadaFeita == 'XXO*OOX*XXO' ) {
        return Mostra( 'XXO*OOX*XXO' )
        }
 
    // Respostas para 1,2,4*
    if ( JogadaFeita == 'XOX*XOO*-X-' ) {
        return Mostra( 'XOX*XOO*OX-' )
        }//*
    if ( JogadaFeita == 'XOX*-OO*XX-' ) {
        return Mostra( 'XOX*QQQ*XX-' )
        }
    if ( JogadaFeita == 'XOX*-OO*-XX' ) {
        return Mostra( 'XOX*QQQ*-XX' )
        }
 
    if ( JogadaFeita == 'XOX*XOO*OXX' ) {
        return Mostra( 'XOX*XOO*OXX' )
        }
 
    //Respostas para 1,3,2*
    if ( JogadaFeita == 'XOX*XOX*O--' ) {
        return Mostra( 'XQX*XQX*OQ-' )
        }
    if ( JogadaFeita == 'XOX*XO-*OX-' ) {
        return Mostra( 'XOX*XO-*OXO' )
        }//*
    if ( JogadaFeita == 'XOX*XO-*O-X' ) {
        return Mostra( 'XQX*XQ-*OQX' )
        }
 
    if ( JogadaFeita == 'XOX*XOX*OXO' ) {
        return Mostra( 'XOX*XOX*OXO' )
        }
 
    //Respostas para 1,4,4*
    if ( JogadaFeita == 'XOX*-OX*OX-' ) {
        return Mostra( 'XOX*-OX*OXO' )
        }//*
    if ( JogadaFeita == 'XO-*XOX*OX-' ) {
        return Mostra( 'XOQ*XQX*QX-' )
        }
    if ( JogadaFeita == 'XO-*-OX*OXX' ) {
        return Mostra( 'XOQ*-QX*QXX' )
        }
 
    if ( JogadaFeita == 'XOX*XOX*OXO' ) {
        return Mostra( 'XOX*XOX*OXO' )
        }
 
    //Respostas para 1,5,3*
    if ( JogadaFeita == 'XX-*OOX*XO-' ) {
        return Mostra( 'XXO*OOX*XO-' )
        }
    if ( JogadaFeita == 'X-X*OOX*XO-' ) {
        return Mostra( 'XQX*OQX*XQ-' )
        }//*
    if ( JogadaFeita == 'X--*OOX*XOX' ) {
        return Mostra( 'XQ-*OQX*XQX' )
        }//*
 
    if ( JogadaFeita == 'XXO*OOX*XOX' ) {
        return Mostra( 'XXO*OOX*XOX' )
        }
 
    //Respostas para 1,6,3*
    if ( JogadaFeita == 'XXO*OOX*-X-' ) {
        return Mostra( 'XXQ*OQX*QX-' )
        }
    if ( JogadaFeita == 'X-O*OOX*XX-' ) {
        return Mostra( 'X-O*OOX*XXO' )
        }//*
    if ( JogadaFeita == 'X-O*OOX*-XX' ) {
        return Mostra( 'X-Q*OQX*QXX' )
        }
 
    if ( JogadaFeita == 'XXO*OOX*XXO' ) {
        return Mostra( 'XXO*OOX*XXO' )
        }
 
    //Respostas para 1,7,3*
    if ( JogadaFeita == 'XX-*XOO*O-X' ) {
        return Mostra( 'XXQ*XQO*Q-X' )
        }
    if ( JogadaFeita == 'X-X*XOO*O-X' ) {
        return Mostra( 'XOX*XOO*O-X' )
        }//*
    if ( JogadaFeita == 'X--*XOO*OXX' ) {
        return Mostra( 'X-Q*XQO*QXX' )
        }
 
    if ( JogadaFeita == 'XOX*XOO*OXX' ) {
        return Mostra( 'XOX*XOO*OXX' )
        }
 
    //Respostas para 2,1,5*
    if ( JogadaFeita == 'OXX*XOO*--X' ) {
        return Mostra( 'OXX*XOO*O-X' )
        }//*
    if ( JogadaFeita == 'OXX*-OO*X-X' ) {
        return Mostra( 'OXX*QQQ*X-X' )
        }
    if ( JogadaFeita == 'OXX*-OO*-XX' ) {
        return Mostra( 'OXX*QQQ*-XX' )
        }
 
    if ( JogadaFeita == 'OXX*XOO*OXX' ) {
        return Mostra( 'OXX*XOO*OXX' )
        }
 
    //Respostas para 2,2,5*
    if ( JogadaFeita == 'OXO*XOX*--X' ) {
        return Mostra( 'OXQ*XQX*Q-X' )
        }
    if ( JogadaFeita == 'OXO*XO-*X-X' ) {
        return Mostra( 'OXO*XO-*XOX' )
        }//*
    if ( JogadaFeita == 'OXO*XO-*-XX' ) {
        return Mostra( 'OXQ*XQ-*QXX' )
        }
 
    if ( JogadaFeita == 'OXO*XOX*XOX' ) {
        return Mostra( 'OXO*XOX*XOX' )
        }
 
    //Respostas para 2,3,3*
    if ( JogadaFeita == 'XXO*-OX*X-O' ) {
        return Mostra( 'XXO*OOX*X-O' )
        }//*
    if ( JogadaFeita == '-XO*XOX*X-O' ) {
        return Mostra( 'QXO*XQX*X-Q' )
        }
    if ( JogadaFeita == '-XO*-OX*XXO' ) {
        return Mostra( 'QXO*-QX*XXQ' )
        }
 
    if ( JogadaFeita == 'XXO*OOX*XXO' ) {
        return Mostra( 'XXO*OOX*X-O' )
        }
 
    //Respostas para 2,4,3*
    if ( JogadaFeita == 'OXX*XOO*X--' ) {
        return Mostra( 'QXX*XQO*X-Q' )
        }
    if ( JogadaFeita == 'OX-*XOO*XX-' ) {
        return Mostra( 'QX-*XQO*XXQ' )
        }
    if ( JogadaFeita == 'OX-*XOO*X-X' ) {
        return Mostra( 'OX-*XOO*XOX' )
        }//*
 
    if ( JogadaFeita == 'OXX*XOO*XOX' ) {
        return Mostra( 'OXX*XOO*XOX' )
        }
 
    //Respostas para 2,5,1*
    if ( JogadaFeita == 'XXO*XO-*-XO' ) {
        return Mostra( 'XXQ*XQ-*QXO' )
        }
    if ( JogadaFeita == 'XXO*-OX*-XO' ) {
        return Mostra( 'XXQ*-QX*QXO' )
        }
    if ( JogadaFeita == 'XXO*-O-*XXO' ) {
        return Mostra( 'XXQ*-OQ*XXQ' )
        }
 
    //Respostas para 2,6,3*
    if ( JogadaFeita == 'XXO*OOX*--X' ) {
        return Mostra( 'XXQ*OQX*Q-X' )
        }
    if ( JogadaFeita == '-XO*OOX*X-X' ) {
        return Mostra( '-XO*OOX*XOX' )
        }//*
    if ( JogadaFeita == '-XO*OOX*-XX' ) {
        return Mostra( '-XQ*OQX*QXX' )
        }
 
    if ( JogadaFeita == 'XXO*OOX*X-X' ) {
        return Mostra( '-XO*OOX*XOX' )
        }
 
    //Respostas para 3,1,4*
    if ( JogadaFeita == 'OOX*XOX*-X-' ) {
        return Mostra( 'QOX*XQX*-XQ' )
        }
    if ( JogadaFeita == 'OOX*XO-*XX-' ) {
        return Mostra( 'QOX*XQ-*XXQ' )
        }
    if ( JogadaFeita == 'OOX*XO-*-XX' ) {
        return Mostra( 'OOX*XO-*OXX' )
        }//*
 
    if ( JogadaFeita == 'OOX*XOX*OXX' ) {
        return Mostra( 'OOX*XOX*OXX' )
        }
 
    //Respostas para 3,2,1*
    if ( JogadaFeita == 'XOX*XOX*--O' ) {
        return Mostra( 'XQX*XQX*-QO' )
        }
    if ( JogadaFeita == 'XOX*-OX*X-O' ) {
        return Mostra( 'XQX*-QX*XQO' )
        }
    if ( JogadaFeita == 'XOX*-OX*-XO' ) {
        return Mostra( 'XOX*-OX*OXO' )
        }//*
 
    if ( JogadaFeita == 'XOX*XOX*-XO' ) {
        return Mostra( 'XOX*XOX*OXO' )
        }
 
    //Respostas para 3,3,3*
    if ( JogadaFeita == 'X-X*OOX*X-O' ) {
        return Mostra( 'XOX*OOX*X-O' )
        }//*
    if ( JogadaFeita == '-XX*OOX*X-O' ) {
        return Mostra( 'QXX*OQX*X-Q' )
        }
    if ( JogadaFeita == '--X*OOX*XXO' ) {
        return Mostra( 'Q-X*OQX*XXQ' )
        }
 
    if ( JogadaFeita == 'XOX*OOX*XXO' ) {
        return Mostra( 'XOX*OOX*XXO' )
        }
 
    //Respostas para 3,4,3*
    if ( JogadaFeita == 'X-X*OOX*-XO' ) {
        return Mostra( 'XOX*OOX*-XO' )
        }//*
    if ( JogadaFeita == '-XX*OOX*-XO' ) {
        return Mostra( 'QXX*OQX*-XQ' )
        }
    if ( JogadaFeita == '--X*OOX*XXO' ) {
        return Mostra( 'Q-X*OQX*XXQ' )
        }
 
    if ( JogadaFeita == 'XOX*OOX*XXO' ) {
        return Mostra( 'XOX*OOX*XXO' )
        }
 
    //Resposta para 3,5,3*
    if ( JogadaFeita == 'X-X*XOO*-OX' ) {
        return Mostra( 'XQX*XQO*-QX' )
        }
    if ( JogadaFeita == '-XX*XOO*-OX' ) {
        return Mostra( 'OXX*XOO*-OX' )
        }//*
    if ( JogadaFeita == '--X*XOO*XOX' ) {
        return Mostra( '-QX*XQO*XQX' )
        }
 
    if ( JogadaFeita == 'OXX*XOO*XOX' ) {
        return Mostra( 'OXX*XOO*XOX' )
        }
 
    //Resposta para 4,1,3*
    if ( JogadaFeita == 'OXO*XOX*X--' ) {
        return Mostra( 'QXO*XQX*X-Q' )
        }
    if ( JogadaFeita == 'O-O*XOX*XX-' ) {
        return Mostra( 'Q-O*XQX*XXQ' )
        }
    if ( JogadaFeita == 'O-O*XOX*X-X' ) {
        return Mostra( 'QQQ*XOX*X-X' )
        }
 
    //Respostas para 4,2,5*
    if ( JogadaFeita == 'OX-*XO-*XOX' ) {
        return Mostra( 'OXO*XO-*XOX' )
        }//*
    if ( JogadaFeita == 'O-X*XO-*XOX' ) {
        return Mostra( 'OQX*XQ-*XQX' )
        }
    if ( JogadaFeita == 'O--*XOX*XOX' ) {
        return Mostra( 'OQ-*XQX*XQX' )
        }
 
    if ( JogadaFeita == 'OXO*XOX*XOX' ) {
        return Mostra( 'OXO*XOX*XOX' )
        }
 
    //Respostas para 4,3,3*
    if ( JogadaFeita == 'X-X*XO-*OXO' ) {
        return Mostra( 'XOX*XO-*OXO' )
        }//*
    if ( JogadaFeita == '-XX*XO-*OXO' ) {
        return Mostra( 'QXX*XQ-*OXQ' )
        }
    if ( JogadaFeita == '--X*XOX*OXO' ) {
        return Mostra( 'Q-X*XQX*OXQ' )
        }
 
    if ( JogadaFeita == 'XOX*XOX*OXO' ) {
        return Mostra( 'XOX*XOX*OXO' )
        }
 
    //Respostas para 4,4,5*
    if ( JogadaFeita == 'XO-*XO-*OXX' ) {
        return Mostra( 'XOQ*XQ-*QXX' )
        }
    if ( JogadaFeita == '-OX*XO-*OXX' ) {
        return Mostra( '-OX*XOO*OXX' )
        }//*
    if ( JogadaFeita == '-O-*XOX*OXX' ) {
        return Mostra( '-OQ*XQX*QXX' )
        }
 
    if ( JogadaFeita == 'XOX*XOO*OXX' ) {
        return Mostra( 'XOX*XOO*OXX' )
        }
 
    //Resposta para 5,1,5*
    if ( JogadaFeita == 'XOX*-X-*OXO' ) {
        return Mostra( 'XOX*OX-*OXO' )
        }//*
    if ( JogadaFeita == 'XO-*XX-*OXO' ) {
        return Mostra( 'XO-*XXO*OXO' )
        }//*
    if ( JogadaFeita == 'XO-*-XX*OXO' ) {
        return Mostra( 'XO-*OXX*OXO' )
        }//*
 
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XOX*OXX*OXO' )
        }
    if ( JogadaFeita == 'XOX*XXO*OXO' ) {
        return Mostra( 'XOX*XXO*OXO' )
        }
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XO-*OXX*OXO' )
        }
 
    //Respostas para 5,2,5*
    if ( JogadaFeita == 'XXO*-X-*XOO' ) {
        return Mostra( 'XXQ*-XQ*XOQ' )
        }
    if ( JogadaFeita == '-XO*XX-*XOO' ) {
        return Mostra( '-XQ*XXQ*XOQ' )
        }
    if ( JogadaFeita == '-XO*-XX*XOO' ) {
        return Mostra( '-XO*OXX*XOO' )
        }//*
 
    if ( JogadaFeita == 'XXO*OXX*XOO' ) {
        return Mostra( 'XXO*OXX*XOO' )
        }
 
    //Respostas para 5,3,5*
    if ( JogadaFeita == 'XOX*-X-*OXO' ) {
        return Mostra( 'XOX*OX-*OXO' )
        }//*
    if ( JogadaFeita == '-OX*XX-*OXO' ) {
        return Mostra( '-OX*XXO*OXO' )
        }//*
    if ( JogadaFeita == '-OX*-XX*OXO' ) {
        return Mostra( '-OX*OXX*OXO' )
        }//*
 
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XOX*OXX*OXO' )
        }
    if ( JogadaFeita == 'XOX*XXO*OXO' ) {
        return Mostra( 'XOX*XXO*OXO' )
        }
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XOX*OXX*OXO' )
        }
 
    //Respostas para 5,4,3*
    if ( JogadaFeita == 'X-X*XXO*O-O' ) {
        return Mostra( 'X-X*XXO*QQQ' )
        }
    if ( JogadaFeita == '-XX*XXO*O-O' ) {
        return Mostra( '-XX*XXO*QQQ' )
        }
    if ( JogadaFeita == '--X*XXO*OXO' ) {
        return Mostra( '-OX*XXO*OXO' )
        }//*
 
    if ( JogadaFeita == 'XOX*XXO*OXO' ) {
        return Mostra( 'XOX*XXO*OXO' )
        }
 
    //Respostas para 5,5,1*
    if ( JogadaFeita == 'XX-*OXX*O-O' ) {
        return Mostra( 'X--*OXX*QQQ' )
        }
    if ( JogadaFeita == 'X-X*OXX*O-O' ) {
        return Mostra( 'X--*OXX*QQQ' )
        }
    if ( JogadaFeita == 'X--*OXX*OXO' ) {
        return Mostra( 'XO-*OXX*OXO' )
        }//*
 
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XOX*OXX*OXO' )
        }
 
    //Resposta para 5,5,2*
    if ( JogadaFeita == 'XX-*OXX*-OO' ) {
        return Mostra( 'XX-*OXX*QQQ' )
        }
    if ( JogadaFeita == '-XX*OXX*-OO' ) {
        return Mostra( '-XX*OXX*QQQ' )
        }
    if ( JogadaFeita == '-X-*OXX*XOO' ) {
        return Mostra( '-XO*OXX*XOO' )
        }//*
 
    if ( JogadaFeita == 'XXO*OXX*XOO' ) {
        return Mostra( 'XXO*OXX*XOO' )
        }
 
    //Respostas para 5,5,3*
    if ( JogadaFeita == 'X-X*OXX*O-O' ) {
        return Mostra( 'X-X*OXX*QQQ' )
        }
    if ( JogadaFeita == '-XX*OXX*O-O' ) {
        return Mostra( '-XX*OXX*QQQ' )
        }
    if ( JogadaFeita == '--X*OXX*OXO' ) {
        return Mostra( 'Q-X*QXX*QXO' )
        }
 
    //Respostas para 5,5,4*
    if ( JogadaFeita == 'X-O*OXX*X-O' ) {
        return Mostra( 'XOO*OXX*X-O' )
        }//*
    if ( JogadaFeita == '-XO*OXX*X-O' ) {
        return Mostra( '-XO*OXX*XOO' )
        }//*
    if ( JogadaFeita == '--O*OXX*XXO' ) {
        return Mostra( '-OO*OXX*XXO' )
        }//*
 
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( 'XOO*OXX*XXO' )
        }
    if ( JogadaFeita == 'XXO*OXX*XOO' ) {
        return Mostra( 'XXO*OXX*XOO' )
        }
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( 'XOO*OXX*XXO' )
        }
 
    //Resposta para 5,5,5*
    if ( JogadaFeita == 'XO-*OXX*-XO' ) {
        return Mostra( 'XOO*OXX*-XO' )
        }//*
    if ( JogadaFeita == '-OX*OXX*-XO' ) {
        return Mostra( '-OX*OXX*OXO' )
        }//*
    if ( JogadaFeita == '-O-*OXX*XXO' ) {
        return Mostra( '-OO*OXX*XXO' )
        }//*
 
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( 'XOO*OXX*XXO' )
        }
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XOX*OXX*OXO' )
        }
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( 'XOO*OXX*XXO' )
        }
 
    //Repostas para 5,6,4*
    if ( JogadaFeita == 'X-O*OXX*X-O' ) {
        return Mostra( 'XOO*OXX*X-O' )
        }//*
    if ( JogadaFeita == '-XO*OXX*X-O' ) {
        return Mostra( '-XO*OXX*XOO' )
        }//*
    if ( JogadaFeita == '--O*OXX*XXO' ) {
        return Mostra( '-OO*OXX*XXO' )
        }//*
 
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( 'XOO*OXX*XXO' )
        }
    if ( JogadaFeita == 'XXO*OXX*XOO' ) {
        return Mostra( 'XXO*OXX*XOO' )
        }
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( '-OO*OXX*XXO' )
        }
 
    //Repostas para 5,7,1*
    if ( JogadaFeita == 'XOO*XX-*-XO' ) {
        return Mostra( 'XOQ*XXQ*-XQ' )
        }
    if ( JogadaFeita == 'XOO*-XX*-XO' ) {
        return Mostra( 'XOO*OXX*-XO' )
        }//*
    if ( JogadaFeita == 'XOO*-X-*XXO' ) {
        return Mostra( 'XOQ*-XQ*XXQ' )
        }
 
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( 'XOO*OXX*XXO' )
        }
 
    //Repostas para 5,7,2*
    if ( JogadaFeita == 'XOX*-X-*OXO' ) {
        return Mostra( 'XOX*OX-*OXO' )
        }//*
    if ( JogadaFeita == '-OX*XX-*OXO' ) {
        return Mostra( '-OX*XXO*OXO' )
        }//*
    if ( JogadaFeita == '-OX*-XX*OXO' ) {
        return Mostra( '-OX*OXX*OXO' )
        }//*
 
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XOX*OXX*OXO' )
        }
    if ( JogadaFeita == 'XOX*XXO*OXO' ) {
        return Mostra( 'XOX*XXO*OXO' )
        }
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XOX*OXX*OXO' )
        }
 
    //Repostas para 5,7,3*
    if ( JogadaFeita == 'XO-*XXO*-XO' ) {
        return Mostra( 'XOQ*XXQ*-XQ' )
        }
    if ( JogadaFeita == '-OX*XXO*-XO' ) {
        return Mostra( '-OX*XXO*OXO' )
        }//*
    if ( JogadaFeita == '-O-*XXO*XXO' ) {
        return Mostra( '-OQ*XXQ*XXQ' )
        }
 
    if ( JogadaFeita == 'XOX*XXO*OXO' ) {
        return Mostra( 'XOX*XXO*OXO' )
        }
 
    //Repostas para 5,7,4*
    if ( JogadaFeita == 'XO-*OXX*-XO' ) {
        return Mostra( 'XOO*OXX*-XO' )
        }//*
    if ( JogadaFeita == '-OX*OXX*-XO' ) {
        return Mostra( '-OX*OXX*OXO' )
        }//*
    if ( JogadaFeita == '-O-*OXX*XXO' ) {
        return Mostra( '-OO*OXX*XXO' )
        }//*
 
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( 'XOO*OXX*OXO' )
        }
    if ( JogadaFeita == 'XOX*OXX*OXO' ) {
        return Mostra( 'XOX*OXX*OXO' )
        }
    if ( JogadaFeita == 'XOO*OXX*XXO' ) {
        return Mostra( 'XOO*OXX*XXO' )
        }
 
    //Repostas para 5,7,5*
    if ( JogadaFeita == 'XOO*-X-*XXO' ) {
        return Mostra( 'XOQ*-XQ*XXQ' )
        }
    if ( JogadaFeita == '-OO*XX-*XXO' ) {
        return Mostra( 'QQQ*XX-*XXO' )
        }
    if ( JogadaFeita == '-OO*-XX*XXO' ) {
        return Mostra( 'QQQ*-XX*XXO' )
        }
 
    //Respostas para 6,1,4*
    if ( JogadaFeita == 'XO-*-OX*XXO' ) {
        return Mostra( 'XO-*OOX*XXO' )
        }//*
    if ( JogadaFeita == '-OX*-OX*XXO' ) {
        return Mostra( 'QOX*-QX*XXQ' )
        }
    if ( JogadaFeita == '-O-*XOX*XXO' ) {
        return Mostra( 'QO-*XQX*XXQ' )
        }
 
    if ( JogadaFeita == 'XOX*OOX*XXO' ) {
        return Mostra( 'XOX*OOX*XXO' )
        }
 
    //Respostas para 6,2,1*
    if ( JogadaFeita == 'XXO*-QX*OXO' ) {
        return Mostra( 'XXQ*-QX*QXO' )
        }
    if ( JogadaFeita == 'X-X*-OX*OXO' ) {
        return Mostra( 'XOX*-OX*OXO' )
        }//*
    if ( JogadaFeita == 'X-O*XQX*OXO' ) {
        return Mostra( 'X-Q*XQX*QXO' )
        }
 
    if ( JogadaFeita == 'XOX*XOX*OXO' ) {
        return Mostra( 'XOX*XOX*OXO' )
        }
 
    //Respostas par 6,3,4*
    if ( JogadaFeita == 'X-O*-OX*XOX' ) {
        return Mostra( 'XQO*-QX*XQX' )
        }
    if ( JogadaFeita == '-XO*-OX*XOX' ) {
        return Mostra( 'OXO*-OX*XOX' )
        }//*
    if ( JogadaFeita == '--O*XOX*XOX' ) {
        return Mostra( '-QO*XQX*XQX' )
        }
 
    if ( JogadaFeita == 'OXO*XOX*XOX' ) {
        return Mostra( 'OXO*XOX*XOX' )
        }
 
    //Respostas para 7,1,1*
    if ( JogadaFeita == 'XX-*OO-*XXO' ) {
        return Mostra( 'XX-*QQQ*XXO' )
        }
    if ( JogadaFeita == 'X-X*OO-*XXO' ) {
        return Mostra( 'X-X*QQQ*XXO' )
        }
    if ( JogadaFeita == 'X--*OOX*XXO' ) {
        return Mostra( 'X-O*OOX*XXO' )
        }//*
 
    if ( JogadaFeita == 'XXO*OOX*XXO' ) {
        return Mostra( 'XXO*OOX*XXO' )
        }
 
    //Respostas para 7,2,2*
    if ( JogadaFeita == 'XX-*-OO*XOX' ) {
        return Mostra( 'XX-*QQQ*XOX' )
        }
    if ( JogadaFeita == '-XX*-OO*XOX' ) {
        return Mostra( '-XX*QQQ*XOX' )
        }
    if ( JogadaFeita == '-X-*XOO*XOX' ) {
        return Mostra( 'OX-*XOO*XOX' )
        }//*
 
    if ( JogadaFeita == 'OXX*XOO*XOX' ) {
        return Mostra( 'OXX*XOO*XOX' )
        }
 
    //Respostas para 8,1,3*
    if ( JogadaFeita == 'X-X*-OO*OXX' ) {
        return Mostra( '--X*QQQ*OXX' )
        }
    if ( JogadaFeita == '-XX*-OO*OXX' ) {
        return Mostra( '--X*QQQ*OXX' )
        }
    if ( JogadaFeita == '--X*XOO*OXX' ) {
        return Mostra( 'O-X*XOO*OXX' )
        }//*
 
    if ( JogadaFeita == 'OXX*XOO*OXX' ) {
        return Mostra( 'OXX*XOO*OXX' )
        }
 
    // JOGO COMEÇADO POR JOVIA
 
    // Respostas para a primeira jogada
 
    if ( JogadaFeita == 'X--*---*--O' ) {
        return Mostra( 'X--*---*O-O' )
        } //1*
    if ( JogadaFeita == '-X-*---*--O' ) {
        return Mostra( '-X-*-O-*--O' )
        } //2*
    if ( JogadaFeita == '--X*---*--O' ) {
        return Mostra( 'O-X*---*--O' )
        } //3*
    if ( JogadaFeita == '---*X--*--O' ) {
        return Mostra( '---*XO-*--O' )
        } //4*
    if ( JogadaFeita == '---*-X-*--O' ) {
        return Mostra( 'O--*-X-*--O' )
        } //5*
    if ( JogadaFeita == '---*--X*--O' ) {
        return Mostra( '---*-OX*--O' )
        } //6*
    if ( JogadaFeita == '---*---*X-O' ) {
        return Mostra( 'O--*---*X-O' )
        } //7*
    if ( JogadaFeita == '---*---*-XO' ) {
        return Mostra( '---*-O-*-XO' )
        } //8*
 
    // Respostas para as jogadas restantes

    //Resposta para 1*
    if ( JogadaFeita == 'XX-*---*O-O' ) {
        return Mostra( 'XX-*---*QQQ' )
        } 
    if ( JogadaFeita == 'X-X*---*O-O' ) {
        return Mostra( 'X-X*---*QQQ' )
        } 
    if ( JogadaFeita == 'X--*X--*O-O' ) {
        return Mostra( 'X--*X--*QQQ' )
        } 
    if ( JogadaFeita == 'X--*-X-*O-O' ) {
        return Mostra( 'X--*-X-*QQQ' )
        } 
    if ( JogadaFeita == 'X--*--X*O-O' ) {
        return Mostra( 'X--*--X*QQQ' )
        } 
    if ( JogadaFeita == 'X--*---*OXO' ) {
        return Mostra( 'X-O*---*OXO' )
        } //*
 
    if ( JogadaFeita == 'XXO*---*OXO' ) {
        return Mostra( 'XXQ*-Q-*QXO' )
        }
    if ( JogadaFeita == 'X-O*X--*OXO' ) {
        return Mostra( 'X-Q*XQ-*QXO' )
        }
    if ( JogadaFeita == 'X-O*-X-*OXO' ) {
        return Mostra( 'X-Q*-XQ*OXQ' )
        }
    if ( JogadaFeita == 'X-O*--X*OXO' ) {
        return Mostra( 'X-Q*-QX*QXO' )
        }
 
    //Respostas para 2*
    if ( JogadaFeita == 'XX-*-O-*--O' ) {
        return Mostra( 'XXO*-O-*--O' )
        }//*
    if ( JogadaFeita == '-XX*-O-*--O' ) {
        return Mostra( 'QXX*-Q-*--Q' )
        }
    if ( JogadaFeita == '-X-*XO-*--O' ) {
        return Mostra( 'QX-*XQ-*--Q' )
        }
    if ( JogadaFeita == '-X-*-OX*--O' ) {
        return Mostra( 'QX-*-QX*--Q' )
        }
    if ( JogadaFeita == '-X-*-O-*X-O' ) {
        return Mostra( 'QX-*-Q-*X-Q' )
        }
    if ( JogadaFeita == '-X-*-O-*-XO' ) {
        return Mostra( 'QX-*-Q-*-XQ' )
        }
 
    if ( JogadaFeita == 'XXO*XO-*--O' ) {
        return Mostra( 'XXQ*XOQ*--Q' )
        }
    if ( JogadaFeita == 'XXO*-OX*--O' ) {
        return Mostra( 'XXQ*-QX*Q-O' )
        }
    if ( JogadaFeita == 'XXO*-O-*X-O' ) {
        return Mostra( 'XXQ*-OQ*X-Q' )
        }
    if ( JogadaFeita == 'XXO*-O-*-XO' ) {
        return Mostra( 'XXQ*-OQ*-XQ' )
        }
 
    //Respostas para 3*
    if ( JogadaFeita == 'OXX*---*--O' ) {
        return Mostra( 'QXX*-Q-*--Q' )
        }
    if ( JogadaFeita == 'O-X*X--*--O' ) {
        return Mostra( 'Q-X*XQ-*--Q' )
        }
    if ( JogadaFeita == 'O-X*-X-*--O' ) {
        return Mostra( 'O-X*-X-*O-O' )
        }//*
    if ( JogadaFeita == 'O-X*--X*--O' ) {
        return Mostra( 'Q-X*-QX*--Q' )
        }
    if ( JogadaFeita == 'O-X*---*X-O' ) {
        return Mostra( 'Q-X*-Q-*X-Q' )
        }
    if ( JogadaFeita == 'O-X*---*-XO' ) {
        return Mostra( 'Q-X*-Q-*-XQ' )
        }
 
    if ( JogadaFeita == 'OXX*-X-*O-O' ) {
        return Mostra( 'OXX*-X-*QQQ' )
        }
    if ( JogadaFeita == 'O-X*XX-*O-O' ) {
        return Mostra( 'O-X*XX-*QQQ' )
        }
    if ( JogadaFeita == 'O-X*-XX*O-O' ) {
        return Mostra( 'O-X*-XX*QQQ' )
        }
    if ( JogadaFeita == 'O-X*-X-*OXO' ) {
        return Mostra( 'Q-X*QX-*QXO' )
        }
 
    //Respostas para 4*
    if ( JogadaFeita == 'X--*XO-*--O' ) {
        return Mostra( 'X--*XO-*O-O' )
        }//*
    if ( JogadaFeita == '-X-*XO-*--O' ) {
        return Mostra( 'QX-*XQ-*--Q' )
        }
    if ( JogadaFeita == '--X*XO-*--O' ) {
        return Mostra( 'Q-X*XQ-*--Q' )
        }
    if ( JogadaFeita == '---*XOX*--O' ) {
        return Mostra( 'Q--*XQX*--Q' )
        }
    if ( JogadaFeita == '---*XO-*X-O' ) {
        return Mostra( 'Q--*XQ-*X-Q' )
        }
    if ( JogadaFeita == '---*XO-*-XO' ) {
        return Mostra( 'Q--*XQ-*-XQ' )
        }
 
    if ( JogadaFeita == 'XX-*XO-*O-O' ) {
        return Mostra( 'XX-*XO-*QQQ' )
        }
    if ( JogadaFeita == 'X-X*XO-*O-O' ) {
        return Mostra( 'X-X*XO-*QQQ' )
        }
    if ( JogadaFeita == 'X--*XOX*O-O' ) {
        return Mostra( 'X--*XOX*QQQ' )
        }
    if ( JogadaFeita == 'X--*XO-*OXO' ) {
        return Mostra( 'X-Q*XQ-*QXO' )
        }
 
    //Respostas para 5*
    if ( JogadaFeita == 'OX-*-X-*--O' ) {
        return Mostra( 'OX-*-X-*-OO' )
        }//5,1*
    if ( JogadaFeita == 'O-X*-X-*--O' ) {
        return Mostra( 'O-X*-X-*O-O' )
        }//5,2*
    if ( JogadaFeita == 'O--*XX-*--O' ) {
        return Mostra( 'O--*XXO*--O' )
        }//5,3*
    if ( JogadaFeita == 'O--*-XX*--O' ) {
        return Mostra( 'O--*OXX*--O' )
        }//5,4*
    if ( JogadaFeita == 'O--*-X-*X-O' ) {
        return Mostra( 'O-O*-X-*X-O' )
        }//5,5*
    if ( JogadaFeita == 'O--*-X-*-XO' ) {
        return Mostra( 'OO-*-X-*-XO' )
        }//5,6*
 
    //Respostas para 5,1*
    if ( JogadaFeita == 'OXX*-X-*-OO' ) {
        return Mostra( 'OXX*-X-*QQQ' )
        }
    if ( JogadaFeita == 'OX-*XX-*-OO' ) {
        return Mostra( 'OX-*XX-*QQQ' )
        }
    if ( JogadaFeita == 'OX-*-XX*-OO' ) {
        return Mostra( 'OX-*-XX*QQQ' )
        }
    if ( JogadaFeita == 'OX-*-X-*XOO' ) {
        return Mostra( 'OXO*-X-*XOO' )
        }//*
 
    if ( JogadaFeita == 'OXO*XX-*XOO' ) {
        return Mostra( 'OXQ*XXQ*XOQ' )
        }
    if ( JogadaFeita == 'OXO*-XX*XOO' ) {
        return Mostra( 'OXO*OXX*XOO' )
        }
 
    //Respostas para 5,2*
    if ( JogadaFeita == 'OXX*-X-*O-O' ) {
        return Mostra( 'OXX*-X-*QQQ' )
        }
    if ( JogadaFeita == 'O-X*XX-*O-O' ) {
        return Mostra( 'O-X*XX-*QQQ' )
        }
    if ( JogadaFeita == 'O-X*-XX*O-O' ) {
        return Mostra( 'O-X*-XX*QQQ' )
        }
    if ( JogadaFeita == 'O-X*-X-*OXO' ) {
        return Mostra( 'Q-X*QX-*QXO' )
        }
 
    //Respostas para 5,3*
    if ( JogadaFeita == 'OX-*XXO*--O' ) {
        return Mostra( 'OXQ*XXQ*--Q' )
        }
    if ( JogadaFeita == 'O-X*XXO*--O' ) {
        return Mostra( 'O-X*XXO*O-O' )
        }//*
    if ( JogadaFeita == 'O--*XXO*X-O' ) {
        return Mostra( 'O-Q*XXQ*X-Q' )
        }
    if ( JogadaFeita == 'O--*XXO*-XO' ) {
        return Mostra( 'O-Q*XXQ*-XQ' )
        }
 
    if ( JogadaFeita == 'OXX*XXO*O-O' ) {
        return Mostra( 'OXX*XXO*QQQ' )
        }
    if ( JogadaFeita == 'O-X*XXO*OXO' ) {
        return Mostra( 'OOX*XXO*OXO' )
        }
 
    //Respostas para 5,4*
    if ( JogadaFeita == 'OX-*OXX*--O' ) {
        return Mostra( 'QX-*QXX*Q-O' )
        }
    if ( JogadaFeita == 'O-X*OXX*--O' ) {
        return Mostra( 'Q-X*QXX*Q-O' )
        }
    if ( JogadaFeita == 'O--*OXX*X-O' ) {
        return Mostra( 'O-O*OXX*X-O' )
        }//*
    if ( JogadaFeita == 'O--*OXX*-XO' ) {
        return Mostra( 'Q--*QXX*QXO' )
        }
 
    if ( JogadaFeita == 'OXO*OXX*X-O' ) {
        return Mostra( 'OXO*OXX*XOO' )
        }
    if ( JogadaFeita == 'O-O*OXX*XXO' ) {
        return Mostra( 'QQQ*OXX*XXO' )
        }
 
    //Respostas para 5,5*
    if ( JogadaFeita == 'OXO*-X-*X-O' ) {
        return Mostra( 'OXQ*-XQ*X-Q' )
        }
    if ( JogadaFeita == 'O-O*XX-*X-O' ) {
        return Mostra( 'QQQ*XX-*X-O' )
        }
    if ( JogadaFeita == 'O-O*-XX*X-O' ) {
        return Mostra( 'QQQ*-XX*X-O' )
        }
    if ( JogadaFeita == 'O-O*-X-*XXO' ) {
        return Mostra( 'QQQ*-X-*XXO' )
        }
 
    //Respostas para 5,6*
    if ( JogadaFeita == 'OOX*-X-*-XO' ) {
        return Mostra( 'OOX*-X-*OXO' )
        }//*
    if ( JogadaFeita == 'OO-*XX-*-XO' ) {
        return Mostra( 'QQQ*XX-*-XO' )
        }
    if ( JogadaFeita == 'OO-*-XX*-XO' ) {
        return Mostra( 'QQQ*-XX*-XO' )
        }
    if ( JogadaFeita == 'OO-*-X-*XXO' ) {
        return Mostra( 'QQQ*-X-*XXO' )
        }
 
    if ( JogadaFeita == 'OOX*XX-*OXO' ) {
        return Mostra( 'OOX*XXO*OXO' )
        }
    if ( JogadaFeita == 'OOX*-XX*OXO' ) {
        return Mostra( 'QOX*QXX*QXO' )
        }
 
    //Respostas para 6*
    if ( JogadaFeita == 'X--*-OX*--O' ) {
        return Mostra( 'X--*-OX*O-O' )
        }//*
    if ( JogadaFeita == '-X-*-OX*--O' ) {
        return Mostra( 'QX-*-QX*--Q' )
        }
    if ( JogadaFeita == '--X*-OX*--O' ) {
        return Mostra( 'Q-X*-QX*--Q' )
        }
    if ( JogadaFeita == '---*XOX*--O' ) {
        return Mostra( 'Q--*XQX*--Q' )
        }
    if ( JogadaFeita == '---*-OX*X-O' ) {
        return Mostra( 'Q--*-QX*X-Q' )
        }
    if ( JogadaFeita == '---*-OX*-XO' ) {
        return Mostra( 'Q--*-QX*-XQ' )
        }
 
    if ( JogadaFeita == 'XX-*-OX*O-O' ) {
        return Mostra( 'XX-*-OX*QQQ' )
        }
    if ( JogadaFeita == 'X-X*-OX*O-O' ) {
        return Mostra( 'X-X*-OX*QQQ' )
        }
    if ( JogadaFeita == 'X--*XOX*O-O' ) {
        return Mostra( 'X--*XOX*QQQ' )
        }
    if ( JogadaFeita == 'X--*-OX*OXO' ) {
        return Mostra( 'X-Q*-QX*QXO' )
        }
 
    //Respostas para 7*
    if ( JogadaFeita == 'OX-*---*X-O' ) {
        return Mostra( 'QX-*-Q-*X-Q' )
        }
    if ( JogadaFeita == 'O-X*---*X-O' ) {
        return Mostra( 'Q-X*-Q-*X-Q' )
        }
    if ( JogadaFeita == 'O--*X--*X-O' ) {
        return Mostra( 'Q--*XQ-*X-Q' )
        }
    if ( JogadaFeita == 'O--*-X-*X-O' ) {
        return Mostra( 'O-O*-X-*X-O' )
        }//*
    if ( JogadaFeita == 'O--*--X*X-O' ) {
        return Mostra( 'Q--*-QX*X-Q' )
        }
    if ( JogadaFeita == 'O--*---*XXO' ) {
        return Mostra( 'Q--*-Q-*XXQ' )
        }
 
    if ( JogadaFeita == 'OXO*-X-*X-O' ) {
        return Mostra( 'OXQ*-XQ*X-Q' )
        }
    if ( JogadaFeita == 'O-O*XX-*X-O' ) {
        return Mostra( 'QQQ*XX-*X-O' )
        }
    if ( JogadaFeita == 'O-O*-XX*X-O' ) {
        return Mostra( 'QQQ*-XX*X-O' )
        }
    if ( JogadaFeita == 'O-O*-X-*XXO' ) {
        return Mostra( 'QQQ*-X-*XXO' )
        }
 
    //Respostas para 8*
    if ( JogadaFeita == 'X--*-O-*-XO' ) {
        return Mostra( 'X-O*-O-*-XO' )
        }//*
    if ( JogadaFeita == '-X-*-O-*-XO' ) {
        return Mostra( 'QX-*-Q-*-XQ' )
        }
    if ( JogadaFeita == '--X*-O-*-XO' ) {
        return Mostra( 'Q-X*-Q-*-XQ' )
        }
    if ( JogadaFeita == '---*XO-*-XO' ) {
        return Mostra( 'Q--*XQ-*-XQ' )
        }
    if ( JogadaFeita == '---*-OX*-XO' ) {
        return Mostra( 'Q--*-QX*-XQ' )
        }
    if ( JogadaFeita == '---*-O-*XXO' ) {
        return Mostra( 'Q--*-Q-*XXQ' )
        }
 
    if ( JogadaFeita == 'XXO*-O-*-XO' ) {
        return Mostra( 'XXQ*-OQ*-XQ' )
        }
    if ( JogadaFeita == 'X-O*XO-*-XO' ) {
        return Mostra( 'X-Q*XOQ*-XQ' )
        }
    if ( JogadaFeita == 'X-O*-OX*-XO' ) {
        return Mostra( 'X-Q*-QX*QXO' )
        }
    if ( JogadaFeita == 'X-O*-O-*XXO' ) {
        return Mostra( 'X-Q*-OQ*XXQ' )
        }
 
}