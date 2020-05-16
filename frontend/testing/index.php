<?php
require_once '../lib/config.php';
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
    "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Evaluating Interaction</title>
    <link rel="stylesheet" href="./style/style.css" type="text/css">
    <script type="text/javascript" src="../script/jquery-1.8.3.min.js"></script>
    <!-- run from the minified library file: -->
    <script type="text/javascript" src="./script/main.js"></script>
</head>
<body>
    <img id="btnBack" src="../start/img/btn_Back.png" onclick="window.location='../start/'"/>
    <img id="imgHelp" src="../images/help.png" style="position: absolute; right: 0px; top: 100px; width: 400px"/>
    
    <div class="tooltip" id="mainTooltip" onmouseover="hideTooltip()"></div>

    <canvas id="viewport" width="1024" height="768"></canvas>

    <img class="kinectCursor" id="kinectLeft" src="../images/kinectLeftNormal.png"/>
    <img class="kinectCursor" id="kinectRight" src="../images/kinectRightNormal.png"/><br/>

    <div id="status">
        <span id="serverStatus">Sem conexão</span>
        <span id="modeName">desconectado</span>
    </div>
    
    <input type="button" onclick="resetTest()" value="RESET TEST"/>
    <input type="button" onclick="resetInstance()" value="RESET INSTANCE"/>
    <input type="button" onclick="goToMovements()" value="SKIP"/>
    
    <img id="endTest" src="./img/end.png"/>
    
</body>
</html>
