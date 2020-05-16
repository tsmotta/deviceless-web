<?php
require_once '../lib/config.php';
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
    "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Mapa do Prédio 43425 - Segundo Andar - Gabinetes de Professores</title>
    <link rel="stylesheet" href="./style/style.css" type="text/css">
    <script type="text/javascript" src="../script/jquery-1.8.3.min.js"></script>
    <!-- run from the minified library file: -->
    <script type="text/javascript" src="./script/main.js"></script>
</head>
<body>

    <h1>Mapa do Prédio 43425 - Segundo Andar</h1>
    
    <img id="btnBack" src="../start/img/btn_Back.png" onclick="window.location='../start/'"/>
    
    <canvas id="viewport" width="1024" height="768"></canvas>

    <img class="kinectCursor" id="kinectLeft" src="../images/kinectLeftNormal.png"/>
    <img class="kinectCursor" id="kinectRight" src="../images/kinectRightNormal.png"/><br/>

    <div id="status">
        <span id="serverStatus">Sem conexão</span>
        <span id="modeName">desconectado</span>
    </div>
    
    <img id="imgHelp" src="../images/help2.png"/>
</body>
</html>
