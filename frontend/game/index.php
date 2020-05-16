<?php
require_once '../lib/config.php';
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
    "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Jogo da Velha</title>
    <link rel="stylesheet" href="./style/style.css" type="text/css">
    <script type="text/javascript" src="../script/jquery-1.8.3.min.js"></script>
    <!-- run from the minified library file: -->
    <script type="text/javascript" src="./script/main.js"></script>
</head>
<body>
    <img id="btnBack" src="../start/img/btn_Back.png" onclick="window.location='../start/'"/>
    
    <div id="board">&nbsp;</div>

    <img id="coord11" class="gameCoord" src="./img/blank.png" style="display:none"/>
    <img id="coord12" class="gameCoord" src="./img/blank.png" style="display:none"/>
    <img id="coord13" class="gameCoord" src="./img/blank.png" style="display:none"/>
    <img id="coord21" class="gameCoord" src="./img/blank.png" style="display:none"/>
    <img id="coord22" class="gameCoord" src="./img/blank.png" style="display:none"/>
    <img id="coord23" class="gameCoord" src="./img/blank.png" style="display:none"/>
    <img id="coord31" class="gameCoord" src="./img/blank.png" style="display:none"/>
    <img id="coord32" class="gameCoord" src="./img/blank.png" style="display:none"/>
    <img id="coord33" class="gameCoord" src="./img/blank.png" style="display:none"/>
    
    <div id="gameResult">Você perdeu!<br/>Jogar de novo<br/>------------<br/>Voltar</div>
    
    <img class="kinectCursor" id="kinectLeft" src="../images/kinectLeftNormal.png"/>
    <img class="kinectCursor" id="kinectRight" src="../images/kinectRightNormal.png"/><br/>

    <div id="status">
        <span id="serverStatus">Sem conexão</span>
        <span id="modeName">desconectado</span>
    </div>
</body>
</html>
