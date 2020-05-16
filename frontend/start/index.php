<?php
require_once '../lib/config.php';
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
    "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>PubliKinect</title>
    <link rel="stylesheet" href="./style/style.css" type="text/css">
    <script type="text/javascript" src="../script/jquery-1.8.3.min.js"></script>
    <!-- run from the minified library file: -->
    <script type="text/javascript" src="./script/main.js"></script>
</head>
<body>
    <img style="float: right" src="../images/help.png"/>
    
    <div class="background" id="background1">&nbsp;</div>
    <div class="background" id="background2">&nbsp;</div>
    <div class="background" id="background3">&nbsp;</div>
    <div class="background" id="background4">&nbsp;</div>

    <img id="btnTest" class="button" src="./img/btn_Test.png" onclick="window.location='../testing/'"/>
    <img id="btnMap" class="button" src="./img/btn_Map.png" onclick="window.location='../map/'"/>
    <img id="btnGame" class="button" src="./img/btn_Game.png" onclick="window.location='../game/'"/>
    <img id="btnGraph" class="button" src="./img/btn_Graph.png" onclick="window.location='../'"/>
    
    <img class="kinectCursor" id="kinectLeft" src="../images/kinectLeftNormal.png"/>
    <img class="kinectCursor" id="kinectRight" src="../images/kinectRightNormal.png"/><br/>

    <div id="status">
        <span id="serverStatus">Sem conexão</span>
        <span id="modeName">desconectado</span>
    </div>
</body>
</html>
